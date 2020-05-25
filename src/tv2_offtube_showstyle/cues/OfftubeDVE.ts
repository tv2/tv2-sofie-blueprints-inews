import {
	IBlueprintAdLibPiece,
	IBlueprintPiece,
	PartContext,
	PieceLifespan,
	TSR
} from 'tv-automation-sofie-blueprints-integration'
import {
	AddParentClass,
	CalculateTime,
	CueDefinitionDVE,
	GetDVETemplate,
	literal,
	PartDefinition,
	PieceMetaData,
	TemplateIsValid
} from 'tv2-common'
import { AdlibTags, Enablers } from 'tv2-constants'
import { OfftubeAbstractLLayer } from '../../tv2_offtube_studio/layers'
import { OfftubeMakeContentDVE } from '../content/OfftubeDVEContent'
import { OfftubeShowstyleBlueprintConfig } from '../helpers/config'
import { OfftubeSourceLayer } from '../layers'
import { makeofftubeDVEIDsUniqueForFlow } from './OfftubeAdlib'

export function OfftubeEvaluateDVE(
	context: PartContext,
	config: OfftubeShowstyleBlueprintConfig,
	pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	partDefinition: PartDefinition,
	parsedCue: CueDefinitionDVE,
	_adlib?: boolean,
	rank?: number
) {
	if (!parsedCue.template) {
		return
	}

	const rawTemplate = GetDVETemplate(config.showStyle.DVEStyles, parsedCue.template)
	if (!rawTemplate) {
		context.warning(`Could not find template ${parsedCue.template}`)
		return
	}

	if (!TemplateIsValid(JSON.parse(rawTemplate.DVEJSON as string))) {
		context.warning(`Invalid DVE template ${parsedCue.template}`)
		return
	}

	const adlibContent = OfftubeMakeContentDVE(
		context,
		config,
		partDefinition,
		parsedCue,
		rawTemplate,
		AddParentClass(partDefinition),
		true
	)

	const pieceContent = OfftubeMakeContentDVE(
		context,
		config,
		partDefinition,
		parsedCue,
		rawTemplate,
		AddParentClass(partDefinition)
	)

	if (adlibContent.valid && pieceContent.valid) {
		const dveAdlib = literal<IBlueprintAdLibPiece>({
			_rank: rank || 0,
			externalId: partDefinition.externalId,
			name: `${parsedCue.template}`,
			outputLayerId: 'selectedAdlib',
			sourceLayerId: OfftubeSourceLayer.SelectedAdLibDVE,
			infiniteMode: PieceLifespan.OutOnNextSegment,
			toBeQueued: true,
			canCombineQueue: true,
			content: adlibContent.content,
			adlibPreroll: Number(config.studio.CasparPrerollDuration) || 0
		})
		adlibPieces.push(dveAdlib)

		adlibPieces.push(
			literal<IBlueprintAdLibPiece>({
				...dveAdlib,
				sourceLayerId: OfftubeSourceLayer.PgmDVE,
				infiniteMode: PieceLifespan.OutOnNextPart,
				tags: [AdlibTags.ADLIB_FLOW_PRODUCER],
				content: {
					...dveAdlib.content,
					timelineObjects: [
						...makeofftubeDVEIDsUniqueForFlow(dveAdlib.content!.timelineObjects),
						literal<TSR.TimelineObjAbstractAny>({
							id: '',
							enable: {
								while: '1'
							},
							priority: 1,
							layer: OfftubeAbstractLLayer.OfftubeAbstractLLayerPgmEnabler,
							content: {
								deviceType: TSR.DeviceType.ABSTRACT
							},
							classes: [Enablers.OFFTUBE_ENABLE_DVE]
						})
					]
				}
			})
		)

		let start = parsedCue.start ? CalculateTime(parsedCue.start) : 0
		start = start ? start : 0
		const end = parsedCue.end ? CalculateTime(parsedCue.end) : undefined
		pieces.push(
			literal<IBlueprintPiece>({
				_id: '',
				externalId: partDefinition.externalId,
				name: `DVE: ${parsedCue.template}`,
				enable: {
					start,
					...(end ? { duration: end - start } : {})
				},
				outputLayerId: 'pgm',
				sourceLayerId: OfftubeSourceLayer.PgmDVE,
				infiniteMode: PieceLifespan.OutOnNextPart,
				toBeQueued: true,
				content: {
					...pieceContent.content,
					timelineObjects: [
						...pieceContent.content.timelineObjects,
						literal<TSR.TimelineObjAbstractAny>({
							id: '',
							enable: {
								while: '1'
							},
							priority: 1,
							layer: OfftubeAbstractLLayer.OfftubeAbstractLLayerPgmEnabler,
							content: {
								deviceType: TSR.DeviceType.ABSTRACT
							},
							classes: [Enablers.OFFTUBE_ENABLE_DVE]
						})
					]
				},
				adlibPreroll: Number(config.studio.CasparPrerollDuration) || 0,
				metaData: literal<PieceMetaData>({
					mediaPlayerSessions: [partDefinition.segmentExternalId]
				})
			})
		)
	}
}
