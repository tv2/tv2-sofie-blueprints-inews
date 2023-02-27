import { IStudioContext, TSR } from 'blueprints-integration'
import { instance, mock, when } from 'ts-mockito'
import { literal, TriCaster, TV2StudioConfig, TV2StudioConfigBase, UniformConfig } from 'tv2-common'
import { SwitcherAuxLLayer, SwitcherDveLLayer, SwitcherMixEffectLLayer } from 'tv2-constants'
import { TriCasterDveConverter } from '../TriCasterDveConverter'
import { AuxProps, DskProps, MixEffectProps, TransitionStyle } from '../types'

const DURATION_FRAMES: number = 50
const DURATION_SECONDS: number = DURATION_FRAMES / 25

function createTestee(studioMock?: TV2StudioConfig): TriCaster {
	const context = mock<IStudioContext>()
	const config = studioMock ?? mock<TV2StudioConfig>()
	const uniformConfig = mock<UniformConfig>()
	const dveConverter = mock<TriCasterDveConverter>()

	return new TriCaster(context, config, uniformConfig, dveConverter)
}

describe('TriCaster', () => {
	describe('Mix Effect', () => {
		const DEFAULT_ME: MixEffectProps = {
			layer: SwitcherMixEffectLLayer.Program,
			content: {
				input: 5
			}
		}
		test('sets timeline object defaults', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject(DEFAULT_ME)
			expect(timelineObject).toMatchObject({
				id: '',
				enable: { start: 0 },
				priority: 0,
				content: {
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME
				}
			})
		})

		test('sets classes', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				...DEFAULT_ME,
				classes: ['classA', 'classB']
			})
			expect(timelineObject).toMatchObject({
				classes: ['classA', 'classB']
			})
		})

		test('sets metaData', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				...DEFAULT_ME,
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
			expect(timelineObject).toMatchObject({
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
		})

		test('sets layer prefix', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject(DEFAULT_ME)
			expect(timelineObject).toMatchObject({
				layer: prefixLayer(SwitcherMixEffectLLayer.Program)
			})
		})

		test('sets programInput', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject(DEFAULT_ME)
			expect(timelineObject).toMatchObject({
				content: {
					me: {
						programInput: 'input5'
					}
				}
			})
		})

		test('sets previewInput', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					previewInput: 5
				}
			})
			expect(timelineObject).toMatchObject({
				content: {
					me: {
						previewInput: 'input5'
					}
				}
			})
		})

		test('supports MIX', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					input: 5,
					transition: TransitionStyle.MIX,
					transitionDuration: DURATION_FRAMES
				}
			})
			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						programInput: 'input5',
						transitionEffect: 'fade',
						transitionDuration: DURATION_SECONDS
					}
				})
			})
		})

		test('supports WIPE', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					input: 3,
					transition: TransitionStyle.WIPE,
					transitionDuration: DURATION_FRAMES
				}
			})
			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						programInput: 'input3',
						transitionEffect: 3,
						transitionDuration: DURATION_SECONDS
					}
				})
			})
		})

		test('supports WIPE for GFX', () => {
			const wipeRate = 22
			const config = mock<TV2StudioConfig>()
			when(config.studio).thenReturn(({
				HTMLGraphics: {
					GraphicURL: 'donotcare',
					TransitionSettings: { wipeRate, borderSoftness: 20, loopOutTransitionDuration: 15 },
					KeepAliveDuration: 120
				}
			} as any) as TV2StudioConfigBase)
			const testee: TriCaster = createTestee(instance(config))
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					input: 5,
					transition: TransitionStyle.WIPE_FOR_GFX
				}
			})
			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						programInput: 'input5',
						transitionEffect: 4,
						transitionDuration: wipeRate / 25
					}
				})
			})
		})

		test('supports DIP', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					input: 5,
					transition: TransitionStyle.DIP,
					transitionDuration: DURATION_FRAMES
				}
			})
			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						programInput: 'input5',
						transitionEffect: 2,
						transitionDuration: DURATION_SECONDS
					}
				})
			})
		})

		test('supports keyers', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getMixEffectTimelineObject({
				layer: SwitcherMixEffectLLayer.Program,
				content: {
					keyers: [
						{
							onAir: true,
							config: {
								Number: 0,
								Fill: 5,
								Key: 6,
								Clip: 125,
								Gain: 1
							}
						}
					]
				}
			})
			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						keyers: {
							dsk1: {
								onAir: true,
								input: 'input5'
							}
						}
					}
				})
			})
		})
	})

	describe('Aux', () => {
		const DEFAULT_AUX: AuxProps = {
			layer: SwitcherAuxLLayer.AuxClean,
			content: {
				input: 5
			}
		}
		test('sets timeline object defaults', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getAuxTimelineObject(DEFAULT_AUX)
			expect(timelineObject).toMatchObject({
				id: '',
				enable: { start: 0 },
				priority: 0,
				content: {
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.MIX_OUTPUT
				}
			})
		})

		test('sets classes', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getAuxTimelineObject({
				...DEFAULT_AUX,
				classes: ['classA', 'classB']
			})
			expect(timelineObject).toMatchObject({
				classes: ['classA', 'classB']
			})
		})

		test('sets metaData', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getAuxTimelineObject({
				...DEFAULT_AUX,
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
			expect(timelineObject).toMatchObject({
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
		})

		test('sets layer prefix', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getAuxTimelineObject(DEFAULT_AUX)
			expect(timelineObject).toMatchObject({
				layer: prefixLayer(SwitcherAuxLLayer.AuxClean)
			})
		})

		test('sets aux source', () => {
			const testee: TriCaster = createTestee()

			const timelineObject = testee.getAuxTimelineObject(DEFAULT_AUX)

			expect(timelineObject).toMatchObject({
				content: {
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.MIX_OUTPUT,
					source: 'input5'
				}
			})
		})
	})

	describe('DSK', () => {
		const DEFAULT_DSK: DskProps = {
			layer: 'dsk_1',
			content: {
				onAir: true,
				config: {
					Number: 0,
					Fill: 5,
					Key: 6,
					Clip: 125,
					Gain: 1
				}
			}
		}
		test('sets timeline object defaults', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getDskTimelineObject(DEFAULT_DSK)
			expect(timelineObject).toMatchObject({
				id: '',
				enable: { start: 0 },
				priority: 0,
				content: {
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME
				}
			})
		})

		test('sets classes', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getDskTimelineObject({
				...DEFAULT_DSK,
				classes: ['classA', 'classB']
			})
			expect(timelineObject).toMatchObject({
				classes: ['classA', 'classB']
			})
		})

		test('sets metaData', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getDskTimelineObject({
				...DEFAULT_DSK,
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
			expect(timelineObject).toMatchObject({
				metaData: { context: 'Some Context', mediaPlayerSession: 'mySession' }
			})
		})

		test('sets layer prefix', () => {
			const testee: TriCaster = createTestee()
			const timelineObject = testee.getDskTimelineObject(DEFAULT_DSK)
			expect(timelineObject).toMatchObject({
				layer: prefixLayer('dsk_1')
			})
		})

		test('enables DSK', () => {
			const testee: TriCaster = createTestee()

			const timelineObject = testee.getDskTimelineObject(DEFAULT_DSK)

			expect(timelineObject).toMatchObject({
				content: literal<TSR.TimelineObjTriCasterME['content']>({
					deviceType: TSR.DeviceType.TRICASTER,
					type: TSR.TimelineContentTypeTriCaster.ME,
					me: {
						keyers: {
							dsk1: {
								onAir: true
							}
						}
					}
				})
			})
		})
	})

	describe('getDveTimelineObjects', () => {
		it('creates one TriCaster DVE timelineObject', () => {
			const testee: TriCaster = createTestee()
			const result: TSR.TSRTimelineObj[] = testee.getDveTimelineObjects(getBasicDveProps())

			expect(result).toHaveLength(1)
			expect(result[0].layer).toBe(prefixLayer(SwitcherDveLLayer.DveBoxes))
		})

		// TODO: Replace with interface
		function getBasicDveProps(boxes?: any[]) {
			return {
				content: {
					boxes: boxes ?? [{ enabled: false }, { enabled: false }, { enabled: false }, { enabled: false }],
					template: {},
					artFillSource: 0,
					artCutSource: 0
				}
			}
		}

		it('creates timelineObject content for TriCaster MixEffect', () => {
			const testee: TriCaster = createTestee()
			const result: TSR.TimelineObjTriCasterME['content'] = testee.getDveTimelineObjects(getBasicDveProps())[0]
				.content as TSR.TimelineObjTriCasterME['content']

			expect(result.deviceType).toBe(TSR.DeviceType.TRICASTER)
			expect(result.type).toBe(TSR.TimelineContentTypeTriCaster.ME)
			expect(result.me).toBeTruthy()
		})

		it('generate overlay keyer', () => {
			const config = mock<TV2StudioConfig>()
			const artFillSource = 10
			when(config.studio).thenReturn(({
				SwitcherSource: {
					SplitArtFill: artFillSource
				}
			} as any) as TV2StudioConfigBase)
			const testee: TriCaster = createTestee(instance(config))
			const content: TSR.TimelineObjTriCasterME['content'] = testee.getDveTimelineObjects(getBasicDveProps())[0]
				.content as TSR.TimelineObjTriCasterME['content']
			const result: Record<TSR.TriCasterKeyerName, TSR.TriCasterKeyer> = content.me.keyers!

			expect(result).toBeTruthy()
			expect(result.dsk1).toBeTruthy()
			expect(result.dsk1.input).toBe(`input${artFillSource}`)
			expect(result.dsk1.onAir).toBeTruthy()
			expect(result.dsk1.transitionEffect).toBe('cut')
		})

		it("has no enabled boxes, all layers are 'invisible'", () => {
			const testee: TriCaster = createTestee()
			const emptyBoxes = [{ enabled: false }, { enabled: false }, { enabled: false }, { enabled: false }]
			const content = testee.getDveTimelineObjects(getBasicDveProps(emptyBoxes))[0]
				.content as TSR.TimelineObjTriCasterME['content']
			const result: Partial<Record<
				TSR.TriCasterLayerName,
				TSR.TriCasterLayer
			>> = (content.me as TSR.TriCasterMixEffectInEffectMode).layers!

			expect(result.a).toMatchObject(invisibleBox())
			expect(result.b).toMatchObject(invisibleBox())
			expect(result.c).toMatchObject(invisibleBox())
			expect(result.d).toMatchObject(invisibleBox())
		})

		function invisibleBox(): TSR.TriCasterLayer {
			return {
				input: 'Black',
				positioningAndCropEnabled: true,
				position: {
					x: -3.555,
					y: -2
				},
				crop: {
					down: 0,
					up: 0,
					left: 0,
					right: 0
				}
			}
		}

		it('has enabled layer A, create box for A', () => {
			const boxes = [{ enabled: true, source: 1 }, { enabled: false }, { enabled: false }, { enabled: false }]
			const layers = getLayers(boxes)
			assertLayer(layers.a!)
		})

		function getLayers(
			boxes: Array<{ enabled: boolean; source?: number }>
		): Partial<Record<TSR.TriCasterLayerName, TSR.TriCasterLayer>> {
			const testee: TriCaster = createTestee()
			const content = testee.getDveTimelineObjects(getBasicDveProps(boxes))[0]
				.content as TSR.TimelineObjTriCasterME['content']
			return (content.me as TSR.TriCasterMixEffectInEffectMode).layers!
		}

		function assertLayer(box: TSR.TriCasterLayer): void {
			expect(box).toBeTruthy()
			expect(box.input).toBeTruthy()
			expect(box.positioningAndCropEnabled).toBeTruthy()
			expect(box.position).toBeTruthy()
			expect(box.scale).toBeTruthy()
			expect(box.crop).toBeTruthy()
		}

		it('has enabled layer B, create box for B', () => {
			const boxes = [{ enabled: false }, { enabled: true, source: 1 }, { enabled: false }, { enabled: false }]
			const layers = getLayers(boxes)
			assertLayer(layers.b!)
		})

		it('has enabled layer C, create box for C', () => {
			const boxes = [{ enabled: false }, { enabled: false }, { enabled: true, source: 1 }, { enabled: false }]
			const layers = getLayers(boxes)
			assertLayer(layers.c!)
		})

		it('has enabled layer D, create box for D', () => {
			const boxes = [{ enabled: false }, { enabled: false }, { enabled: false }, { enabled: true, source: 1 }]
			const layers = getLayers(boxes)
			assertLayer(layers.d!)
		})
	})
})

function prefixLayer(layerName: string) {
	return 'tricaster_' + layerName
}
