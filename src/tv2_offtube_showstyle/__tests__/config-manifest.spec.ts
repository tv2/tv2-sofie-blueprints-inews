import * as _ from 'underscore'
import { showStyleConfigManifest } from '../config-manifests'
import { OfftubeShowStyleConfig } from '../helpers/config'

const blankShowStyleConfig: OfftubeShowStyleConfig = {
	DVEStyles: [],
	GfxTemplates: [],
	GfxDesignTemplates: [],
	WipesConfig: [],
	BreakerConfig: [],
	DefaultTemplateDuration: 4,
	LYDConfig: [],
	CasparCGLoadingClip: '',
	Transitions: [{ Transition: '1' }, { Transition: '2' }],
	ShowstyleTransition: 'CUT',
	MakeAdlibsForFulls: true,
	GfxSchemaTemplates: [],
	GfxSetups: [],
	GfxShowMapping: [],
	GfxDefaults: []
}

describe('Config Manifest', () => {
	test('Exposed ShowStyle Keys', () => {
		const showStyleManifestKeys = _.map(showStyleConfigManifest, (e) => e.id)
		const manifestKeys = showStyleManifestKeys.sort()

		const definedKeys = Object.keys(blankShowStyleConfig)

		expect(manifestKeys).toEqual(definedKeys.sort())
	})
})
