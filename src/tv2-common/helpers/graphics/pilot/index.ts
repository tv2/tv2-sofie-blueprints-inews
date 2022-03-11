import {
	GraphicsContent,
	IBlueprintActionManifest,
	IBlueprintAdLibPiece,
	IBlueprintPart,
	IBlueprintPiece,
	IShowStyleUserContext,
	PieceLifespan,
	TSR,
	WithTimeline
} from '@tv2media/blueprints-integration'
import {
	ActionSelectFullGrafik,
	CreateTimingGraphic,
	CueDefinitionGraphic,
	GetFullGraphicTemplateNameFromCue,
	GetInfiniteModeForGraphic,
	GetPilotGraphicContentViz,
	GetTagForFull,
	GetTagForFullNext,
	GraphicDisplayName,
	GraphicPilot,
	IsTargetingFull,
	IsTargetingOVL,
	IsTargetingTLF,
	IsTargetingWall,
	literal,
	PieceMetaData,
	SisyfosPersistMetaData,
	TV2BlueprintConfig
} from 'tv2-common'
import {
	AdlibActionType,
	AdlibTags,
	GraphicEngine,
	SharedOutputLayers,
	SharedSourceLayers,
	TallyTags
} from 'tv2-constants'
import { t } from '../../translation'
import { CasparPilotGeneratorSettings, GetPilotGraphicContentCaspar } from '../caspar'
import { VizPilotGeneratorSettings } from '../viz'

// Work needed, this should be more generic than expecting showstyles to define how to display pilot graphics
export interface PilotGeneratorSettings {
	caspar: CasparPilotGeneratorSettings
	viz: VizPilotGeneratorSettings
}

export function CreatePilotGraphic(
	config: TV2BlueprintConfig,
	context: IShowStyleUserContext,
	part: Readonly<IBlueprintPart>,
	pieces: IBlueprintPiece[],
	_adlibPieces: IBlueprintAdLibPiece[],
	actions: IBlueprintActionManifest[],
	partId: string,
	parsedCue: CueDefinitionGraphic<GraphicPilot>,
	settings: PilotGeneratorSettings,
	adlib: boolean,
	adlibRank: number,
	externalSegmentId: string
) {
	if (
		parsedCue.graphic.vcpid === undefined ||
		parsedCue.graphic.vcpid === null ||
		parsedCue.graphic.vcpid.toString() === '' ||
		parsedCue.graphic.vcpid.toString().length === 0
	) {
		context.notifyUserWarning('No valid VCPID provided')
		return
	}

	const engine = parsedCue.target

	if (IsTargetingFull(engine)) {
		actions.push(
			CreatePilotAdLibAction(config, context, parsedCue, engine, settings, adlib, adlibRank, externalSegmentId)
		)
	}

	if (!(IsTargetingOVL(engine) && adlib)) {
		pieces.push(CreateFullPiece(config, context, part, partId, parsedCue, engine, settings, adlib, externalSegmentId))
	}

	if (IsTargetingFull(engine)) {
		pieces.push(
			CreateFullDataStore(config, context, part, settings, parsedCue, engine, partId, adlib, externalSegmentId)
		)
	}
}

function CreatePilotAdLibAction(
	config: TV2BlueprintConfig,
	context: IShowStyleUserContext,
	parsedCue: CueDefinitionGraphic<GraphicPilot>,
	engine: GraphicEngine,
	settings: PilotGeneratorSettings,
	adlib: boolean,
	adlibRank: number,
	segmentExternalId: string
) {
	const name = GraphicDisplayName(config, parsedCue)
	const sourceLayerId = GetSourceLayer(engine)
	const outputLayerId = GetOutputLayer(engine)

	return literal<IBlueprintActionManifest>({
		actionId: AdlibActionType.SELECT_FULL_GRAFIK,
		userData: literal<ActionSelectFullGrafik>({
			type: AdlibActionType.SELECT_FULL_GRAFIK,
			name: parsedCue.graphic.name,
			vcpid: parsedCue.graphic.vcpid,
			segmentExternalId
		}),
		userDataManifest: {},
		display: {
			_rank: adlibRank,
			label: t(GetFullGraphicTemplateNameFromCue(config, parsedCue)),
			sourceLayerId: SharedSourceLayers.PgmPilot,
			outputLayerId: SharedOutputLayers.PGM,
			content: {
				...CreateFullContent(config, context, undefined, settings, parsedCue, engine, adlib)
			},
			uniquenessId: `gfx_${name}_${sourceLayerId}_${outputLayerId}`,
			tags: [
				AdlibTags.ADLIB_KOMMENTATOR,
				...(config.showStyle.MakeAdlibsForFulls && IsTargetingFull(engine) ? [AdlibTags.ADLIB_FLOW_PRODUCER] : [])
			],
			currentPieceTags: [GetTagForFull(segmentExternalId, parsedCue.graphic.vcpid)],
			nextPieceTags: [GetTagForFullNext(segmentExternalId, parsedCue.graphic.vcpid)],
			noHotKey: !(config.showStyle.MakeAdlibsForFulls && IsTargetingFull(engine))
		}
	})
}

export function CreateFullPiece(
	config: TV2BlueprintConfig,
	context: IShowStyleUserContext,
	part: Readonly<IBlueprintPart>,
	partId: string,
	parsedCue: CueDefinitionGraphic<GraphicPilot>,
	engine: GraphicEngine,
	settings: PilotGeneratorSettings,
	adlib: boolean,
	segmentExternalId: string
): IBlueprintPiece {
	return literal<IBlueprintPiece>({
		externalId: partId,
		name: GraphicDisplayName(config, parsedCue),
		...(IsTargetingFull(engine) || IsTargetingWall(engine)
			? { enable: { start: 0 } }
			: {
					enable: {
						...CreateTimingGraphic(config, parsedCue)
					}
			  }),
		outputLayerId: GetOutputLayer(engine),
		sourceLayerId: GetSourceLayer(engine),
		adlibPreroll: config.studio.VizPilotGraphics.PrerollDuration,
		lifespan: GetInfiniteModeForGraphic(engine, config, parsedCue),
		metaData: literal<PieceMetaData>({
			sisyfosPersistMetaData: {
				sisyfosLayers: []
			}
		}),
		content: CreateFullContent(config, context, part, settings, parsedCue, engine, adlib),
		tags: [GetTagForFull(segmentExternalId, parsedCue.graphic.vcpid), TallyTags.FULL_IS_LIVE]
	})
}

export function CreateFullDataStore(
	config: TV2BlueprintConfig,
	context: IShowStyleUserContext,
	part: Readonly<IBlueprintPart>,
	settings: PilotGeneratorSettings,
	parsedCue: CueDefinitionGraphic<GraphicPilot>,
	engine: GraphicEngine,
	partId: string,
	adlib: boolean,
	segmentExternalId: string
): IBlueprintPiece {
	const content = CreateFullContent(config, context, part, settings, parsedCue, engine, adlib)
	content.timelineObjects = content.timelineObjects.filter(
		o =>
			o.content.deviceType !== TSR.DeviceType.ATEM &&
			o.content.deviceType !== TSR.DeviceType.SISYFOS &&
			o.content.deviceType !== TSR.DeviceType.VIZMSE &&
			o.content.deviceType !== TSR.DeviceType.CASPARCG
	)
	return literal<IBlueprintPiece>({
		externalId: partId,
		name: GraphicDisplayName(config, parsedCue),
		enable: {
			start: 0
		},
		outputLayerId: SharedOutputLayers.SELECTED_ADLIB,
		sourceLayerId: SharedSourceLayers.SelectedAdlibGraphicsFull,
		lifespan: PieceLifespan.OutOnSegmentEnd,
		metaData: {
			userData: literal<ActionSelectFullGrafik>({
				type: AdlibActionType.SELECT_FULL_GRAFIK,
				name: parsedCue.graphic.name,
				vcpid: parsedCue.graphic.vcpid,
				segmentExternalId
			}),
			sisyfosPersistMetaData: literal<SisyfosPersistMetaData>({
				sisyfosLayers: []
			})
		},
		content,
		tags: [GetTagForFullNext(segmentExternalId, parsedCue.graphic.vcpid)]
	})
}

function CreateFullContent(
	config: TV2BlueprintConfig,
	context: IShowStyleUserContext,
	part: Readonly<IBlueprintPart> | undefined,
	settings: PilotGeneratorSettings,
	cue: CueDefinitionGraphic<GraphicPilot>,
	engine: GraphicEngine,
	adlib: boolean
): WithTimeline<GraphicsContent> {
	if (config.studio.GraphicsType === 'HTML') {
		return GetPilotGraphicContentCaspar(config, context, cue, settings.caspar, engine)
	} else {
		return GetPilotGraphicContentViz(config, part, context, settings.viz, cue, engine, adlib)
	}
}

function GetSourceLayer(engine: GraphicEngine): SharedSourceLayers {
	return IsTargetingWall(engine)
		? SharedSourceLayers.WallGraphics
		: IsTargetingTLF(engine)
		? SharedSourceLayers.PgmGraphicsTLF
		: IsTargetingOVL(engine)
		? SharedSourceLayers.PgmPilotOverlay
		: SharedSourceLayers.PgmPilot
}

function GetOutputLayer(engine: GraphicEngine) {
	return IsTargetingWall(engine)
		? SharedOutputLayers.SEC
		: IsTargetingOVL(engine)
		? SharedOutputLayers.OVERLAY
		: IsTargetingFull(engine)
		? SharedOutputLayers.PGM
		: SharedOutputLayers.OVERLAY
}
