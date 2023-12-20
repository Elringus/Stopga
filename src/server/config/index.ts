import { Options } from "./options.js";
import { defaults } from "./defaults.js";

export * from "./options.js";
export { defaults } from "./defaults.js";

/** User-defined build preferences. */
export type Prefs = { [P in keyof Options]?: Partial<Options[P]>; };

/** Current build configuration. */
export const cfg: Readonly<Options> = defaults;

/** Specifies current build configuration. */
export function configure(prefs: Prefs) {
    for (const prop of Object.getOwnPropertyNames(prefs))
        merge(prefs, cfg, prop);
}

function merge(from: Record<string, unknown>, to: Record<string, unknown>, prop: string) {
    if (isSubOptions(from[prop])) {
        if (to[prop] == null) to[prop] = {};
        for (const sub of Object.getOwnPropertyNames(from[prop]))
            merge(<never>from[prop], <never>to[prop], sub);
    } else to[prop] = from[prop];
}

function isSubOptions(obj: unknown): obj is Record<string, unknown> {
    return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
