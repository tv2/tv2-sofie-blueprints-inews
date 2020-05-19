import {
	IBlueprintAdLibPiece,
	IBlueprintPart,
	IBlueprintPiece,
	PartContext,
	PieceLifespan
} from 'tv-automation-sofie-blueprints-integration'
import {
	CreateJingleContentBase,
	CueDefinitionJingle,
	GetJinglePartProperties,
	literal,
	PartDefinition
} from 'tv2-common'
import { AdlibTags } from 'tv2-constants'
import { OfftubeAtemLLayer, OfftubeCasparLLayer, OfftubeSisyfosLLayer } from '../../tv2_offtube_studio/layers'
import { OffTubeShowstyleBlueprintConfig } from '../helpers/config'
import { OffTubeSourceLayer } from '../layers'

export function OfftubeEvaluateJingle(
	context: PartContext,
	config: OffTubeShowstyleBlueprintConfig,
	pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	parsedCue: CueDefinitionJingle,
	part: PartDefinition,
	_adlib?: boolean,
	rank?: number,
	effekt?: boolean
) {
	if (!config.showStyle.BreakerConfig) {
		context.warning(`Jingles have not been configured`)
		return
	}

	let file = ''

	const jingle = config.showStyle.BreakerConfig.find(brkr =>
		brkr.BreakerName ? brkr.BreakerName.toString().toUpperCase() === parsedCue.clip.toUpperCase() : false
	)
	if (!jingle) {
		context.warning(`Jingle ${parsedCue.clip} is not configured`)
		return
	} else {
		file = jingle.ClipName.toString()
	}

	const p = GetJinglePartProperties(context, config, part)

	if (JSON.stringify(p) === JSON.stringify({})) {
		context.warning(`Could not create adlib for ${parsedCue.clip}`)
		return
	}

	const props = p as Pick<
		IBlueprintPart,
		'autoNext' | 'expectedDuration' | 'prerollDuration' | 'autoNextOverlap' | 'disableOutTransition'
	>

	adlibPieces.push(
		literal<IBlueprintAdLibPiece>({
			_rank: rank ?? 0,
			externalId: `${part.externalId}-JINGLE-adlib`,
			name: effekt ? `EFFEKT ${parsedCue.clip}` : parsedCue.clip,
			sourceLayerId: OffTubeSourceLayer.PgmJingle,
			outputLayerId: 'jingle',
			content: createJingleContent(config, file),
			toBeQueued: true,
			adlibAutoNext: props.autoNext,
			adlibAutoNextOverlap: props.autoNextOverlap,
			adlibPreroll: props.prerollDuration,
			expectedDuration: props.expectedDuration,
			adlibDisableOutTransition: false,
			infiniteMode: PieceLifespan.OutOnNextPart,
			tags: [AdlibTags.OFFTUBE_100pc_SERVER] // TODO: Maybe this should be different?
		})
	)

	pieces.push(
		literal<IBlueprintPiece>({
			_id: '',
			externalId: `${part.externalId}-JINGLE`,
			name: effekt ? `EFFEKT ${parsedCue.clip}` : parsedCue.clip,
			enable: {
				start: 0
			},
			infiniteMode: PieceLifespan.OutOnNextPart,
			outputLayerId: 'jingle',
			sourceLayerId: OffTubeSourceLayer.PgmJingle,
			content: createJingleContent(config, file)
		})
	)
}

function createJingleContent(config: OffTubeShowstyleBlueprintConfig, file: string) {
	return CreateJingleContentBase(
		config,
		file,
		{
			Caspar: {
				PlayerJingle: OfftubeCasparLLayer.CasparPlayerJingle
			},
			ATEM: {
				DSKJingle: OfftubeAtemLLayer.AtemDSKGraphics
			},
			Sisyfos: {
				PlayerJingle: OfftubeSisyfosLLayer.SisyfosSourceJingle
			}
		},
		true
	)
}
