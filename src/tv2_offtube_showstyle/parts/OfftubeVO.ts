import {
	BlueprintResultPart,
	IBlueprintActionManifest,
	IBlueprintPiece,
	PieceLifespan,
	PieceMetaData
} from 'tv-automation-sofie-blueprints-integration'
import {
	ActionSelectServerClip,
	AddScript,
	CreateAdlibServer,
	CreatePartServerBase,
	GetSisyfosTimelineObjForCamera,
	getStickyLayers,
	literal,
	MakeContentServer,
	PartContext2,
	PartDefinition
} from 'tv2-common'
import { AdlibActionType, AdlibTags } from 'tv2-constants'
import {
	OfftubeAbstractLLayer,
	OfftubeAtemLLayer,
	OfftubeCasparLLayer,
	OfftubeSisyfosLLayer
} from '../../tv2_offtube_studio/layers'
import { OfftubeShowstyleBlueprintConfig } from '../helpers/config'
import { OfftubeEvaluateCues } from '../helpers/EvaluateCues'
import { OfftubeOutputLayers, OfftubeSourceLayer } from '../layers'

export function OfftubeCreatePartVO(
	context: PartContext2,
	config: OfftubeShowstyleBlueprintConfig,
	partDefinition: PartDefinition,
	_segmentExternalId: string,
	totalWords: number,
	totalTime: number
): BlueprintResultPart {
	const basePartProps = CreatePartServerBase(context, config, partDefinition)

	if (basePartProps.invalid) {
		return basePartProps.part
	}

	const part = basePartProps.part.part
	const pieces = basePartProps.part.pieces
	const adLibPieces = basePartProps.part.adLibPieces
	const actions: IBlueprintActionManifest[] = []
	const file = basePartProps.file
	const duration = basePartProps.duration
	const sanitisedScript = partDefinition.script.replace(/\n/g, '').replace(/\r/g, '')
	const actualDuration = (sanitisedScript.length / totalWords) * (totalTime * 1000 - duration) + duration
	// const sanitisedScript = partDefinition.script.replace(/\n/g, '').replace(/\r/g, '')

	// TODO: EFFEKT
	// part = { ...part, ...CreateEffektForpart(context, config, partDefinition, pieces) }

	pieces.push(
		literal<IBlueprintPiece>({
			_id: '',
			externalId: partDefinition.externalId,
			name: file,
			enable: { start: 0 },
			outputLayerId: 'pgm',
			sourceLayerId: OfftubeSourceLayer.PgmVoiceOver,
			infiniteMode: PieceLifespan.OutOnNextPart,
			metaData: literal<PieceMetaData>({
				mediaPlayerSessions: [`adlib_server_${file}`]
			}),
			content: MakeContentServer(
				file,
				`adlib_server_${file}`,
				partDefinition,
				config,
				{
					Caspar: {
						ClipPending: OfftubeCasparLLayer.CasparPlayerClipPending
					},
					Sisyfos: {
						ClipPending: OfftubeSisyfosLLayer.SisyfosSourceClipPending
					},
					ATEM: {
						MEPGM: OfftubeAtemLLayer.AtemMEClean
					}
				},
				actualDuration
			),
			adlibPreroll: config.studio.CasparPrerollDuration
		})
	)

	const adlibServer = CreateAdlibServer(
		config,
		0,
		partDefinition.externalId,
		`adlib_server_${file}`,
		partDefinition,
		file,
		true,
		{
			PgmServer: OfftubeSourceLayer.PgmServer,
			PgmVoiceOver: OfftubeSourceLayer.PgmVoiceOver,
			Caspar: {
				ClipPending: OfftubeCasparLLayer.CasparPlayerClipPending
			},
			ATEM: {
				MEPGM: OfftubeAtemLLayer.AtemMEClean
			},
			Sisyfos: {
				ClipPending: OfftubeSisyfosLLayer.SisyfosSourceClipPending
			},
			STICKY_LAYERS: getStickyLayers(config.studio)
		},
		actualDuration,
		{
			isOfftube: true,
			tagAsAdlib: true,
			serverEnable: OfftubeAbstractLLayer.OfftubeAbstractLLayerServerEnable
		}
	)
	adlibServer.content?.timelineObjects.push(...GetSisyfosTimelineObjForCamera(context, config, 'server'))

	actions.push(
		literal<IBlueprintActionManifest>({
			actionId: AdlibActionType.SELECT_SERVER_CLIP,
			userData: literal<ActionSelectServerClip>({
				type: AdlibActionType.SELECT_SERVER_CLIP,
				file,
				partDefinition,
				duration,
				vo: true
			}),
			userDataManifest: {},
			display: {
				label: `${partDefinition.storyName} ACTION`,
				sourceLayerId: OfftubeSourceLayer.PgmVoiceOver,
				outputLayerId: OfftubeOutputLayers.PGM,
				content: { ...adlibServer.content, timelineObjects: [] },
				tags: [AdlibTags.OFFTUBE_ADLIB_SERVER, AdlibTags.ADLIB_KOMMENTATOR, AdlibTags.ADLIB_FLOW_PRODUCER]
			}
		})
	)
	// TODO: This breaks infinites
	// adlibServer.expectedDuration = (sanitisedScript.length / totalWords) * (totalTime * 1000 - duration) + duration
	// adlibServer.content?.timelineObjects.push(...GetSisyfosTimelineObjForCamera(context, config, 'server'))

	/*adlibServer = MergePiecesAsTimeline(context, config, partDefinition, adlibServer, [
		CueType.Grafik,
		CueType.TargetEngine,
		CueType.VIZ
	])*/

	// adLibPieces.push(adlibServer)

	OfftubeEvaluateCues(context, config, pieces, adLibPieces, actions, partDefinition.cues, partDefinition, {})
	AddScript(partDefinition, pieces, actualDuration, OfftubeSourceLayer.PgmScript)

	if (pieces.length === 0) {
		part.invalid = true
	}

	return {
		part,
		adLibPieces,
		pieces,
		actions
	}
}
