import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig, Plugin } from "vite";

function copyRuntimeDirs(): Plugin {
    const dirs = ["assets", "data", "js", "scripts"];
    const files = ["robots.txt"];

    return {
        name: "copy-runtime-dirs",
        closeBundle() {
            const root = process.cwd();
            const dist = path.join(root, "dist");
            if (!existsSync(dist)) {
                mkdirSync(dist, { recursive: true });
            }
            dirs.forEach((dir) => {
                const source = path.join(root, dir);
                const target = path.join(dist, dir);
                if (existsSync(source)) {
                    cpSync(source, target, { recursive: true, force: true });
                }
            });
            files.forEach((file) => {
                const source = path.join(root, file);
                const target = path.join(dist, file);
                if (existsSync(source)) {
                    cpSync(source, target, { force: true });
                }
            });
        }
    };
}

function resolveBasePath(): string {
    const explicitBase = process.env.PAGES_BASE_PATH?.trim();
    if (explicitBase) {
        return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;
    }

    if (process.env.GITHUB_ACTIONS === "true") {
        const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
        if (repositoryName) {
            return `/${repositoryName}/`;
        }
    }

    return "/";
}

export default defineConfig({
    base: resolveBasePath(),
    plugins: [copyRuntimeDirs()],
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"]
    }
});
