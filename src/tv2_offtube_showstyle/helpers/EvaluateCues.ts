import { PartContext } from 'tv-automation-sofie-blueprints-integration'
import {
	CueDefinition,
	EvaluateCuesBase,
	EvaluateCuesOptions,
	IBlueprintAdLibPieceEPI,
	IBlueprintPieceEPI,
	PartDefinition
} from 'tv2-common'
import { OfftubeEvaluateDVE } from '../cues/OfftubeDVE'
import { OfftubeEvaluateGrafikCaspar } from '../cues/OfftubeGrafikCaspar'
import { OfftubeEvaluateJingle } from '../cues/OfftubeJingle'
import { OfftubeEvaluateTargetEngine } from '../cues/OfftubeTargetEngine'
import { OfftubeEvaluateVIZ } from '../cues/OfftubeViz'
import { OffTubeShowstyleBlueprintConfig } from './config'

export function OfftubeEvaluateCues(
	context: PartContext,
	config: OffTubeShowstyleBlueprintConfig,
	pieces: IBlueprintPieceEPI[],
	adLibPieces: IBlueprintAdLibPieceEPI[],
	cues: CueDefinition[],
	partDefinition: PartDefinition,
	options: EvaluateCuesOptions
) {
	EvaluateCuesBase(
		{
			EvaluateCueVIZ: OfftubeEvaluateVIZ,
			EvaluateCueDVE: OfftubeEvaluateDVE,
			EvaluateCueTargetEngine: OfftubeEvaluateTargetEngine,
			EvaluateCueGrafik: OfftubeEvaluateGrafikCaspar,
			EvaluateCueJingle: OfftubeEvaluateJingle
		},
		context,
		config,
		pieces,
		adLibPieces,
		cues,
		partDefinition,
		options
	)
}
