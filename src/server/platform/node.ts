// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import afs from "node:fs/promises";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { promisify } from "node:util";
// @ts-ignore
import { fileURLToPath } from "node:url";
// @ts-ignore
import { exec } from "node:child_process";
import { Platform } from "./platform";

// https://nodejs.org/api/buffer.html
declare module Buffer {
    const from: (data: Uint8Array) => { toString: (fmt: string) => string };
}

// https://nodejs.org/api/fs.html
declare module fs {
    const existsSync: (path: string) => boolean;
}

// https://nodejs.org/api/fs.html#promises-api
declare module afs {
    const stat: (path: string) => Promise<{ size: number }>;
    const readFile: (path: string, fmt?: string) => Promise<string | ArrayBufferLike>;
    const writeFile: (path: string, content: string | ArrayBufferLike, fmt?: string) => Promise<void>;
    const unlink: (path: string) => Promise<void>;
    const mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
}

// https://nodejs.org/api/path.html
declare module path {
    const join: (...parts: string[]) => string;
    const resolve: (...parts: string[]) => string;
    const relative: (...parts: string[]) => string;
    const basename: (path: string) => string;
    const dirname: (path: string) => string;
}

// https://nodejs.org/api/process.html
declare module process {
    const stdout: {
        isTTY?: boolean;
        clearLine: (idx: number) => void;
        cursorTo: (idx: number) => void;
        write: (msg: string) => void;
    };
}

// https://nodejs.org/api/console.html
declare module console {
    const info: (msg: string) => void;
    const warn: (msg: string) => void;
    const error: (msg: string) => void;
}

export const node: Readonly<Platform> = {
    fs: {
        exists: async path => fs.existsSync(path),
        size: path => afs.stat(path).then(s => s.size),
        read: async (path, encoding) => {
            if (encoding === "utf8") return <never>await afs.readFile(path, "utf-8");
            return <never>new Uint8Array(<ArrayBufferLike>await afs.readFile(path));
        },
        write: (path, content) => {
            if (typeof content === "string") return afs.writeFile(path, content, "utf-8");
            return afs.writeFile(path, content);
        },
        remove: afs.unlink,
        mkdir: (path: string) => afs.mkdir(path, { recursive: true }).then()
    },
    path: {
        join: (...p) => path.join(...p).replaceAll("\\", "/"),
        resolve: (...p) => path.resolve(...p).replaceAll("\\", "/"),
        relative: (from, to) => path.relative(from, to).replaceAll("\\", "/"),
        basename: path.basename,
        dirname: p => path.dirname(p).replaceAll("\\", "/"),
        fileUrlToPath: url => fileURLToPath(url).replaceAll("\\", "/")
    },
    log: {
        tty: msg => {
            if (!process.stdout.isTTY) return;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(msg);
        },
        info: console.info,
        warn: console.warn,
        err: console.error
    },
    exec: async cmd => {
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync(cmd);
        return { out: stdout, err: stderr?.length > 0 ? Error(stderr) : undefined };
    },
    fetch: (url, abort) => fetch(url, { signal: abort }),
    wait: (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),
    base64: async data => Buffer.from(data).toString("base64")
};
