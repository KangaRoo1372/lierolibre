function parseJSON5(text) {
    return JSON5.parse(text);
}

function computeWeapOrder(weapons) {
    return [...weapons]
        .map((w, i) => ({ name: w.name, index: i }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((w, order) => ({ ...w, order }));
}

/* =======================
   CONSTANTS, HACKS & COLORANIM (optional, checkboxes)
======================= */

// lierolibre values must be integers
function toInt(v) {
    return Math.round(v);
}

// Conversion rules: [lierolibre name, webliero name, converter]
// Parameters not present in webliero are not listed here - header defaults are kept.
const CONSTANT_RULES = [
    ['NRInitialLength',        'nrInitialLength',        v => v * 16],
    ['NRAttachLength',         'nrAttachLength',         v => v * 16],
    ['MinBounceUp',            'minBounceUp',            v => v * 65536],
    ['MinBounceDown',          'minBounceDown',          v => v * 65536],
    ['MinBounceLeft',          'minBounceHoriz',         v => -v * 65536],  // left = negative value
    ['MinBounceRight',         'minBounceHoriz',         v => v * 65536],
    ['WormGravity',            'wormGravity',            v => v * 65536],
    ['WalkVelLeft',            'wormAcc',                v => v * 65536],
    ['MaxVelLeft',             'wormMaxVel',             v => -v * 65536],  // left = negative value
    ['WalkVelRight',           'wormAcc',                v => v * 65536],
    ['MaxVelRight',            'wormMaxVel',             v => v * 65536],
    ['JumpForce',              'jumpForce',              v => v * 65536],
    ['MaxAimVelLeft',          'maxAimVel',              v => v * 65536 / Math.PI * 64],
    ['AimAccLeft',             'aimAcc',                 v => v * 65536 / Math.PI * 64],
    ['MaxAimVelRight',         'maxAimVel',              v => -v * 65536 / Math.PI * 64], // right = negative value
    ['AimAccRight',            'aimAcc',                 v => v * 65536 / Math.PI * 64],
    ['NinjaropeGravity',       'ninjaropeGravity',       v => v * 65536],
    ['NRMinLength',            'nrMinLength',            v => v * 16],
    ['NRMaxLength',            'nrMaxLength',            v => v * 16],
    ['BonusGravity',           'bonusGravity',           v => v * 65536],
    ['WormFricMult',           'wormFricMult',           v => v * 100],
    ['AimFricMult',            'aimFric',                v => v * 100],
    ['NRThrowVelX',            'nrThrowVel',             v => Math.log2(v)],
    ['NRThrowVelY',            'nrThrowVel',             v => Math.log2(v)],
    ['NRForceShlX',            'nrForce',                v => nrForceShl(v)],
    ['NRForceDivX',            'nrForce',                v => nrForceDiv(v)],
    ['NRForceShlY',            'nrForce',                v => nrForceShl(v)],
    ['NRForceDivY',            'nrForce',                v => nrForceDiv(v)],
    ['BonusBounceMul',         'bonusBounce',            v => v * 100],
    ['BonusFlickerTime',       'bonusFlickerTime',       v => v],
    // Note: left side is mirrored - AimMaxLeft uses aimMinAngle, AimMinLeft uses aimMaxAngle
    ['AimMaxLeft',             'aimMinAngle',            v => v * 64 / Math.PI + 32],
    ['AimMinLeft',             'aimMaxAngle',            v => v * 64 / Math.PI + 32],
    // Right side mirrors the left one (128 units = full circle: 0/128 = down, 32 = left, 64 = up, 96 = right)
    ['AimMaxRight',            'aimMinAngle',            v => 96 - v * 64 / Math.PI],
    ['AimMinRight',            'aimMaxAngle',            v => 96 - v * 64 / Math.PI],
    ['NRPullVel',              'nrAdjustVel',            v => v * 16],
    ['NRColourBegin',          'nrColourBegin',          v => v],
    ['NRColourEnd',            'nrColourEnd',            v => v],
    ['BonusExplodeRisk',       'bonusExplodeRisk',       v => 100 / v],
    ['BonusHealthVar',         'bonusHealthVar',         v => v],
    ['BonusMinHealth',         'bonusMinHealth',         v => v],
    ['FirstBloodColour',       'firstBloodColour',       v => v],
    ['NumBloodColours',        'numBloodColours',        v => v],
    ['BObjGravity',            'bObjGravity',            v => v * 65536],
    ['SplinterLarpaVelDiv',    'splinterLarpaVelDiv',    v => v],
    ['SplinterCracklerVelDiv', 'splinterCracklerVelDiv', v => v],
    ['FallDamageRight',        'fallDamageHoriz',        v => v],
    ['FallDamageLeft',         'fallDamageHoriz',        v => v],
    ['FallDamageDown',         'fallDamageDown',         v => v],
    ['FallDamageUp',           'fallDamageUp',           v => v],
];

// NRForceShl = log2(48 x webliero value)
function nrForceShl(v) {
    return Math.round(Math.log2(48 * v));
}

// NRForceDiv = 2^NRForceShl / (16 x webliero value), at least 1
function nrForceDiv(v) {
    return Math.max(1, Math.round(Math.pow(2, nrForceShl(v)) / (16 * v)));
}

// Finds a "Name : { ... }" block in the text and returns its start/end (inside the braces)
function findBlock(text, name, from = 0) {
    const re = new RegExp('\\b' + name + '\\s*:\\s*\\{', 'g');
    re.lastIndex = from;
    const m = re.exec(text);
    if (!m) return null;
    const start = m.index + m[0].length;
    let depth = 1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
            depth--;
            if (depth === 0) return { start: start, end: i };
        }
    }
    return null;
}

// Replaces the value of "key = ...;" inside a piece of text
function setValue(blockText, key, value) {
    const re = new RegExp('(^|\\n)([ \\t]*' + key + '[ \\t]*=[ \\t]*)[^;\\r\\n]*;');
    if (!re.test(blockText)) return null;
    return blockText.replace(re, (all, nl, left) => nl + left + value + ';');
}

function applyConstants(header, constants, warn) {
    const constBlock = findBlock(header, 'Constants');
    if (!constBlock) {
        warn('Constants section not found in header file');
        return header;
    }

    // --- Values ---
    const valuesBlock = findBlock(header, 'Values', constBlock.start);
    if (valuesBlock && valuesBlock.end < constBlock.end) {
        let values = header.slice(valuesBlock.start, valuesBlock.end);
        CONSTANT_RULES.forEach(([lieroKey, webKey, convert]) => {
            const v = constants[webKey];
            if (typeof v !== 'number' || !isFinite(v)) {
                console.log(`constant "${webKey}" not found in webliero mod - default ${lieroKey} kept`);
                return;
            }
            const result = toInt(convert(v));
            if (!isFinite(result)) {
                warn(`constant "${webKey}" = ${v} cannot be converted to ${lieroKey} - default kept`);
                return;
            }
            const changed = setValue(values, lieroKey, result);
            if (changed === null) warn(`${lieroKey} not found in header file`);
            else values = changed;
        });
        header = header.slice(0, valuesBlock.start) + values + header.slice(valuesBlock.end);
    } else {
        warn('Constants -> Values section not found in header file');
    }

    // --- Hacks (HFallDamage <- hFallDamage etc.) ---
    const constBlock2 = findBlock(header, 'Constants');
    const hacksBlock = findBlock(header, 'Hacks', constBlock2.start);
    if (hacksBlock && hacksBlock.end < constBlock2.end) {
        let hacks = header.slice(hacksBlock.start, hacksBlock.end);
        const hackKeys = hacks.match(/\bH\w+(?=\s*=)/g) || [];
        hackKeys.forEach(lieroKey => {
            const webKey = 'h' + lieroKey.slice(1);
            if (typeof constants[webKey] === 'boolean') {
                hacks = setValue(hacks, lieroKey, constants[webKey]) || hacks;
            } else {
                console.log(`hack "${webKey}" not found in webliero mod - default ${lieroKey} kept`);
            }
        });
        header = header.slice(0, hacksBlock.start) + hacks + header.slice(hacksBlock.end);
    } else {
        warn('Constants -> Hacks section not found in header file');
    }

    return header;
}

function applyColorAnim(header, colorAnim, warn) {
    if (!Array.isArray(colorAnim)) {
        warn('colorAnim not found in webliero mod - default kept');
        return header;
    }
    if (colorAnim.length % 2 !== 0) {
        warn('colorAnim in webliero mod has odd number of values - last value skipped');
    }
    const block = findBlock(header, 'colorAnim');
    if (!block) {
        warn('colorAnim section not found in header file');
        return header;
    }
    // take indentation from the first line of the block (or use default)
    const old = header.slice(block.start, block.end);
    const indentMatch = old.match(/\n([ \t]*)colorAnim/);
    const indent = indentMatch ? indentMatch[1] : '    ';
    const closeIndent = (old.match(/\n([ \t]*)$/) || ['', '  '])[1];
    const nl = header.includes('\r\n') ? '\r\n' : '\n';

    let inner = '';
    for (let i = 0; i + 1 < colorAnim.length; i += 2) {
        const n = i / 2;
        inner += `${nl}${indent}colorAnim${n}from = ${toInt(colorAnim[i])};`;
        inner += `${nl}${indent}colorAnim${n}to = ${toInt(colorAnim[i + 1])};`;
    }
    inner += nl + closeIndent;
    return header.slice(0, block.start) + inner + header.slice(block.end);
}

downloadLink.style.display = "block";
document.getElementById('convertButton').addEventListener('click', function () {

    const fileInput = document.getElementById('fileInput');
    const headerInput = document.getElementById('headerInput');
    const warningProperties = document.getElementById("warning");
    const warningArray = document.getElementById("warningarray");
    const warningArrayNObjects = document.getElementById("warningarraynobjects");
    const warningArraySObjects = document.getElementById("warningarraysobjects");
    const warningExtended = document.getElementById("warningExt");
    const warningSpritesheet = document.getElementById("warningsprites");
    const warningTextures = document.getElementById("warningtextures");
    const warningNegativeValue = document.getElementById("warningnegative");
    
    warningProperties.style.display = "none";
    warningArray.style.display = "none";
    warningArrayNObjects.style.display = "none";
    warningArraySObjects.style.display = "none";
    warningExtended.style.display = "none";
    warningNegativeValue.style.display = "none";
    warningTextures.style.display = "none";
    warningSpritesheet.style.display = "none";

    if (!fileInput.files.length || !headerInput.files.length) {
        alert('Please select both files.');
        return;
    }

    const modFile = fileInput.files[0];
    const headerFile = headerInput.files[0];
    const headerReader = new FileReader();
    headerReader.onload = function (e) {

        const headerContent = e.target.result;
        const reader = new FileReader();
        reader.onload = function (e) {

            const mod = parseJSON5(e.target.result);

            // noRope does not exist in lierolibre - it is skipped, but warn if it is enabled
            if (document.getElementById('convertConstants').checked && mod.constants && mod.constants.noRope === true) {
                console.warn('extended property noRope: true detected in Constants (not supported in lierolibre)');
                warningExtended.style.display = "block";
            }

            const warningConstants = document.getElementById("warningconstants");
            warningConstants.style.display = "none";
            const warnConst = msg => {
                console.warn(msg);
                warningConstants.style.display = "block";
            };

            let header = headerContent;
            if (document.getElementById('convertConstants').checked) {
                header = applyConstants(header, mod.constants || {}, warnConst);
            }
            if (document.getElementById('convertColorAnim').checked) {
                header = applyColorAnim(header, mod.colorAnim, warnConst);
            }

            let cfgContent = header + '\n';
            cfgContent += 'Weapons :\n{\n  weapOrder :\n  {\n';

const REQUIRED_WEAPON_PARAMS = [
  'name',
  'ammo',
  'delay',
  'playReloadSound',
  'fireCone',
  'laserSight',
  'launchSound',
  'leaveShells',
  'leaveShellDelay',
  'loadingTime',
  'parts',
  'recoil'
];

const REQUIRED_WOBJECT_PARAMS = [
  'speed',
  'addSpeed',
  'bloodOnHit',
  'colorBullets',
  'wormCollide',
  'collideWithObjects',
  'distribution',
  'affectByExplosions',
  'detectDistance',
  'explGround',
  'wormExplode',
  'exploSound',
  'gravity',
  'hitDamage',
  'createOnExp',
  'dirtEffect',
  'partTrailDelay',
  'partTrailObj',
  'partTrailType',
  'numFrames',
  'shotType',
  'objTrailDelay',
  'objTrailType',
  'multSpeed',
  'bounce',
  'splinterAmount',
  'splinterColour',
  'splinterScatter',
  'splinterType',
  'startFrame',
  'timeToExplo',
  'timeToExploV'
];

const REQUIRED_NOBJECT_PARAMS = [
  'bloodOnHit',
  'blowAway',
  'colorBullets',
  'explGround',
  'distribution',
  'affectByExplosions',
  'detectDistance',
  'wormDestroy',
  'gravity',
  'hitDamage',
  'createOnExp',
  'dirtEffect',
  'numFrames',
  'leaveObjDelay',
  'leaveObj',
  'speed',
  'speedV',
  'bounce',
  'splinterAmount',
  'splinterColour',
  'startFrame',
  'timeToExplo',
  'timeToExploV',
  'drawOnMap',
  'bloodTrailDelay',
  'bloodTrail'
];

const REQUIRED_SOBJECT_PARAMS = [
  'blowAway',
  'detectRange',
  'damage',
  'dirtEffect',
  'numFrames',
  'startFrame',
  'startSound',
  'numSounds',
  'animDelay',
  'shake',
  'flash',
  'shadow'
];

const REQUIRED_TEXTURE_PARAMS = [
  'nDrawBack',
  'mFrame',
  'sFrame',
  'rFrame'
];

            /* =======================
               WEAPONS + WOBJECTS
            ======================= */

	if(mod.weapons.length > 40 || mod.wObjects.length > 40) {
		warningArray.style.display = "block";
		console.warn(`${mod.weapons.length} weapons and ${mod.wObjects.length} wObjects detected, the limit is 40 for every array`);
	}

            const mergedWeapons = mod.weapons.map((w, i) => {
                const wObj = mod.wObjects[w.bulletType] || {};
    	  const weaponClean = { ...w };
	  delete weaponClean.distribution;
	  delete weaponClean.$$hashKey;
	  delete weaponClean.id;
	  delete weaponClean.reloadSound;
	  if(w.reloadSound>-1) {
		console.warn("extended property reloadSound detected in weapon " +w.name);
		warningExtended.style.display = "block";
	  }
	  const wObjClean = { ...wObj };
	  delete wObjClean.name;
	  delete wObjClean.id;
	  delete wObjClean.fixed;
	  delete wObjClean.immutable;
	  delete wObjClean.behavior;
	  delete wObjClean.detonable;
	  delete wObjClean.platform;
	  delete wObjClean.platformWidth;
	  delete wObjClean.platformHeight;
	  delete wObjClean.platformVelocityAuto;
	  delete wObjClean.teamImmunity;
	  delete wObjClean.removeOnSObject;
	  delete wObjClean.removeonsobject;
	  delete wObjClean.beacon;
	  delete wObjClean.underlay;
	  delete wObjClean.overlay;
 	  delete wObjClean.$$hashKey;
	  // log every extended property found in any wObject
	  const EXTENDED_WOBJECT_PROPS = ['immutable', 'teamImmunity', 'fixed', 'platform', 'behavior', 'detonable', 'platformWidth', 'platformHeight', 'platformVelocityAuto', 'removeOnSObject', 'removeonsobject', 'beacon', 'underlay', 'overlay'];
	  EXTENDED_WOBJECT_PROPS.forEach(prop => {
		if (wObj[prop]) {
			console.warn(`extended property "${prop}" detected in wid${i} (${w.name})`);
			warningExtended.style.display = "block";
		}
	  });
                
	const merged = { ...wObjClean, ...weaponClean };

	if ('speed' in wObj) {
    	delete merged.speed;
	}

	if ('bulletSpeed' in w) {
    	merged.speed = w.bulletSpeed;
    	delete merged.bulletSpeed;
	}

                merged.affectByWorm = merged.bulletSpeedInherit > 0;
                delete merged.bulletSpeedInherit;

                // remove other unwanted parameters
                delete merged.repeat;
                delete merged.bounceFriction;
                delete merged.bulletType;
	  delete merged.laserBeam;

                // required extras
                merged.loopSound = 0;
                merged.shadow = false;

                return merged;
            });

let weaponWarnings = false;

mergedWeapons.forEach((weapon, index) => {
    REQUIRED_WEAPON_PARAMS.forEach(param => {
        if (!(param in weapon)) {
            console.warn(
                `Missing weapon param "${param}" in weapon ${index} (${weapon.name || 'no-name'})`
            );
            weaponWarnings = true;
        }
    });
});

mergedWeapons.forEach((wObject, index) => {
    REQUIRED_WOBJECT_PARAMS.forEach(param => {
        if (!(param in wObject)) {
            console.warn(
                `Missing wObject param "${param}" in wObject wid${index}`
            );
            weaponWarnings = true;
        }
    });
});

if (weaponWarnings) {
    warningProperties.style.display = "block";
}

            const orderTable = computeWeapOrder(mergedWeapons);

            orderTable.forEach(w => {
                cfgContent += `    weapOrder${w.order+1} = ${w.index};\n`;
            });

            cfgContent += '  };\n';
            cfgContent += '  weapons :\n  {\n';

            mergedWeapons.forEach((weapon, i) => {
                cfgContent += `      weapons${i} :\n      {\n`;

	for (const key in weapon) {
    	let value = weapon[key];

    	if (key === 'recoil') {
        	value = Math.floor(value * 100);
    	}

    	if (key === 'blowAway') {
        	value = Math.floor(value * 100);
    	}

    	if (key === 'gravity') {
        	value = Math.floor(value * 65536);
    	}

    	if (key === 'bounce') {
        	value = Math.floor(value * 100);
    	}

    	if (key === 'speed') {
        	value = Math.floor(value * 100);
    	}

    	if (key === 'multSpeed') {
        	value = Math.floor(value * 100);
    	}

    	if (key === 'distribution') {
        	value = Math.floor(value * 65536);
    	}

    	if (key === 'hitDamage') {
        	value = Math.ceil(value);
    	}

    	if (key === 'dirtEffect') {
        	if(value>8) console.warn("Textures array limit exceeded (dirtEffect) in weapon " + weapon.name);
    	}

    	if (key === 'createOnExp') {
        	if(value>14) console.warn("sObjects array limit exceeded (createOnExp) in weapon " + weapon.name);
    	}

    	if (key === 'objTrailType') {
        	if(value>14) console.warn("sObjects array limit exceeded (objTrailType) in weapon " + weapon.name);
    	}

    	if (key === 'splinterType') {
        	if(value>24) console.warn("nObjects array limit exceeded (splinterType) in weapon " + weapon.name);
    	}

    	if (key === 'partTrailObj') {
        	if(value>24) console.warn("nObjects array limit exceeded (partTrailObj) in weapon " + weapon.name);
    	}

    	if (key === 'startFrame') {
        	if(value>109) {
	if(value>239) {
		console.warn("spritesheet limit exceeded in weapon " + weapon.name);
		warningSpritesheet.style.display = "block";
	} value = value - 110;
	} else value = -1;
    	}

    	if (typeof value === 'string') {
        	cfgContent += `        ${key} = "${value}";\n`;
    	} else if (typeof value === 'boolean') {
        	cfgContent += `        ${key} = ${value};\n`;
    	} else {
        	cfgContent += `        ${key} = ${value};\n`;
    }
}

                cfgContent += '      };\n';
            });

            cfgContent += '    };\n';

            /* =======================
               SOBJECTS
            ======================= */

	if(mod.sObjects.length > 14) {
		warningArraySObjects.style.display = "block";
		console.warn(`${mod.sObjects.length} detected, the limit is 14`);
	}

            const mergedSObjects = mod.sObjects.map((s, i) => {
    	  const SObjectClean = { ...s };
	  delete SObjectClean.name;
	  delete SObjectClean.id;
	  delete SObjectClean.$$hashKey;
                const mergedS = { ...SObjectClean };
                return mergedS;
            });

            cfgContent += '  sobjectTypes :\n  {\n';
            mergedSObjects.forEach((obj, i) => {
                 cfgContent += `      sobjectTypes${i} :\n      {\n`;
	for (const k in obj) {
    	let value = obj[k];
    	if (k === 'blowAway') {
        	value = Math.floor(value * 65536);
    	}
    	if (k === 'dirtEffect') {
        	if(value>8) console.warn("Textures array limit exceeded (dirtEffect) in sObject sid" +i);
    	}
    	if (k === 'damage') {
        	if(value<0) { 
		value = 0;
		warningNegativeValue.style.display = "block";
		console.warn("negative damage detected in sObject sid" +i);
	}
	else value = Math.ceil(value);
    	}
    	if (k === 'startFrame') {
        	if(value>109) {
	console.warn("spritesheet limit exceeded in sObject sid" + i);
	warningSpritesheet.style.display = "block";
    	}
	}

    cfgContent += `        ${k} = ${value};\n`;
}

                cfgContent += '      };\n';
            });
            cfgContent += '    };\n';

let sObjectWarnings = false;

mergedSObjects.forEach((obj, index) => {
    REQUIRED_SOBJECT_PARAMS.forEach(param => {
        if (!(param in obj)) {
            console.warn(
                `Missing sObject param "${param}" in sid${index}`
            );
            sObjectWarnings = true;
        }
    });
});

if (sObjectWarnings) {
    warningProperties.style.display = "block";
}

            /* =======================
               NOBJECTS
            ======================= */

	if(mod.nObjects.length > 24) {
		warningArrayNObjects.style.display = "block";
		console.warn(`${mod.nObjects.length} detected, the limit is 24`);
	}

            const mergedObjects = mod.nObjects.map((n, i) => {
    	  const ObjectClean = { ...n };
	  delete ObjectClean.immutable;
	  delete ObjectClean.teamImmunity;
	  delete ObjectClean.name;
	  delete ObjectClean.id;
	  delete ObjectClean.$$hashKey;
	  // log extended property immutable & teamImmunity found in any nObject
	  const EXTENDED_NOBJECT_PROPS = ['immutable', 'teamImmunity'];
	  EXTENDED_NOBJECT_PROPS.forEach(propN => {
		if (n[propN]) {
			console.warn(`extended property "${propN}" detected in nid${i}`);
			warningExtended.style.display = "block";
		}
	  });
                const mergedN = { ...ObjectClean };
                return mergedN;
            });

            cfgContent += '  nobjectTypes :\n  {\n';
            mergedObjects.forEach((obj, i) => {
                cfgContent += `      nobjectTypes${i} :\n      {\n`;
	for (const k in obj) {
    	let value = obj[k];
    	if (k === 'speed') {
        	value = Math.floor(value * 100);
    	}
    	if (k === 'speedV') {
        	value = Math.floor(value * 100);
    	}
    	if (k === 'distribution') {
        	value = Math.floor(value * 65536);
    	}
    	if (k === 'bounce') {
        	value = Math.floor(value * 100);
    	}
    	if (k === 'gravity') {
        	value = Math.floor(value * 65536);
    	}
    	if (k === 'blowAway') {
        	value = Math.floor(value * 100);
    	}
    	if (k === 'dirtEffect') {
        	if(value>8) console.warn("Textures array limit exceeded (dirtEffect) in nObject nid" +i);
    	}
    	if (k === 'createOnExp') {
        	if(value>14) console.warn("sObjects array limit exceeded (createOnExp) in nObject nid" +i);
    	}
    	if (k === 'leaveObj') {
        	if(value>14) console.warn("sObjects array limit exceeded (leaveObj) in nObject nid" +i);
    	}
    	if (k === 'splinterType') {
        	if(value>24) console.warn("nObjects array limit exceeded (splinterType) in nObject nid" +i);
    	}
    	if (k === 'hitDamage') {
        	if(value<0) { 
		value = 0;
		warningNegativeValue.style.display = "block";
		console.warn("negative damage detected in nObject nid" +i);
	}
	else value = Math.ceil(value);
    	}
    	if (k === 'startFrame') {
        	if(value>109) {
	if(value>239) {
		console.warn("spritesheet limit exceeded in nObject nid" + i);
		warningSpritesheet.style.display = "block";
	} value = value - 110;
	} else value = 0;
    	}

    cfgContent += `        ${k} = ${value};\n`;
}

                cfgContent += '      };\n';
            });
            cfgContent += '    };\n';

            cfgContent += '};\n';

let nObjectWarnings = false;

mergedObjects.forEach((obj, index) => {
    REQUIRED_NOBJECT_PARAMS.forEach(param => {
        if (!(param in obj)) {
            console.warn(
                `Missing nObject param "${param}" in nid${index}`
            );
            nObjectWarnings = true;
        }
    });
});

if (nObjectWarnings) {
    warningProperties.style.display = "block";
}

            /* =======================
               TEXTURES
            ======================= */

	if(mod.textures.length > 9) {
		warningTextures.style.display = "block";
		console.warn(`${mod.textures.length} detected, the limit is 9`);
	}

            const mergedTextures = mod.textures.map((t, i) => {
    	  const textureClean = { ...t };
	  delete textureClean.name;
	  delete textureClean.id;
	  delete textureClean.$$hashKey;
                return textureClean;
            });

            cfgContent += 'Textures :\n{\n';
            mergedTextures.forEach((tex, i) => {
                cfgContent += `  textures${i} :\n  {\n`;
                for (const k in tex) {
                    cfgContent += `    ${k} = ${tex[k]};\n`;
                }
                cfgContent += '  };\n';
            });
            cfgContent += '};\n';

let textureWarnings = false;

mergedTextures.forEach((tex, index) => {
    REQUIRED_TEXTURE_PARAMS.forEach(param => {
        if (!(param in tex)) {
            console.warn(
                `Missing texture param "${param}" in textures${index}`
            );
            textureWarnings = true;
        }
    });
});

if (textureWarnings) {
    warningProperties.style.display = "block";
}

cfgContent += `
Others :
{
  bonusRandTimer = ( [ 3000, 2000 ], [ 2000, 2000 ] );
  aiParams = ( [ 120, 120, 50, 50, 80, 300, 400 ], [ 20, 20, 20, 20, 80, 60, 1 ] );
  bonusSObjects = [ 0, 4 ];
};
`;

            /* =======================
               DOWNLOAD
            ======================= */

	const blob = new Blob([cfgContent], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const downloadArea = document.getElementById('downloadArea');
	const downloadLink = document.getElementById('downloadLink');
	downloadLink.href = url;
	downloadLink.download = 'lierocfg.txt';
	downloadArea.style.display = 'block';
        };

        reader.readAsText(modFile);
    };

    headerReader.readAsText(headerFile);
});
