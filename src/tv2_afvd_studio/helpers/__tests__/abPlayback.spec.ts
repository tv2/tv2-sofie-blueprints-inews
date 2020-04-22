import { IBlueprintPieceInstance, OnGenerateTimelineObj, TSR } from 'tv-automation-sofie-blueprints-integration'
import {
	applyMediaPlayersAssignments,
	doesRequestOverlap,
	literal,
	PieceMetaData,
	resolveMediaPlayerAssignments,
	SessionToPlayerMap,
	TimelineBlueprintExt,
	TimelinePersistentStateExt
} from 'tv2-common'
import { MediaPlayerClaimType } from 'tv2-constants'
import { LoggingNotesContext, NotesContext } from '../../../__mocks__/context'
import { defaultStudioConfig } from '../config'

const playerSourceLayers = {
	Caspar: {
		ClipPending: 'test0_caspar_player_clip_pending',
		PlayerClip: (id: string | number) => `test0_caspar_player_clip_${id}`
	},
	Sisyfos: {
		ClipPending: 'test0_sisyfos_player_clip_pending',
		PlayerA: 'test0_sisyfos_player_a',
		PlayerB: 'test0_sisyfos_player_b'
	}
}

export function createBasicPiece(
	id: string,
	start: number,
	duration: number | undefined,
	reqId: string | undefined,
	optional?: boolean
) {
	const piece = literal<IBlueprintPieceInstance>({
		_id: id,
		piece: {
			_id: id,
			externalId: id,
			name: id,
			enable: {
				start
			},
			sourceLayerId: '',
			outputLayerId: '',
			playoutDuration: duration,
			metaData: {}
		}
	})

	const metadata = piece.piece.metaData as PieceMetaData

	if (reqId !== undefined) {
		metadata.mediaPlayerSessions = [reqId]
	}
	if (optional) {
		metadata.mediaPlayerOptional = true
	}

	return piece
}

describe('doesRequestOverlap', () => {
	test('both infinite', () => {
		const a = {
			id: 'a',
			start: 100,
			end: undefined,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 200,
			end: undefined,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeTruthy()
		expect(doesRequestOverlap(b, a)).toBeTruthy()
	})
	test('one infinite, other starts after', () => {
		const a = {
			id: 'a',
			start: 100,
			end: undefined,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 200,
			end: 400,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeTruthy()
		expect(doesRequestOverlap(b, a)).toBeTruthy()
	})
	test('one infinite, other starts before', () => {
		const a = {
			id: 'a',
			start: 100,
			end: undefined,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 50,
			end: 200,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeTruthy()
		expect(doesRequestOverlap(b, a)).toBeTruthy()
	})
	test('one infinite, other ends before', () => {
		const a = {
			id: 'a',
			start: 100,
			end: undefined,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 50,
			end: 90,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeFalsy()
		expect(doesRequestOverlap(b, a)).toBeFalsy()
	})
	test('no infinite, no overlap', () => {
		const a = {
			id: 'a',
			start: 100,
			end: 200,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 300,
			end: 400,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeFalsy()
		expect(doesRequestOverlap(b, a)).toBeFalsy()
	})
	test('no infinite, small overlap', () => {
		const a = {
			id: 'a',
			start: 100,
			end: 200,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 190,
			end: 300,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeTruthy()
		expect(doesRequestOverlap(b, a)).toBeTruthy()
	})
	test('no infinite, one inside', () => {
		const a = {
			id: 'a',
			start: 100,
			end: 400,
			player: '1',
			type: MediaPlayerClaimType.Active
		}
		const b = {
			id: 'b',
			start: 200,
			end: 300,
			player: '2',
			type: MediaPlayerClaimType.Active
		}

		expect(doesRequestOverlap(a, b)).toBeTruthy()
		expect(doesRequestOverlap(b, a)).toBeTruthy()
	})
})

describe('resolveMediaPlayerAssignments', () => {
	const context = new LoggingNotesContext('resolveMediaPlayerAssignments')
	const config = defaultStudioConfig(context)

	test('Test no pieces', () => {
		const assignments = resolveMediaPlayerAssignments(context, config, {}, [])
		expect(assignments).toHaveLength(0)
	})

	test('Test basic pieces', () => {
		const previousAssignments = {}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'),
			createBasicPiece('1', 400, 5000, 'def'),
			createBasicPiece('2', 800, 4000, 'ghi')
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(3)
		expect(assignments).toEqual([
			{ end: 5400, id: 'abc', player: '1', start: 400, type: 1, optional: false },
			{ end: 5400, id: 'def', player: '2', start: 400, type: 1, optional: false },
			{ end: 4800, id: 'ghi', player: undefined, start: 800, type: 1, optional: false }
		])
	})

	test('Multiple pieces same id', () => {
		const previousAssignments = {}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'), // First
			createBasicPiece('1', 800, 4000, 'abc'), // Overlap
			createBasicPiece('2', 5400, 1000, 'abc'), // Flush with last
			createBasicPiece('3', 6400, 1000, 'abc') // Gap before
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(1)
		expect(assignments).toEqual([{ end: 7400, id: 'abc', player: '1', start: 400, type: 1, optional: false }])
	})

	test('Reuse after gap', () => {
		const previousAssignments = {}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'), // First
			createBasicPiece('1', 800, 4000, 'def'), // Second
			createBasicPiece('3', 6400, 1000, 'ghi') // Wait, then reuse first
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(3)
		expect(assignments).toEqual([
			{ end: 5400, id: 'abc', player: '1', start: 400, type: 1, optional: false },
			{ end: 4800, id: 'def', player: '2', start: 800, type: 1, optional: false },
			{ end: 7400, id: 'ghi', player: '1', start: 6400, type: 1, optional: false }
		])
	})

	test('Reuse immediately', () => {
		const previousAssignments = {}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'), // First
			createBasicPiece('1', 800, 6000, 'def'), // Second
			createBasicPiece('3', 5400, 1000, 'ghi') // Wait, then reuse first
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(3)
		expect(assignments).toEqual([
			{ end: 5400, id: 'abc', player: '1', start: 400, type: 1, optional: false },
			{ end: 6800, id: 'def', player: '2', start: 800, type: 1, optional: false },
			{ end: 6400, id: 'ghi', player: '1', start: 5400, type: 1, optional: false }
		])
	})

	test('Test basic reassignment', () => {
		const previousAssignments: SessionToPlayerMap = {
			abc: {
				sessionId: 'abc',
				playerId: 5,
				lookahead: false
			},
			def: {
				sessionId: 'def',
				playerId: 3,
				lookahead: true
			}
		}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'),
			createBasicPiece('1', 400, 5000, 'def'),
			createBasicPiece('2', 800, 4000, 'ghi')
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(3)
		expect(assignments).toEqual([
			{ end: 5400, id: 'abc', player: '5', start: 400, type: 1, optional: false },
			{ end: 5400, id: 'def', player: '3', start: 400, type: 0, optional: false },
			{ end: 4800, id: 'ghi', player: '1', start: 800, type: 1, optional: false }
		])
	})

	test('Test optional gets discarded', () => {
		const previousAssignments: SessionToPlayerMap = {
			abc: {
				sessionId: 'abc',
				playerId: 2,
				lookahead: false
			},
			def: {
				sessionId: 'def',
				playerId: 1,
				lookahead: false
			}
		}
		const pieces = [
			createBasicPiece('0', 400, 5000, 'abc'),
			createBasicPiece('1', 400, 5000, 'def', true),
			createBasicPiece('2', 800, 4000, 'ghi')
		]

		const assignments = resolveMediaPlayerAssignments(context, config, previousAssignments, pieces)
		expect(assignments).toHaveLength(3)
		expect(assignments).toEqual([
			{ end: 5400, id: 'abc', player: '2', start: 400, type: 1, optional: false },
			{ end: 5400, id: 'def', player: undefined, start: 400, type: 1, optional: true },
			{ end: 4800, id: 'ghi', player: '1', start: 800, type: 1, optional: false }
		])
	})

	// Not really applicable currently. Not in this function call at least
	// test('Test reassignment reclaim lookahead', () => {
	// 	const previousAssignments: SessionToPlayerMap = {
	// 		abc: {
	// 			sessionId: 'abc',
	// 			playerId: 2,
	// 			lookahead: false
	// 		},
	// 		// ghi: {
	// 		// 	sessionId: 'ghi',
	// 		// 	playerId: 1,
	// 		// 	lookahead: true
	// 		// }
	// 	}
	// 	const pieces = [
	// 		createBasicPiece('0', 400, 5000, 'abc'),
	// 		createBasicPiece('1', 400, 5000, 'def'),
	// 	]

	// 	const assignments = resolveMediaPlayerAssignments(context, false, previousAssignments, pieces)
	// 	expect(assignments).toHaveLength(3)
	// 	expect(assignments).toEqual([
	// 		{ 'end': 5400, 'id': 'abc', 'player': 2, 'start': 400, 'type': 1 },
	// 		{ 'end': 5400, 'id': 'def', 'player': 1, 'start': 400, 'type': 0 },
	// 	])
	// })
})

describe('applyMediaPlayersAssignments', () => {
	const context = new NotesContext('assignMediaPlayers')
	const config = defaultStudioConfig(context)

	test('Test no assignments', () => {
		const res = applyMediaPlayersAssignments(context, config, [], {}, [], playerSourceLayers)
		expect(res).toEqual({})
	})

	test('Test only previous assignments', () => {
		const previousAssignments: SessionToPlayerMap = {
			abc: {
				sessionId: 'abc',
				playerId: 5,
				lookahead: false
			},
			def: {
				sessionId: 'def',
				playerId: 3,
				lookahead: true
			}
		}

		const res = applyMediaPlayersAssignments(context, config, [], previousAssignments, [], playerSourceLayers)
		expect(res).toEqual({})
	})

	test('Test object with unmatched assignments', () => {
		const previousAssignments: SessionToPlayerMap = {
			def: {
				sessionId: 'def',
				playerId: 3,
				lookahead: false
			}
		}
		const objects = [
			literal<TimelineBlueprintExt & OnGenerateTimelineObj>({
				// This should not get assigned, as it is truely unknown, and could cause all kinds of chaos
				id: '0',
				layer: '0',
				enable: {
					start: 900,
					duration: 1000
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT
				},
				metaData: {
					mediaPlayerSession: 'abc'
				}
			}),
			literal<TimelineBlueprintExt & OnGenerateTimelineObj>({
				// This should get assigned, as it was previously known
				id: '1',
				layer: '1',
				enable: {
					start: 3000,
					duration: 1000
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT
				},
				metaData: {
					mediaPlayerSession: 'def'
				}
			})
		]

		const res = applyMediaPlayersAssignments(context, config, objects, previousAssignments, [], playerSourceLayers)
		// expect(context.getNotes()).toHaveLength(0)
		expect(res).toEqual(
			literal<TimelinePersistentStateExt['activeMediaPlayers']>({
				3: [
					{
						sessionId: 'def',
						playerId: 3,
						lookahead: false
					}
				]
			})
		)
	})

	// TODO - more tests
})
