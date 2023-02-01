import { SomeContent, TSR, WithTimeline } from 'blueprints-integration'
import { EnableDSK, GetTimelineLayerForGraphic, literal } from 'tv2-common'

import { InternalGraphic } from '../internal'

export class VizInternalGraphic extends InternalGraphic {
	protected getContent(): WithTimeline<SomeContent> {
		return {
			fileName: this.cue.graphic.template,
			path: this.cue.graphic.template,
			ignoreMediaObjectStatus: true,
			timelineObjects: literal<TSR.TSRTimelineObj[]>([
				literal<TSR.TimelineObjVIZMSEElementInternal>({
					id: '',
					enable: this.GetEnableForGraphic(),
					priority: 1,
					layer: GetTimelineLayerForGraphic(this.config, this.templateName),
					content: {
						deviceType: TSR.DeviceType.VIZMSE,
						type: TSR.TimelineContentTypeVizMSE.ELEMENT_INTERNAL,
						templateName: this.templateName,
						templateData: this.cue.graphic.textFields,
						channelName: this.engine === 'WALL' ? 'WALL1' : 'OVL1', // TODO: TranslateEngine
						showName: this.findShowName()
					}
				}),
				// Assume DSK is off by default (config table)
				...EnableDSK(this.context, 'OVL')
			])
		}
	}

	private findShowName(): string {
		const graphicsSetup = this.config.selectedGfxSetup
		switch (this.engine) {
			case 'FULL':
			case 'WALL':
				if (graphicsSetup.FullShowName === undefined) {
					this.core.logWarning("You're using Viz graphics with an incompatible ShowStyle")
					return ''
				}
				return graphicsSetup.FullShowName
			case 'TLF':
			case 'OVL':
				if (graphicsSetup.OvlShowName === undefined) {
					this.core.logWarning("You're using Viz graphics with an incompatible ShowStyle")
					return ''
				}
				return graphicsSetup.OvlShowName
		}
	}
}
