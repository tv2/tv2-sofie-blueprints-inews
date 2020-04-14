import { IBlueprintAdLibPiece, IBlueprintPiece, PartContext } from 'tv-automation-sofie-blueprints-integration'
import { CueDefinitionGrafik, CueDefinitionTargetEngine, PartDefinition } from 'tv2-common'
import { CueType } from 'tv2-constants'
import { OffTubeShowstyleBlueprintConfig } from '../helpers/config'
import { OfftubeEvaluateGrafikCaspar } from './OfftubeGrafikCaspar'

export function OfftubeEvaluateTargetEngine(
	context: PartContext,
	config: OffTubeShowstyleBlueprintConfig,
	pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	_partId: string,
	partDefinition: PartDefinition,
	parsedCue: CueDefinitionTargetEngine,
	_adlib: boolean
) {
	// TODO: Future: Target a specific engine
	if (!parsedCue.data.engine.match(/full|ovl|wall/i)) {
		context.warning(`Could not find engine to target for: ${parsedCue.data.engine}`)
		return
	}

	// Offtubes: Only allow full for now
	if (!parsedCue.data.engine.match(/full/i)) {
		return
	}

	if (parsedCue.data.grafik) {
		if (parsedCue.data.grafik.type === CueType.Grafik) {
			OfftubeEvaluateGrafikCaspar(
				config,
				context,
				pieces,
				adlibPieces,
				partDefinition.externalId,
				parsedCue.data.grafik,
				'FULL', // TODO: Target
				true,
				partDefinition
			)
		} else {
			const cueMosToGrafik: CueDefinitionGrafik = {
				type: CueType.Grafik,
				template: parsedCue.data.grafik.vcpid.toString(),
				cue: parsedCue.data.grafik.iNewsCommand,
				textFields: [], // TODO ?
				iNewsCommand: parsedCue.data.grafik.iNewsCommand
			}
			OfftubeEvaluateGrafikCaspar(
				config,
				context,
				pieces,
				adlibPieces,
				partDefinition.externalId,
				cueMosToGrafik,
				'FULL', // TODO: Target
				true,
				partDefinition
			)
		}
	}
}