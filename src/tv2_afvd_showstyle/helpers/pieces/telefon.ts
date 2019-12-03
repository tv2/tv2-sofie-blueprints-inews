import { DeviceType, TimelineContentTypeSisyfos, TimelineObjSisyfosMessage } from 'timeline-state-resolver-types'
import { IBlueprintAdLibPiece, IBlueprintPiece, PartContext } from 'tv-automation-sofie-blueprints-integration'
import { literal } from '../../../common/util'
import { CueDefinitionTelefon, CueType } from '../../../tv2_afvd_showstyle/inewsConversion/converters/ParseCue'
import { SisyfosLLAyer } from '../../../tv2_afvd_studio/layers'
import { BlueprintConfig } from '../config'
import { GetSisyfosTimelineObjForCamera } from '../sisyfos/sisyfos'
import { EvaluateGrafik } from './grafik'
import { EvaluateMOS } from './mos'

export function EvaluateTelefon(
	config: BlueprintConfig,
	context: PartContext,
	pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	partId: string,
	parsedCue: CueDefinitionTelefon,
	adlib?: boolean,
	rank?: number
) {
	if (parsedCue.vizObj) {
		if (parsedCue.vizObj.type === CueType.Grafik) {
			EvaluateGrafik(
				config,
				context,
				pieces,
				adlibPieces,
				partId,
				parsedCue.vizObj,
				adlib ? adlib : parsedCue.adlib ? parsedCue.adlib : false,
				true,
				rank
			)
		} else {
			EvaluateMOS(
				config,
				context,
				pieces,
				adlibPieces,
				partId,
				parsedCue.vizObj,
				adlib ? adlib : parsedCue.adlib ? parsedCue.adlib : false,
				true,
				rank
			)
		}

		if ((!adlib && pieces.length) || (adlib && adlibPieces.length)) {
			if (adlib) {
				const index = adlibPieces.length - 1
				const adlibPiece = adlibPieces[index]
				if (adlibPiece.content && adlibPiece.content.timelineObjects) {
					adlibPiece.content.timelineObjects.push(
						literal<TimelineObjSisyfosMessage>({
							id: '',
							enable: {
								start: 0
							},
							priority: 1,
							layer: SisyfosLLAyer.SisyfosSourceTLF,
							content: {
								deviceType: DeviceType.SISYFOS,
								type: TimelineContentTypeSisyfos.SISYFOS,
								isPgm: 1
							},

							...GetSisyfosTimelineObjForCamera('telefon')
						})
					)
					adlibPiece.name = `${parsedCue.source}`
					adlibPiece.adlibPreroll = config.studio.PilotPrerollDuration
					adlibPieces[index] = adlibPiece
				}
			} else {
				const index = pieces.length - 1
				const piece = pieces[index]
				if (piece.content && piece.content.timelineObjects) {
					piece.content.timelineObjects.push(
						literal<TimelineObjSisyfosMessage>({
							id: '',
							enable: {
								start: 0
							},
							priority: 1,
							layer: SisyfosLLAyer.SisyfosSourceTLF,
							content: {
								deviceType: DeviceType.SISYFOS,
								type: TimelineContentTypeSisyfos.SISYFOS,
								isPgm: 1
							}
						}),

						...GetSisyfosTimelineObjForCamera('telefon')
					)
					piece.name = `${parsedCue.source}`
					piece.adlibPreroll = config.studio.PilotPrerollDuration
					pieces[index] = piece
				}
			}
		}
	}
}
