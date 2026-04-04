const LEGACY_SCRIPTS: string[] = [];

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load legacy script ${src}`));
        document.body.appendChild(script);
    });
}

export async function loadLegacyScripts(): Promise<void> {
    for (const script of LEGACY_SCRIPTS) {
        await loadScript(script);
    }
}
