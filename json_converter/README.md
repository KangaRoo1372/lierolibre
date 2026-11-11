# WebLiero → LieroLibre Mod Converter

A simple browser tool that converts WebLiero mods (`.json` / `.json5`) into the `lierocfg.txt` format used by [LieroLibre](https://gitlab.com/lierolibre/lierolibre).

The program was created with [Claude](https://claude.ai/), which generated 100% of the code.

## How to use it

1. Download all the files from this repository and put them in the same directory on your HDD.
2. Open `index.html` in your web browser (no installation needed).
3. Select the WebLiero mod file from your HDD (`.json` or `.json5`).
4. Select a "header" file from your HDD (`.txt`): the part of a LieroLibre `lierocfg.txt` that comes before the `Weapons` section (texts, constants, palette, menus, etc.).
5. Optionally tick one or both checkboxes (see below).
6. Click **Convert**, then **Download converted file** to save `lierocfg.txt`.

## What gets converted

- **Weapons + wObjects**: merged into LieroLibre weapons, with values rescaled;
- **nObjects** and **sObjects**;
- **Textures**;
- A default `Others` section is added at the end.

Parameters that LieroLibre doesn't support (especially [WebLiero Extended](https://www.vgm-quiz.com/dev/webliero/extended) properties) are removed automatically.

## Options

- **convert constants & hacks**: copies values from the mod's `constants` section into the header's `Constants → Values` and `Constants → Hacks`, converted to LieroLibre units. Constants that WebLiero doesn't have keep the header's default values.
- **convert colorAnim**: replaces the header's `colorAnim` section with the mod's `colorAnim` values (`from`/`to` pairs).

With both boxes unticked, the header file is used unchanged.

## Warnings

If something needs your attention, a coloured warning appears under the Convert button. Open the browser console (F12 → Console) for details. Possible warnings:

- missing required parameters (weapons, nObjects, sObjects, textures)
- too many weapons/wObjects (max 40), nObjects (max 24) or sObjects (max 14)
- too many textures, or sprite frames outside the spritesheet
- negative damage values (set to 0)
- extended WebLiero properties, for example `teamImmunity`, or `noRope = true` when constants conversion is on. These have no LieroLibre equivalent and are skipped.
- constants, hacks or colorAnim that couldn't be converted (header defaults are kept)

## Files

- `index.html`: simple script used to display the "layout" of the program (name, buttons etc.)
- `script.js`: the conversion logic (Constant conversion formulas are listed in `CONSTANT_RULES` near the top)
- `json5.min.js`: the JSON5 parser
- `header.txt`: plain text file containing "core" data of any lierolibre mod (first 2880 lines)
- `README.md`: the file you're reading right now xD

***roo***
