import { IBlueprintActionManifest } from '@sofie-automation/blueprints-integration'
import {
	ActionSelectServerClip,
	GetTagForServer,
	GetTagForServerNext,
	GetVTContentProperties,
	literal,
	PartDefinition,
	ServerPartLayers,
	TV2BlueprintConfigBase,
	TV2StudioConfigBase
} from 'tv2-common'
import { AdlibActionType, AdlibTags } from 'tv2-constants'

export interface AdlibServerOfftubeOptions {
	/** By passing in this object, you're creating a server according to the OFFTUBE showstyle. */
	isOfftube: true
	tagAsAdlib: boolean
}

export function CreateAdlibServer<
	StudioConfig extends TV2StudioConfigBase,
	ShowStyleConfig extends TV2BlueprintConfigBase<StudioConfig>
>(
	config: ShowStyleConfig,
	rank: number,
	partDefinition: PartDefinition,
	file: string,
	vo: boolean,
	sourceLayers: ServerPartLayers,
	duration: number,
	tagAsAdlib: boolean
): IBlueprintActionManifest {
	return literal<IBlueprintActionManifest>({
		actionId: AdlibActionType.SELECT_SERVER_CLIP,
		userData: literal<ActionSelectServerClip>({
			type: AdlibActionType.SELECT_SERVER_CLIP,
			file,
			partDefinition,
			duration,
			vo
		}),
		userDataManifest: {},
		display: {
			_rank: rank,
			label: `${partDefinition.storyName}`,
			sourceLayerId: sourceLayers.SourceLayer.PgmServer,
			outputLayerId: 'pgm', // TODO: Enum
			content: GetVTContentProperties(config, file),
			tags: [
				tagAsAdlib || vo ? AdlibTags.OFFTUBE_ADLIB_SERVER : AdlibTags.OFFTUBE_100pc_SERVER,
				AdlibTags.ADLIB_KOMMENTATOR
			],
			currentPieceTags: [GetTagForServer(partDefinition.segmentExternalId, file, !!vo)],
			nextPieceTags: [GetTagForServerNext(partDefinition.segmentExternalId, file, !!vo)],
			uniquenessId: `${vo ? 'vo' : 'server'}_${partDefinition.storyName}_${file}`
		}
	})
}
