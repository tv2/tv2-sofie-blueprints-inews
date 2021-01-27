import { IBlueprintShowStyleBase, IngestRundown, IStudioConfigContext } from '@sofie-automation/blueprints-integration'
import * as _ from 'underscore'

export function getShowStyleId(
	_context: IStudioConfigContext,
	showStyles: IBlueprintShowStyleBase[],
	_ingestRundown: IngestRundown
): string | null {
	const showStyle = _.first(showStyles)
	if (showStyle) {
		return showStyle._id
	}

	return null
}
