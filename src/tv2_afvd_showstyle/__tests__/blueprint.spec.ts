import { SegmentContext } from '../../__mocks__/context'
import { BlueprintResultSegment, IBlueprintRundownDB, IngestSegment } from 'tv-automation-sofie-blueprints-integration'
import { INewsStory, literal, UnparsedCue } from 'tv2-common'
import { defaultShowStyleConfig, defaultStudioConfig } from '../../tv2_afvd_showstyle/__tests__/configs'
import mappingsDefaults from '../../tv2_afvd_studio/migrations/mappings-defaults'
import { getSegment } from '../getSegment'
import { SourceLayer } from '../layers'

const RUNDOWN_EXTERNAL_ID = 'TEST.SOFIE.JEST'
const SEGMENT_EXTERNAL_ID = '00000000'

function makeMockContext() {
	const rundown = literal<IBlueprintRundownDB>({
		externalId: RUNDOWN_EXTERNAL_ID,
		name: RUNDOWN_EXTERNAL_ID,
		_id: '',
		showStyleVariantId: ''
	})
	const mockContext = new SegmentContext(rundown, mappingsDefaults)
	mockContext.studioConfig = defaultStudioConfig as any
	mockContext.showStyleConfig = defaultShowStyleConfig as any

	return mockContext
}

function makeIngestSegment(cues: UnparsedCue[], body: string) {
	return literal<IngestSegment>({
		externalId: SEGMENT_EXTERNAL_ID,
		name: 'TEST SEGMENT',
		rank: 0,
		parts: [],
		payload: {
			iNewsStory: literal<INewsStory>({
				identifier: '00000000',
				locator: '01',
				fields: {
					title: 'TEST SEGMENT',
					modifyDate: '0',
					tapeTime: '0',
					audioTime: '0',
					totalTime: '0',
					cumeTime: '0',
					backTime: '0',
					pageNumber: '01'
				},
				meta: {},
				cues,
				body
			})
		}
	})
}

function expectNotesToBe(context: SegmentContext, notes: string[]) {
	expect(context.getNotes().map(msg => msg.message)).toEqual(notes)
}

function expectAllPartsToBeValid(result: BlueprintResultSegment) {
	const invalid = result.parts.filter(part => part.part.invalid === true)
	expect(invalid).toHaveLength(0)
}

describe('AFVD Blueprint', () => {
	it('Shows warning for Pilot without destination', () => {
		const ingestSegment = makeIngestSegment(
			[
				[
					'#cg4 pilotdata',
					'News/Citast/ARFG/LIVE/stoppoints_3',
					'VCPID=2547768',
					'ContinueCount=8',
					'News/Citat/ARFG/LIVE/stoppoints_3'
				]
			],
			`\r\n<pi>Kam 1</pi>\r\n<p>Some script</p>\r\n<p><a idref="0"></a></p>\r\n`
		)
		const context = makeMockContext()
		const result = getSegment(context, ingestSegment)
		expectNotesToBe(context, ['Graphic found without target engine'])
		expect(result.segment.isHidden).toBe(false)
		expect(result.parts).toHaveLength(1)
		expectAllPartsToBeValid(result)

		const kamPart = result.parts[0]
		expect(kamPart).toBeTruthy()
		expect(kamPart.pieces).toHaveLength(2)
		expect(kamPart.pieces.map(p => p.sourceLayerId)).toEqual([SourceLayer.PgmCam, SourceLayer.PgmScript])
		expect(kamPart.adLibPieces).toHaveLength(0)
		expect(kamPart.actions).toHaveLength(0)
	})

	it('Creates invalid part for standalone GRAFIK=FULL', () => {
		const ingestSegment = makeIngestSegment(
			[['GRAFIK=FULL']],
			`\r\n<pi>Kam 1</pi>\r\n<p>Some script</p>\r\n<p><a idref="0"></a></p>\r\n`
		)
		const context = makeMockContext()
		const result = getSegment(context, ingestSegment)
		expectNotesToBe(context, ['No graphic found after GRAFIK cue'])
		expect(result.segment.isHidden).toBe(false)
		expect(result.parts).toHaveLength(2)

		const kamPart = result.parts[0]
		expect(kamPart).toBeTruthy()
		expect(kamPart.pieces).toHaveLength(2)
		expect(kamPart.pieces.map(p => p.sourceLayerId)).toEqual([SourceLayer.PgmCam, SourceLayer.PgmScript])
		expect(kamPart.adLibPieces).toHaveLength(0)
		expect(kamPart.actions).toHaveLength(0)

		const fullPart = result.parts[1]
		expect(fullPart).toBeTruthy()
		expect(fullPart.part.invalid).toBe(true)
	})

	it('Creates graphic for GRAFIK=FULL with Pilot', () => {
		const ingestSegment = makeIngestSegment(
			[
				['GRAFIK=FULL'],
				[
					'#cg4 pilotdata',
					'News/Citast/ARFG/LIVE/stoppoints_3',
					'VCPID=2547768',
					'ContinueCount=8',
					'News/Citat/ARFG/LIVE/stoppoints_3'
				]
			],
			`\r\n<pi>Kam 1</pi>\r\n<p>Some script</p>\r\n<p><a idref="0"></a></p>\r\n<p><a idref="1"></a></p>\r\n`
		)
		const context = makeMockContext()
		const result = getSegment(context, ingestSegment)
		expectNotesToBe(context, [])
		expect(result.segment.isHidden).toBe(false)
		expect(result.parts).toHaveLength(2)
		expectAllPartsToBeValid(result)

		const kamPart = result.parts[0]
		expect(kamPart).toBeTruthy()
		expect(kamPart.pieces).toHaveLength(2)
		expect(kamPart.pieces.map(p => p.sourceLayerId)).toEqual([SourceLayer.PgmCam, SourceLayer.PgmScript])
		expect(kamPart.adLibPieces).toHaveLength(0)
		expect(kamPart.actions).toHaveLength(0)

		const fullPart = result.parts[1]
		expect(fullPart).toBeTruthy()
		expect(fullPart.pieces).toHaveLength(1)
		expect(fullPart.pieces.map(p => p.sourceLayerId)).toEqual([SourceLayer.PgmPilot])
	})
})
