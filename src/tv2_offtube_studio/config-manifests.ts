import { ConfigManifestEntry, ConfigManifestEntryType } from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'
import { AtemSourceIndex } from '../types/atem'

export const CORE_INJECTED_KEYS = ['SofieHostURL']

export const studioConfigManifest: ConfigManifestEntry[] = [
	{
		id: 'MediaFlowId',
		name: 'Media Flow Id',
		description: '',
		type: ConfigManifestEntryType.STRING,
		required: false,
		defaultVal: 'flow0'
	},
	{
		id: 'ClipFileExtension',
		name: 'Clip files extension',
		description: 'Default file extension to clips to fetch from Omneon and play at CasparCG',
		type: ConfigManifestEntryType.STRING,
		required: true,
		defaultVal: '.mxf'
	},
	{
		id: 'ClipSourcePath',
		name: 'Network base path',
		description:
			'The base path for the Omneon network share. Needs to match the base path of the source in Media manager', // @todo: stupid dependency
		type: ConfigManifestEntryType.STRING,
		required: true,
		defaultVal: ''
	},
	{
		id: 'SourcesCam',
		name: 'Camera Mapping',
		description: 'Camera number to ATEM input (eg 1:1,9:2)',
		type: ConfigManifestEntryType.STRING,
		required: true,
		defaultVal: '1:4'
	},
	{
		id: 'SourcesRM',
		name: 'RM Mapping',
		description: 'RM number to ATEM input (eg 1:6,2:7)',
		type: ConfigManifestEntryType.STRING,
		required: false,
		defaultVal: '1:1,2:2,3:3'
	},
	{
		id: 'ABMediaPlayers',
		name: 'Media Players inputs',
		description: 'ATEM inputs for A/B media players',
		type: ConfigManifestEntryType.STRING,
		required: false,
		defaultVal: '1:5,2:6'
	},
	{
		id: 'ABPlaybackDebugLogging',
		name: 'Media players selection debug logging',
		description: 'Enable debug logging for A/B media player selection',
		type: ConfigManifestEntryType.BOOLEAN,
		required: false,
		defaultVal: false
	},
	{
		id: 'AtemSource.DSK1F',
		name: 'ATEM DSK1 Fill',
		description: 'ATEM vision mixer input for DSK1 Fill',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 8
	},
	{
		id: 'AtemSource.DSK1K',
		name: 'ATEM DSK1 Key',
		description: 'ATEM vision mixer input for DSK1 Key',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 7
	},
	{
		id: 'AtemSettings.CCGClip',
		name: 'CasparCG keyer clip',
		description: 'CasparCG keyer clip',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 50.0
	},
	{
		id: 'AtemSettings.CCGGain',
		name: 'CasparCG keyer gain',
		description: 'CasparCG keyer gain',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 12.5
	},
	{
		id: 'AtemSource.SplitArtF',
		name: 'ATEM Split Screen Art Fill',
		description: 'ATEM vision mixer input for Split Screen Art Fill',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 10
	},
	{
		id: 'AtemSource.SplitArtK',
		name: 'ATEM Split Screen Art Key',
		description: 'ATEM vision mixer input for Split Screen Art Key',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 9
	},
	{
		id: 'AtemSource.SplitBackground',
		name: 'ATEM split screen background loop source',
		description: 'ATEM source for mos full-frame grafik background source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 11
	},
	{
		id: 'AtemSource.GFXFull',
		name: 'Full graphics source',
		description: 'ATEM source for full graphics',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 8
	},
	{
		id: 'AtemSource.Loop',
		name: 'Studio screen loop graphics source',
		description: 'ATEM source for loop for studio screen',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 12
	},
	{
		id: 'AtemSource.Default',
		name: 'ATEM Default source',
		description: 'ATEM vision mixer default source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: AtemSourceIndex.Col1
	},
	{
		id: 'AtemSource.Continuity',
		name: 'ATEM continuity source',
		description: 'ATEM input for continuity',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: AtemSourceIndex.Col2
	},
	{
		id: 'AudioBedSettings.fadeIn',
		name: 'Bed Fade In',
		description: 'Default fade in duration for audio beds',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 25
	},
	{
		id: 'AudioBedSettings.volume',
		name: 'Bed Volume',
		description: 'Volume (0 - 100)',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 80
	},
	{
		id: 'AudioBedSettings.fadeOut',
		name: 'Bed Fade Out',
		description: 'Default fade out duration for audio beds',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 25
	},
	{
		id: 'CasparPrerollDuration',
		name: 'Caspar preroll duration',
		description: 'ms of preroll before switching to caspar',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 200 // 5 frames
	},
	{
		id: 'MaximumKamDisplayDuration',
		name: 'Maximum Kam Display Duration',
		description: 'Maximum duration (ms) to give Kam parts in UI',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 10000
	}
]
