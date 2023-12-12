import { Prefs, configure, cfg } from "./config/index.js";
import { Platform, bind } from "./platform/index.js";
import * as cache from "./cache.js";
import { clear as clearContext } from "./context.js";

export { Platform, std } from "./platform/index.js";
export { Prefs, cfg, defaults } from "./config/index.js";
export { Plugin } from "./config/plugin.js";
export { ctx } from "./context.js";
export { Cache, cache } from "./cache.js";
export { transform } from "./transform/index.js";

/** Initializes build context with specified options.
 *  @param prefs Build preferences; will use pre-defined defaults when not assigned.
 *  @param platform Runtime APIs to use; will attempt to detect automatically when not assigned. */
export async function boot(prefs?: Prefs, platform?: Platform): Promise<void> {
    await bind(platform);
    if (prefs) configure(prefs);
    if (cfg.cache) Object.assign(cache.cache, await cache.load());
}

/** Resets build context and caches results. */
export async function exit(): Promise<void> {
    clearContext();
    if (cfg.cache) await cache.save(cache.cache);
}
