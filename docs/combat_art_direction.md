# Combat Art Direction

This document defines the first visual pass for the new adventure combat system.
It is meant to remove ambiguity before raster asset production begins.

## Visual Direction

- Mood: dark fantasy survival with restrained heroic framing
- Rendering style: painted 2D illustration with readable silhouettes, not pixel art
- Detail level: mid-detail, clean enough for UI scaling down to card and battle-console sizes
- Lighting: moody directional light with warm highlights and cool shadow separation
- Palette:
  - player/hero: muted leather browns, steel gray, faded blue cloth, warm skin tones
  - beasts: earthy fur, mud reds, bone ivory
  - constructs/vault enemies: oxidized bronze, stone gray, pale teal glow
  - bandits/humanoids: desaturated reds, dark iron, smoke brown
- Background treatment: transparent or effectively isolated subject whenever possible so assets can be reused in both the battle console and inventory/equipment UI

## Sprite Targets

### 1. Player combat portrait

- File target: `assets/char/combat_traveler.png`
- Use: battle console player sprite
- Framing: 3/4 body, slightly facing right
- Pose: ready stance, grounded, readable with one-handed weapon or shield pairing
- Costume baseline:
  - simple medieval traveler tunic
  - rugged boots
  - worn leather belts and straps
  - no oversized capes or ornate fantasy armor
- Expression: focused, wary, determined
- Variant behavior:
  - base sprite should still read correctly when no weapon or shield is equipped
  - equipment overlays can remain future work, but the pose must support them

### 2. Enemy sprites

- File target: `assets/enc/combat_wolf.png`
- Use: wolf ambush enemy
- Framing: side-on or 3/4 beast profile facing left
- Pose: lunging or tense stalking pose
- Priority: sharp silhouette, visible jaws, front-leg action

- File target: `assets/enc/combat_boar.png`
- Use: boar hunt enemy
- Framing: 3/4 charging view facing left
- Pose: low center of gravity, heavy front-loaded mass, aggressive tusk read
- Priority: brute-force presence, readable head and shoulder mass

- File target: `assets/enc/combat_bandit_captain.png`
- Use: bandits ambush enemy
- Framing: torso-up or 3/4 body facing left
- Pose: sword-ready leader stance
- Costume:
  - scavenged leather and cloth armor
  - rough metal accents
  - practical outlaw look, not noble armor
- Priority: identifiable humanoid threat with stronger authority than common enemies

- File target: `assets/enc/combat_vault_warden.png`
- Use: ancient vault enemy
- Framing: 3/4 body facing left
- Pose: sentinel stance with rigid structure
- Materials:
  - ancient stone
  - bronze or iron reinforcement
  - faint arcane glow in seams/eyes
- Priority: “ancient construct” silhouette, not a generic armored knight

### 3. Equipment key art

- File target: `assets/items/combat_iron_sword.png`
- Use: larger battle/readable equipment render if current item icon is too small
- Framing: isolated angled weapon on transparent or neutral backdrop

- File target: `assets/items/combat_stone_spear.png`
- Use: weapon detail display for early-game loadouts
- Framing: isolated angled spear

- File target: `assets/items/combat_wooden_shield.png`
- Use: shield detail display in battle/equipment views
- Framing: isolated shield, slightly tilted

- File target: `assets/items/combat_leather_armor.png`
- Use: armor detail card / equipment UI enhancement
- Framing: isolated torso armor display

These are secondary to the character/enemy sprites and can reuse existing inventory icons temporarily if production time is limited.

## Composition Rules

- Subjects must be centered with enough breathing room for responsive crop
- Avoid background storytelling that merges with silhouette edges
- Keep feet or lower-body grounding visible on full-body sprites
- Do not crop weapons so tightly that handedness becomes unclear
- Enemy sprites should all face toward the player side in battle
- Player sprite should face toward the enemy side in battle
- Maintain consistent approximate camera height across all combat portraits

## UI Fit Requirements

- Minimum clean read at:
  - 240x320 for player/enemy battle sprite panels
  - 120x120 for equipment detail cards
- Preferred master size:
  - character/enemy sprites: 768x1024 or 1024x1024
  - isolated equipment art: 768x768
- Important silhouette information must remain readable when scaled down by 60-70%
- Transparent background preferred for final exported sprites
- If transparency is not possible, use a very dark neutral backdrop that can still sit cleanly inside the current combat panel

## Prompt Pack

### Player

Use case: stylized-concept  
Asset type: web game combat sprite  
Primary request: a painted 2D combat portrait of a young medieval survivor hero for a dark fantasy resource-management game  
Subject: lean traveler in worn leather and cloth, practical gear, grounded ready stance, determined expression  
Style/medium: painterly 2D game concept art, readable silhouette, mid-detail fantasy UI asset  
Composition/framing: 3/4 body, facing right, centered, transparent or isolated background  
Lighting/mood: moody warm rim light with cool ambient shadows  
Color palette: muted browns, weathered leather, steel gray, faded blue accents  
Constraints: no oversized fantasy armor, no giant weapon, no text, no watermark  
Avoid: photorealism, cartoon exaggeration, cluttered background

### Wolf

Use case: stylized-concept  
Asset type: web game enemy sprite  
Primary request: a painted 2D combat sprite of a starving wolf enemy for a dark fantasy battle console  
Subject: tense wolf in mid-lunge with visible fangs and lean body  
Style/medium: painterly 2D game concept art  
Composition/framing: 3/4 beast profile facing left, centered, transparent or isolated background  
Lighting/mood: cold forest shadow with subtle warm highlight  
Constraints: readable silhouette, no rider, no text, no watermark  
Avoid: cute expression, pack background, excessive motion blur

### Boar

Use case: stylized-concept  
Asset type: web game enemy sprite  
Primary request: a painted 2D combat sprite of a brutal wild boar enemy for a dark fantasy game  
Subject: heavy razorback boar with visible tusks and charging posture  
Style/medium: painterly 2D game concept art  
Composition/framing: 3/4 body facing left, centered, isolated background  
Lighting/mood: earthy, dusty, aggressive  
Constraints: strong silhouette, visible shoulder mass, no text, no watermark  
Avoid: cute proportions, ornate fantasy armor

### Bandit Captain

Use case: stylized-concept  
Asset type: web game enemy sprite  
Primary request: a painted 2D combat portrait of a bandit captain enemy for a dark fantasy battle interface  
Subject: hardened outlaw leader with worn leather armor, practical sword, intimidating stance  
Style/medium: painterly 2D game concept art  
Composition/framing: 3/4 body facing left, centered, isolated background  
Lighting/mood: smoky warm light with grim atmosphere  
Constraints: grounded medieval outlaw look, no text, no watermark  
Avoid: noble knight styling, comic-book proportions

### Vault Warden

Use case: stylized-concept  
Asset type: web game enemy sprite  
Primary request: a painted 2D combat sprite of an ancient vault guardian construct  
Subject: stone-and-bronze sentinel with faint arcane glow and rigid ceremonial posture  
Style/medium: painterly 2D game concept art  
Composition/framing: 3/4 body facing left, centered, isolated background  
Lighting/mood: mysterious cold glow with ancient metallic highlights  
Constraints: readable construct silhouette, no text, no watermark  
Avoid: generic robot styling, sci-fi panels, modern tech look

## Production Order

1. `combat_traveler.png`
2. `combat_wolf.png`
3. `combat_boar.png`
4. `combat_bandit_captain.png`
5. `combat_vault_warden.png`
6. optional larger equipment renders

## Integration Notes

- When final sprites exist, update combat enemy `sprite` fields in `data/encounters.json`
- Point player battle rendering to `assets/char/combat_traveler.png` as the base sprite if it replaces the current portrait fallback
- Existing item icons can remain in inventory until dedicated equipment key art is available
