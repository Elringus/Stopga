﻿import { it, expect, vi } from "vitest";
import { std, boot } from "./common.js";
import vite from "../../src/plugin/vite.js";
import youtube from "../../src/plugin/youtube/index.js";

it("invokes server boot on build start", async () => {
    const boot = vi.spyOn(await import("../../src/server/index.js"), "boot");
    await vite().buildStart({});
    expect(boot).toHaveBeenCalled();
});

it("invokes server transform on document transform", async () => {
    const transform = vi.spyOn(await import("../../src/server/transform/index.js"), "transform");
    await vite().transform("", "");
    expect(transform).toHaveBeenCalled();
});

it("doesn't invoke transform when document matches skip config", async () => {
    const transform = vi.spyOn(await import("../../src/server/transform/index.js"), "transform");
    await vite({ skip: (filename) => !filename.endsWith(".md") }).transform("", "foo.js");
    expect(transform).not.toHaveBeenCalled();
});

it("invokes server transform on index transform", async () => {
    await boot();
    const transform = vi.spyOn(await import("../../src/server/transform/index.js"), "transform");
    await vite().transformIndexHtml.handler("", { filename: "" });
    expect(transform).toHaveBeenCalled();
});

it("doesn't invoke transform when index matches skip config", async () => {
    await boot();
    const transform = vi.spyOn(await import("../../src/server/transform/index.js"), "transform");
    await vite({ skip: (filename) => !filename.endsWith(".md") })
        .transformIndexHtml.handler("", { filename: "foo.js" });
    expect(transform).not.toHaveBeenCalled();
});

it("injects main client module and styles to index html", async () => {
    await boot();
    std.path.resolve.mockReturnValue("foo");
    expect(await vite().transformIndexHtml.handler("", { filename: "" })).toStrictEqual({
        html: "",
        tags: [{
            tag: "link", injectTo: "head",
            attrs: { "rel": "stylesheet", "type": "text/css", "href": expect.stringContaining("foo") }
        }, {
            tag: "script", injectTo: "body", attrs: { type: "module" },
            children: expect.stringContaining("foo")
        }]
    });
});

it("injects plugin client modules and styles to index html", async () => {
    await boot();
    std.path.resolve.mockReturnValue("foo");
    expect(await vite({ plugins: [youtube()] }).transformIndexHtml.handler("", { filename: "" })).toStrictEqual({
        html: "",
        tags: [{
            tag: "link", injectTo: "head",
            attrs: { "rel": "stylesheet", "type": "text/css", "href": expect.stringContaining("foo") }
        }, {
            tag: "script", injectTo: "body", attrs: { type: "module" },
            children: expect.stringContaining("foo")
        }, {
            tag: "script", injectTo: "body", attrs: { type: "module" },
            children: expect.stringContaining("client.js")
        }, {
            tag: "link", injectTo: "head",
            attrs: { "rel": "stylesheet", "type": "text/css", "href": expect.stringContaining("styles.css") }
        }]
    });
});

it("doesn't inject client module when disabled in plugin config", async () => {
    await boot();
    std.path.resolve.mockReturnValue("bar");
    expect(await vite({ inject: false }).transformIndexHtml.handler("", { filename: "" })).toStrictEqual({
        html: "",
        tags: []
    });
});

it("doesn't resolve non-imgit module imports", async () => {
    vi.spyOn(await import("../../src/server/import.js"), "isImgitAssetImport").mockReturnValue(false);
    expect(vite().resolveId("foo")).toBeNull();
});

it("resolves imgit module imports", async () => {
    vi.spyOn(await import("../../src/server/import.js"), "isImgitAssetImport").mockReturnValue(true);
    expect(vite().resolveId("foo")).toStrictEqual("foo");
});

it("doesn't load non-imgit import", async () => {
    vi.spyOn(await import("../../src/server/import.js"), "isImgitAssetImport").mockReturnValue(false);
    const load = vi.spyOn(await import("../../src/server/import.js"), "importImgitAsset");
    load.mockImplementation(() => Promise.reject());
    await vite().load("");
    expect(load).not.toBeCalled();
});

it("loads imgit import", async () => {
    vi.spyOn(await import("../../src/server/import.js"), "isImgitAssetImport").mockReturnValue(true);
    const load = vi.spyOn(await import("../../src/server/import.js"), "importImgitAsset");
    load.mockImplementation(() => Promise.resolve("foo"));
    await vite().load("");
    expect(load).toBeCalled();
});
