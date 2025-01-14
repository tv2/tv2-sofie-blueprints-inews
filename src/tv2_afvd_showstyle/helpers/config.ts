import { IBlueprintConfig, ICommonContext, TableConfigItemValue } from 'blueprints-integration'
import { findGfxSetup, TableConfigGfxSetup, TV2ShowstyleBlueprintConfigBase } from 'tv2-common'
import { GalleryStudioConfig } from '../../tv2_afvd_studio/helpers/config'

export interface GalleryTableConfigGfxSetup extends TableConfigGfxSetup {
	VcpConcept: string
	FullShowName: string
	OvlShowName: string
}

export interface GalleryBlueprintConfig extends GalleryStudioConfig {
	showStyle: GalleryShowStyleConfig
	selectedGfxSetup: GalleryTableConfigGfxSetup
}

export interface GalleryShowStyleConfig extends TV2ShowstyleBlueprintConfigBase {
	WipesConfig: TableConfigItemValue
	GfxSetups: GalleryTableConfigGfxSetup[]
}

export function preprocessConfig(context: ICommonContext, rawConfig: IBlueprintConfig): any {
	const showstyleConfig = rawConfig as unknown as GalleryShowStyleConfig
	const selectedGfxSetup = findGfxSetup(context, showstyleConfig, {
		_id: '',
		Name: '',
		VcpConcept: '',
		OvlShowName: '',
		FullShowName: '',
		HtmlPackageFolder: ''
	})
	return {
		showStyle: showstyleConfig,
		selectedGfxSetup
	}
}
