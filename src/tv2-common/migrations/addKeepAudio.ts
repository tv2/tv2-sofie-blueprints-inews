import {
	MigrationContextStudio,
	MigrationStepStudio,
	TableConfigItemValue
} from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'
import { literal } from '../util'

export function AddKeepAudio(versionStr: string, configName: string): MigrationStepStudio {
	const res = literal<MigrationStepStudio>({
		id: `studioConfig.addKeepAudio.${configName}`,
		version: versionStr,
		canBeRunAutomatically: true,
		validate: (context: MigrationContextStudio) => {
			const configVal = context.getConfig(configName)
			if (
				configVal === undefined ||
				typeof configVal === 'string' ||
				(Array.isArray(configVal) &&
					configVal.length &&
					typeof configVal[0] === 'object' &&
					configVal[0].KeepAudioInStudio === undefined)
			) {
				return `${configName} has old format or doesn't exist`
			}
			return false
		},
		migrate: (context: MigrationContextStudio) => {
			const configVal = context.getConfig(configName)
			if (Array.isArray(configVal) && configVal.length) {
				_.each(configVal as TableConfigItemValue, source => {
					source.KeepAudioInStudio = source.KeepAudioInStudio !== undefined ? source.KeepAudioInStudio : true
				})
				context.setConfig(configName, configVal)
			}
		}
	})

	return res
}
