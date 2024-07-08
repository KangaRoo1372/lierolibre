**Liero LWP to lierolibre CFG Converter by KangaRoo (current version: 0.92)**
---------------------------------------------------

0. [LICENCE](#0-licence)
1. [INTRODUCTION](#1-introduction)
2. [HOW TO USE IT](#2-how-to-use-it)
3. [LIMITATIONS](#3-limitations)
4. [CREDITS](#4-credits)
5. [CHANGELOG](#5-changelog)
6. [TODO](#6-todo)
7. [CONTACT](#7-contact)

## *0. LICENCE*

Liero LWP to lierolibre CFG Converter is a FREEWARE program, which means you are free to distribute it, but you can't do it for cash or other valuables. You are not allowed to modify or distribute it as your own program; you can use any extracted part of the code or even modify it on your own, but with appropriate notification (credits) about its origin.

The program was created with help of [ChatGPT](https://openai.com/blog/chatgpt), which generated circa 90% of the code.

## *1. INTRODUCTION*

Liero LWP to lierolibre CFG Converter is a simple program (written in HTML and JavaScript) which extracts all weapon entities (weapons, wObjects, nObjects and sObjects) from any Liero Weapon Plugin file (.lwp) and converts them into lierolibre config file. The program contains 4 files:

a) index.html (script used to display the "layout" of the program: name, buttons etc.)

b) script.js (main script of the program)

c) header.txt (plain text file containing "core" data of any lierolibre mod)

d) readme.md (this file you're reading right now xD)

**1.1 What are Liero and lierolibre?**

[Liero](http://liero.be/) is a classic freeware 1998 DOS game, a 2D arena top-down shooter in which you control a worm armed with 5 guns and a ninja rope.

[lierolibre](https://gitlab.com/lierolibre/lierolibre) is a direct fork (clone) of Liero 1.35b, created by Martin Erik Werner and released in 2012.

**1.1.1. What is Liero Weapon Plugin?**

Liero Weapon Plugin is a single text file (made in custom .lwp format) that can contain information on all Liero objects used in weapons, i.e. weapon objects, non-weapon objects and special objects. When activated (with a special program - see information below), the information in the .lwp file overwrites a part of the Liero.exe code of your choice (i.e. only one single object or even all objects).

**1.1.1. What is lierolibre CFG file?**

lierolibre CFG file is a plain text file containing all the game variables, including weapons, worms, materials, palette etc. By changing the content and data in this file, you can modify the game in any way you want. Some things are likely to not work though if you try to change them (and thus making the game refuse to start or crash), e.g. appending/deleting elements, changing integers to strings (or strings to integers etc.), changing sin/cos tables etc.

## *2. HOW TO USE IT*

To use the converter, you must:

- download all the files from this repository and put them in the same directory on your HDD
- right-mouse click the "index.html" file and open it with Internet browser (e.g. Chrome or Firefox)
- click the first "browse file" button and load the .lwp file from your HDD
- mark the "LieroM8 plugin" option if your selected LWP file is compatible with LieroM8 (see more explanations below)
- click the second "browse file" button (below the "LieroM8 plugin" option) and load the .txt "header" file from your HDD (which you can find in this directory)
- click the "Convert" button
- if the conversion is successful, the converted file will be saved on your HDD as "lierocfg.txt"
- if any parameters are missing or have undefined values, a warning message will be displayed below the "Convert" button; in that case, a list of missing properties will be printed in the console, so that you check and track it easily

There are two alternative ways to run your CFG file with lierolibre:

- replace the 'user\lierocfg.txt' file with your converted file (remember to make a back-up copy of the original file)
- put the converted file into a new separate folder with all other necessary data files (i.e. Liero.chr, Liero.dat, Liero.snd and Names.dat) and run it using lierolibre-cmd.bat file with a command _lierolibre.exe -f path\to\yourmod.txt_.

The "LieroM8 plugin" option must be marked only if the .lwp file is compatible with [LieroM8](https://liero.nl/download/286/lm8v192.zip), because such plugins have got different object / special object order values (starting from 0, not 1). Fortunately, most original LWP files were created using [LieroKit](https://liero.nl/download/295/lierokit16b2.zip) so in 99% cases you don't need to use this option.

## *3. LIMITATIONS*

- the "header.txt" file contains first 2880 lines of a default lierolibre CFG file; as it was written above, those are the "core" data of any lierolibre mod (which defines all necessary game variables, such as texts, fonts, key names, strings, constant properties etc.). You can modify the content of this file freely, but please note that some things are likely to not work if you try to change them (and thus making the game refuse to start or crash), e.g. appending/deleting elements, changing integers to strings (or strings to integers etc.), changing sin/cos tables etc.
- as it was stated before, LWP files contain information only regarding objects used in weapons, i.e. weapon objects, non-weapon objects and special objects. This means that even if you convert your LWP file into lierolibre CFG file, all other basic game parameters (like physics or gravity of the worm, bonuses and ninja rope) will remain unchanged. However, as it was stated above, those "basic game parameters" are the part of "header.txt" file, which can be edited
- this converter is used to implement LWP files (and therefore to replace only weapons and their dependencies) into lierolibre. In addition to Liero Weapon Plugins, there are also numerous "Total Conversions", in which, apart from weapons, other basic game parameters have also been changed (worm physics, bonuses, palette, sprites etc.). Therefore, if you would like to implement the entire "Total Conversion" to lierolibre (i.e. extract the game variables from a modded LIERO.EXE file), you need to run lierolibre-cmd.bat file instead, with a command _lierolibre.exe -f path\to\LIERO.EXE -d path\to\data -w yourmod.txt_ (note that the _-d part_ can be omitted if the data files are in the same directory as the LIERO.EXE file and named correctly)
- some properties in LWP files created with LieroKit are missing, i.e. SHELLDELAY and RELOADSOUND in WEAPON (wObject) array and EXPLODEAFFECT in OBJECT (nObject) array. For this reason, appropriate conversion factors & sanity checks have been included in the converter code (to prevent from potential errors while running converted file with lierolibre). However, those sanity checks include only those aforementioned 3 missing properties - which means that if any other parameters are missing or have undefined values, you will only see the warning message printed, but nothing else will be done (especially the missing properties will not be inserted automatically in the converted file and you will need to fix it manually)
- most LWP files created with LieroKit are missing whole special objects array. That's why a "dummy SOBJECT array" (including all 14 special objects) will be put in converted file in such case anyway to prevent from potential errors while running converted file with lierolibre)
- some "core data" of any lierolibre mod is also included inside the script.js file, i.e. Textures array, bonusRandTimer, bonusSObjects and aiParams. It is not recommended to modify that part of the code too because it might cause the game refuse to start or even crash

## *4. CREDITS*

As it was written before, the code of this program was created with help of ChatGPT (which generated circa 90% of the code), so big thanks for ChatGPT engineers and creators.

Big thanks also goes to:

- Joosa Riekkinen (for creating Liero, the best game ever)
- Martin Erik Werner (for creating lierolibre)
- Munakas (for giving me inspiration to make this converter)

## *5. CHANGELOG*

08.07.2024 - version 0.92
- add a warning message displayed when converted mod is missing any required parameters

07.07.2024 - version 0.91
- change the name & format of the converted file

02.07.2024 - version 0.9
- initial commit
- add "dummy special object array" if .lwp file is missing it
- add all 3 weapon & object properties missing in LieroKit .lwp file

## *6. TODO*

- add some sanity checks / console logs about errors (missing properties, wrong values etc.)
- add "dummy object array" implementation when .lwp file is missing it (similar to special object array)
- add option to modify the converted file in the print-preview window & make it impact the converted file when downloading
- handle "single weapon replacement" plugins (WEAPON:SELECTED)
- full code review & clean it up

## *7. CONTACT*

You can contact me for any suggestions, ideas or any bugs you may find.
I will try to improve the converter in the future, however I hope you'll like my program anyway :) Enjoy!

**_roo_**
