import {
	BlueprintResultPart,
	BlueprintResultSegment,
	IBlueprintPart,
	IBlueprintSegment,
	IngestSegment,
	PartContext,
	SegmentContext,
	ShowStyleContext
} from 'tv-automation-sofie-blueprints-integration'
import {
	assertUnreachable,
	GetNextPartCue,
	literal,
	ParseBody,
	PartContext2,
	PartDefinition,
	PartDefinitionEVS,
	PartDefinitionKam
} from 'tv2-common'
import { CueType, PartType } from 'tv2-constants'
import * as _ from 'underscore'
import { TV2BlueprintConfigBase, TV2ShowstyleBlueprintConfigBase, TV2StudioConfigBase } from './blueprintConfig'
import {
	PartDefinitionDVE,
	PartDefinitionEkstern,
	PartDefinitionGrafik,
	PartDefinitionServer,
	PartDefinitionTeknik,
	PartDefinitionTelefon,
	PartDefinitionVO
} from './inewsConversion'

export interface GetSegmentShowstyleOptions<
	StudioConfig extends TV2StudioConfigBase,
	ShowStyleConfig extends TV2BlueprintConfigBase<StudioConfig>
> {
	parseConfig: (context: ShowStyleContext) => ShowStyleConfig
	TransformCuesIntoShowstyle: (
		config: TV2ShowstyleBlueprintConfigBase,
		partDefinition: PartDefinition
	) => PartDefinition
	CreatePartContinuity: (config: ShowStyleConfig, ingestSegment: IngestSegment) => BlueprintResultPart
	CreatePartUnknown: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinition,
		totalWords: number,
		asAdlibs?: boolean
	) => BlueprintResultPart
	CreatePartIntro: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinition,
		totalWords: number
	) => BlueprintResultPart
	CreatePartKam: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionKam,
		totalWords: number
	) => BlueprintResultPart
	CreatePartServer: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionServer
	) => BlueprintResultPart
	CreatePartTeknik: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionTeknik,
		totalWords: number
	) => BlueprintResultPart
	CreatePartGrafik: (
		context: PartContext,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionGrafik,
		totalWords: number
	) => BlueprintResultPart
	CreatePartVO: (
		context: PartContext,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionVO,
		totalWords: number,
		totalTime: number
	) => BlueprintResultPart
	CreatePartEkstern: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionEkstern,
		totalWords: number
	) => BlueprintResultPart
	CreatePartTelefon: (
		context: PartContext2,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionTelefon,
		totalWords: number
	) => BlueprintResultPart
	CreatePartEVS(
		context: PartContext,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionEVS,
		totalWords: number
	): BlueprintResultPart
	CreatePartDVE(
		context: PartContext,
		config: ShowStyleConfig,
		partDefinition: PartDefinitionDVE,
		totalWords: number
	): BlueprintResultPart
}

export function getSegmentBase<
	StudioConfig extends TV2StudioConfigBase,
	ShowStyleConfig extends TV2BlueprintConfigBase<StudioConfig>
>(
	context: SegmentContext,
	ingestSegment: IngestSegment,
	showStyleOptions: GetSegmentShowstyleOptions<StudioConfig, ShowStyleConfig>
): BlueprintResultSegment {
	const segment = literal<IBlueprintSegment>({
		name: ingestSegment.name,
		metaData: {},
		identifier:
			ingestSegment.payload.iNewsStory.fields.pageNumber && ingestSegment.payload.iNewsStory.fields.pageNumber.trim()
				? ingestSegment.payload.iNewsStory.fields.pageNumber.trim()
				: undefined
	})
	const config = showStyleOptions.parseConfig(context)

	if (ingestSegment.payload.iNewsStory.meta.float === 'float') {
		segment.isHidden = true
		return {
			segment,
			parts: []
		}
	} else {
		segment.isHidden = false
	}

	const blueprintParts: BlueprintResultPart[] = []
	const parsedParts = ParseBody(
		ingestSegment.externalId,
		ingestSegment.name,
		ingestSegment.payload.iNewsStory.body,
		ingestSegment.payload.iNewsStory.cues,
		ingestSegment.payload.iNewsStory.fields,
		ingestSegment.payload.iNewsStory.fields.modifyDate
	)
	const totalWords = parsedParts.reduce((prev, cur) => {
		if (cur.type === PartType.Server) {
			return prev
		}
		return prev + cur.script.replace(/\n/g, '').replace(/\r/g, '').length
	}, 0)

	if (segment.name.trim().match(/^CONTINUITY$/i)) {
		blueprintParts.push(showStyleOptions.CreatePartContinuity(config, ingestSegment))
		return {
			segment,
			parts: blueprintParts
		}
	}

	let serverParts = 0
	let jingleTime = 0
	let serverTime = 0
	for (const par of parsedParts) {
		// Apply showstyle-specific transformations of cues.
		const part = showStyleOptions.TransformCuesIntoShowstyle(config.showStyle, par)
		const partContext = new PartContext2(context, part.externalId)

		// Make orphaned secondary cues into adlibs
		if (
			GetNextPartCue(part, -1) === -1 &&
			part.type === PartType.Unknown &&
			part.cues.filter(cue => cue.type === CueType.Jingle || cue.type === CueType.AdLib).length === 0
		) {
			blueprintParts.push(showStyleOptions.CreatePartUnknown(partContext, config, part, totalWords, true))
			continue
		}

		switch (part.type) {
			case PartType.INTRO:
				blueprintParts.push(showStyleOptions.CreatePartIntro(partContext, config, part, totalWords))
				break
			case PartType.Kam:
				blueprintParts.push(showStyleOptions.CreatePartKam(partContext, config, part, totalWords))
				break
			case PartType.Server:
				blueprintParts.push(showStyleOptions.CreatePartServer(partContext, config, part))
				break
			case PartType.Teknik:
				blueprintParts.push(showStyleOptions.CreatePartTeknik(partContext, config, part, totalWords))
				break
			case PartType.Grafik:
				blueprintParts.push(showStyleOptions.CreatePartGrafik(partContext, config, part, totalWords))
				break
			case PartType.VO:
				blueprintParts.push(
					showStyleOptions.CreatePartVO(
						partContext,
						config,
						part,
						totalWords,
						Number(ingestSegment.payload.iNewsStory.fields.totalTime)
					)
				)
				break
			case PartType.DVE:
				blueprintParts.push(showStyleOptions.CreatePartDVE(partContext, config, part, totalWords))
				break
			case PartType.Ekstern:
				blueprintParts.push(showStyleOptions.CreatePartEkstern(partContext, config, part, totalWords))
				break
			case PartType.Telefon:
				blueprintParts.push(showStyleOptions.CreatePartTelefon(partContext, config, part, totalWords))
				break
			case PartType.Unknown:
				if (part.cues.length) {
					blueprintParts.push(showStyleOptions.CreatePartUnknown(partContext, config, part, totalWords))
				}
				break
			case PartType.EVS:
				blueprintParts.push(showStyleOptions.CreatePartEVS(partContext, config, part, totalWords))
				break
			default:
				assertUnreachable(part)
				break
		}

		if (
			part.type === PartType.Server ||
			(part.type === PartType.VO && (Number(part.fields.tapeTime) > 0 || part.script.length))
		) {
			if (blueprintParts[blueprintParts.length - 1]) {
				serverTime += Number(blueprintParts[blueprintParts.length - 1].part.expectedDuration)
				serverParts++
			}
		}

		if (part.cues.filter(cue => cue.type === CueType.Jingle).length) {
			if (blueprintParts[blueprintParts.length - 1]) {
				const t = blueprintParts[blueprintParts.length - 1].part.expectedDuration
				if (t) {
					jingleTime += t
				}
			}
		}
	}

	let allocatedTime =
		blueprintParts.reduce((prev, cur) => {
			return prev + (cur.part.expectedDuration ? cur.part.expectedDuration : 0)
		}, 0) - jingleTime

	if (allocatedTime < 0) {
		allocatedTime = 0
	}

	let totalAllocatedTime = 0
	blueprintParts.forEach(part => {
		part.part.displayDurationGroup = ingestSegment.externalId
		if (!part.part.expectedDuration && Number(ingestSegment.payload.iNewsStory.fields.totalTime) > 0) {
			part.part.expectedDuration =
				(Number(ingestSegment.payload.iNewsStory.fields.totalTime) * 1000 - allocatedTime - serverTime || 0) /
				(blueprintParts.length - serverParts)
			if (
				!!part.part.title.match(/(?:kam|cam)(?:era)? ?.*/i) &&
				part.part.expectedDuration > config.studio.MaximumKamDisplayDuration
			) {
				part.part.expectedDuration = config.studio.MaximumKamDisplayDuration
			}
		}

		if (part.part.expectedDuration) {
			totalAllocatedTime += part.part.expectedDuration
		}
	})

	blueprintParts.forEach(part => {
		if (!part.part.expectedDuration || part.part.expectedDuration < 0) {
			part.part.expectedDuration = 100000
		}

		if (part.part.displayDuration && (part.part.displayDuration < 0 || isNaN(part.part.displayDuration))) {
			part.part.displayDuration = 0
		}
	})

	if (
		blueprintParts.filter(part => part.pieces.length === 0 && part.adLibPieces.length).length === blueprintParts.length
	) {
		segment.isHidden = true
	}

	const extraTime = Number(ingestSegment.payload.iNewsStory.fields.totalTime) * 1000 - totalAllocatedTime
	if (
		extraTime > 0 &&
		// Filter out Jingle-only parts
		(blueprintParts.length !== 1 ||
			(blueprintParts[blueprintParts.length - 1] &&
				!blueprintParts[blueprintParts.length - 1].pieces.some(piece => piece.sourceLayerId === 'studio0_jingle')))
	) {
		const gapPart = literal<BlueprintResultPart>({
			part: literal<IBlueprintPart>({
				externalId: `${ingestSegment.externalId}-GAP`,
				title: `Adlib Gap`,
				metaData: {},
				typeVariant: '',
				gap: true,
				invalid: true,
				expectedDuration: extraTime,
				displayDurationGroup: ingestSegment.externalId
			}),
			pieces: [],
			adLibPieces: []
		})
		blueprintParts.push(gapPart)
	}

	if (
		blueprintParts.filter(part => part.part.invalid === true).length === blueprintParts.length &&
		ingestSegment.payload.iNewsStory.cues.length === 0
	) {
		segment.isHidden = true
	}

	return {
		segment,
		parts: blueprintParts
	}
}