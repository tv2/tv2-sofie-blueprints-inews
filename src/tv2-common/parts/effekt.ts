import {
	IBlueprintPart,
	IBlueprintPiece,
	NotesContext,
	PieceLifespan,
	TimelineObjectCoreExt,
	TSR,
	VTContent
} from '@sofie-automation/blueprints-integration'
import {
	ActionTakeWithTransitionVariantMix,
	GetTagForTransition,
	literal,
	PartDefinition,
	TimeFromFrames,
	TimelineBlueprintExt,
	TV2BlueprintConfigBase,
	TV2StudioConfigBase
} from 'tv2-common'
import { TV2BlueprintConfig } from '../blueprintConfig'

export function CreateEffektForPartBase(
	context: NotesContext,
	config: TV2BlueprintConfig,
	partDefinition: PartDefinition,
	pieces: IBlueprintPiece[],
	layers: {
		sourceLayer: string
		atemLayer: string
		casparLayer: string
		sisyfosLayer: string
	}
):
	| Pick<
			IBlueprintPart,
			'transitionDuration' | 'transitionKeepaliveDuration' | 'transitionPrerollDuration' | 'autoNext'
	  >
	| Pick<IBlueprintPart, 'transitionDuration' | 'transitionKeepaliveDuration'>
	| {} {
	const effekt = partDefinition.effekt
	const transition = partDefinition.transition

	if (effekt !== undefined) {
		const ret = CreateEffektForPartInner(
			context,
			config,
			pieces,
			effekt.toString(),
			partDefinition.externalId,
			layers,
			`EFFEKT ${effekt}`
		)

		return ret ?? {}
	} else if (transition !== undefined && transition.duration !== undefined) {
		if (transition.style.match(/mix/i)) {
			return CreateMixForPartInner(pieces, partDefinition.externalId, transition.duration, layers) ?? {}
		} else {
			return {}
		}
	} else {
		return {}
	}
}

export function CreateEffektForPartInner<
	StudioConfig extends TV2StudioConfigBase,
	ShowStyleConfig extends TV2BlueprintConfigBase<StudioConfig>
>(
	context: NotesContext,
	config: ShowStyleConfig,
	pieces: IBlueprintPiece[],
	effekt: string,
	externalId: string,
	layers: {
		sourceLayer: string
		atemLayer: string
		casparLayer: string
		sisyfosLayer: string
	},
	label: string
):
	| Pick<
			IBlueprintPart,
			'transitionDuration' | 'transitionKeepaliveDuration' | 'transitionPrerollDuration' | 'autoNext'
	  >
	| false {
	if (!config.showStyle.BreakerConfig) {
		context.warning(`Jingles have not been configured`)
		return false
	}

	const effektConfig = config.showStyle.BreakerConfig.find(
		conf =>
			conf.BreakerName.toString()
				.trim()
				.toUpperCase() === effekt.toUpperCase()
	)
	if (!effektConfig) {
		context.warning(`Could not find effekt ${effekt}`)
		return false
	}

	const file = effektConfig.ClipName.toString()

	if (!file) {
		context.warning(`Could not find file for ${effekt}`)
		return false
	}

	const fileName = config.studio.JingleFolder ? `${config.studio.JingleFolder}/${file}` : ''

	pieces.push(
		literal<IBlueprintPiece>({
			externalId,
			name: label,
			enable: { start: 0, duration: TimeFromFrames(Number(effektConfig.Duration)) },
			outputLayerId: 'jingle', // TODO: Enum
			sourceLayerId: layers.sourceLayer,
			lifespan: PieceLifespan.WithinPart,
			isTransition: true,
			content: literal<VTContent>({
				studioLabel: '',
				fileName,
				path: `${config.studio.NetworkBasePathJingle}\\${
					config.studio.JingleFolder ? `${config.studio.JingleFolder}\\` : ''
				}${file}${config.studio.JingleFileExtension}`, // full path on the source network storage
				mediaFlowIds: [config.studio.JingleMediaFlowId],
				firstWords: '',
				lastWords: '',
				previewFrame: Number(effektConfig.StartAlpha),
				ignoreMediaObjectStatus: config.studio.JingleIgnoreStatus,
				timelineObjects: literal<TimelineObjectCoreExt[]>([
					literal<TSR.TimelineObjCCGMedia & TimelineBlueprintExt>({
						id: '',
						enable: {
							start: 0
						},
						priority: 1,
						layer: layers.casparLayer,
						content: {
							deviceType: TSR.DeviceType.CASPARCG,
							type: TSR.TimelineContentTypeCasparCg.MEDIA,
							file: fileName
						}
					}),
					literal<TSR.TimelineObjAtemDSK>({
						id: '',
						enable: {
							start: Number(config.studio.CasparPrerollDuration)
						},
						priority: 1,
						layer: layers.atemLayer,
						content: {
							deviceType: TSR.DeviceType.ATEM,
							type: TSR.TimelineContentTypeAtem.DSK,
							dsk: {
								onAir: true,
								sources: {
									fillSource: config.studio.AtemSource.JingleFill,
									cutSource: config.studio.AtemSource.JingleKey
								},
								properties: {
									tie: false,
									preMultiply: false,
									clip: config.studio.AtemSettings.CCGClip * 10, // input is percents (0-100), atem uses 1-000,
									gain: config.studio.AtemSettings.CCGGain * 10, // input is percents (0-100), atem uses 1-000,
									mask: {
										enabled: false
									}
								}
							}
						}
					}),
					literal<TSR.TimelineObjSisyfosChannel & TimelineBlueprintExt>({
						id: '',
						enable: {
							start: 0
						},
						priority: 1,
						layer: layers.sisyfosLayer,
						content: {
							deviceType: TSR.DeviceType.SISYFOS,
							type: TSR.TimelineContentTypeSisyfos.CHANNEL,
							isPgm: 1
						}
					})
				])
			})
		})
	)

	return {
		transitionDuration: TimeFromFrames(Number(effektConfig.Duration)) + config.studio.CasparPrerollDuration,
		transitionKeepaliveDuration: TimeFromFrames(Number(effektConfig.StartAlpha)) + config.studio.CasparPrerollDuration,
		transitionPrerollDuration:
			TimeFromFrames(Number(effektConfig.Duration)) -
			TimeFromFrames(Number(effektConfig.EndAlpha)) +
			config.studio.CasparPrerollDuration,
		autoNext: false
	}
}

export function CreateMixForPartInner(
	pieces: IBlueprintPiece[],
	externalId: string,
	durationInFrames: number,
	layers: {
		sourceLayer: string
		atemLayer: string
		casparLayer: string
		sisyfosLayer: string
	}
): Pick<IBlueprintPart, 'transitionDuration' | 'transitionKeepaliveDuration'> {
	pieces.push(
		literal<IBlueprintPiece>({
			enable: {
				start: 0,
				duration: Math.max(TimeFromFrames(durationInFrames), 1000)
			},
			externalId,
			name: `MIX ${durationInFrames}`,
			sourceLayerId: layers.sourceLayer,
			outputLayerId: 'jingle',
			lifespan: PieceLifespan.WithinPart,
			tags: [
				GetTagForTransition(
					literal<ActionTakeWithTransitionVariantMix>({
						type: 'mix',
						frames: durationInFrames
					})
				)
			]
		})
	)

	const transitionDuration = TimeFromFrames(durationInFrames)

	return {
		transitionKeepaliveDuration: transitionDuration,
		transitionDuration
	}
}
