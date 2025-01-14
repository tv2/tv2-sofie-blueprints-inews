import { BlueprintMapping, BlueprintMappings, LookaheadMode, TSR } from 'blueprints-integration'
import { SwitcherDskLLayer } from 'tv2-constants'
import { ATEMModel } from '../../types/atem'
import { GetDSKCount } from '../helpers'

export const TRICASTER_DEVICE_ID = 'tricaster0'
export const TRICASTER_PROGRAM_ME = 'v1'
export const TRICASTER_CLEAN_ME = 'v4'
export const TRICASTER_DVE_ME = 'v2'

export const ATEM_DEVICE_ID = 'atem0'
export const ATEM_LAYER_PREFIX = 'atem_'
export const TRICASTER_LAYER_PREFIX = 'tricaster_'

export function AbstractLLayerServerEnable(i: number) {
	return `server_enable_${i}`
}

export function CasparPlayerClip(i: number | string) {
	return `casparcg_player_clip_${i}`
}

export function CasparPlayerClipLoadingLoop(i: number | string) {
	return `casparcg_player_clip_${i}_loading_loop`
}

/**
 * Created layer mapping name for a DSK
 * @param i DSK number starting from 0
 */
export function getDskLLayerName(i: number): SwitcherDskLLayer {
	return `dsk_${i + 1}`
}

export function getDskMappingNames(atemModel: ATEMModel): string[] {
	const names: string[] = []

	for (let i = 0; i < GetDSKCount(atemModel); i++) {
		names.push(getDskLLayerName(i))
	}

	return names
}

export function getAtemDskMappings(atemModel: ATEMModel): BlueprintMappings {
	const base: Record<string, TSR.MappingAtem & BlueprintMapping> = {}
	return getDskMappingNames(atemModel).reduce((prev, name, index) => {
		prev[name] = {
			device: TSR.DeviceType.ATEM,
			deviceId: 'atem0',
			lookahead: LookaheadMode.NONE,
			mappingType: TSR.MappingAtemType.DownStreamKeyer,
			index
		}
		return prev
	}, base)
}

export function getTriCasterDskMappings(): BlueprintMappings {
	const base: Record<string, TSR.MappingTriCaster & BlueprintMapping> = {}
	return [1, 2, 3, 4].reduce((prev, index) => {
		prev[`dsk_${index}`] = {
			device: TSR.DeviceType.TRICASTER,
			deviceId: TRICASTER_DEVICE_ID,
			lookahead: LookaheadMode.NONE,
			mappingType: TSR.MappingTriCasterType.ME,
			name: TRICASTER_PROGRAM_ME
		}
		return prev
	}, base)
}

export function prefixLayers<T extends TSR.Mapping & BlueprintMapping>(
	prefix: string,
	layers: Record<string, T>
): Record<string, T> {
	const result: Record<string, T> = {}
	return Object.entries(layers).reduce((acc, [name, layer]) => {
		acc[prefix + name] = layer
		return acc
	}, result)
}
