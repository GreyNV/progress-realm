// Compatibility shim. The browser runtime installs `CharacterBackground` from `src/ui`.
const CharacterBackground = globalThis.CharacterBackground || {};

if (typeof module !== 'undefined') {
    module.exports = { CharacterBackground };
}
