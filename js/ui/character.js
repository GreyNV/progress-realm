// Compatibility shim. The browser runtime installs `CharacterUI` from `src/ui`.
const CharacterUI = globalThis.CharacterUI || {};

if (typeof module !== 'undefined') {
    module.exports = { CharacterUI };
}
