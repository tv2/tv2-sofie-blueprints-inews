import { IShowStyleContext, IShowStyleUserContext } from 'blueprints-integration'
import { TV2ShowStyleConfig, VideoSwitcher, VideoSwitcherImpl } from 'tv2-common'

export interface ExtendedShowStyleContext<BlueprintConfig extends TV2ShowStyleConfig = TV2ShowStyleConfig> {
	readonly core: IShowStyleUserContext
	readonly config: BlueprintConfig
	readonly videoSwitcher: VideoSwitcher
}

export class ExtendedShowStyleContextImpl<
	BlueprintConfig extends TV2ShowStyleConfig = TV2ShowStyleConfig,
	CoreContext extends IShowStyleUserContext | IShowStyleContext = IShowStyleUserContext
> {
	public readonly config: BlueprintConfig
	public readonly videoSwitcher: VideoSwitcher

	constructor(readonly core: CoreContext) {
		this.config = this.makeConfig()
		this.videoSwitcher = VideoSwitcherImpl.getVideoSwitcher(this.config)
	}

	private makeConfig(): BlueprintConfig {
		return { ...(this.core.getStudioConfig() as any), ...(this.core.getShowStyleConfig() as any) }
	}
}