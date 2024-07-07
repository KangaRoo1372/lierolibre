document.getElementById('convertButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0 || headerInput.files.length === 0) {
        alert('Please select both files.');
        return;
    }

    const file = fileInput.files[0];
    const headerFile = headerInput.files[0];

    if (!file.name.endsWith('.lwp')) {
        alert('Please select a valid .lwp file.');
        return;
    }

    const headerReader = new FileReader();
    headerReader.onload = function(e) {
        const headerContent = e.target.result;

        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            const lines = contents.split('\n').map(line => line.trim());

        // Validate OVERWRITE:1
        if (!lines.some(line => line === 'OVERWRITE:1')) {
            alert('The file is not suitable for conversion.');
            return;
        }

            // Create initial content for .cfg file
            let cfgContent = headerContent + '\n';
            cfgContent += 'Weapons :\n{\n  weapOrder :\n  {\n';

        // Define parameter conversion maps
        const WparamMap = {
            NAME: 'name',
            ACCADD: 'addSpeed',
            WORMAFFECT: 'affectByWorm',
            AMMO: 'ammo',
            BLOOD: 'bloodOnHit',
            BLOW: 'blowAway',
            BULLETCOLOR: 'colorBullets',
            SHOTDELAY: 'delay',
            WORMREMOVE: 'wormCollide',
            OBJECTCOLLIDE: 'collideWithObjects',
            DISTRIBUTION: 'distribution',
            RELOADSOUND: 'playReloadSound',
            EXPLODEAFFECT: 'affectByExplosions',
            WORMDETECTRANGE: 'detectDistance',
            GROUNDEXPLODE: 'explGround',
            WORMEXPLODE: 'wormExplode',
            SOUNDEXPLODE: 'exploSound',
            FIRECONE: 'fireCone',
            GRAVITY: 'gravity',
            HITDAMAGE: 'hitDamage',
            CREATEONHIT: 'createOnExp',
            MAPCHANGE: 'dirtEffect',
            PTRAILDELAY: 'partTrailDelay',
            PTRAILPTYPE: 'partTrailObj',
            PTRAILTYPE: 'partTrailType',
            LASERSIGHT: 'laserSight',
            SOUNDLAUNCH: 'launchSound',
            LEAVESHELLS: 'leaveShells',
            SHELLDELAY: 'leaveShellDelay',
            LOADINGTIME: 'loadingTime',
            ANIMLOOP: 'loopAnim',
            SOUNDLOOP: 'loopSound',
            ANIMFRAMES: 'numFrames',
            NUMOBJECTS: 'parts',
            RECOIL: 'recoil',
            SHOTTYPE: 'shotType',
            OTRAILDELAY: 'objTrailDelay',
            OTRAILTYPE: 'objTrailType',
            SPEED: 'speed',
            ACCMULTIPLY: 'multSpeed',
            BOUNCE: 'bounce',
            SPLINTERAMOUNT: 'splinterAmount',
            SPLINTERCOLOR: 'splinterColour',
            SPLINTERSTYPE: 'splinterScatter',
            SPLINTERTYPE: 'splinterType',
            ANIMSFRAME: 'startFrame',
            TIMETOEXPLODE: 'timeToExplo',
            TIMETOEXPLODEV: 'timeToExploV',
            SHADOW: 'shadow'
        };

        const NparamMap = {
            BLOOD: 'bloodOnHit',
            BLOW: 'blowAway',
            BULLETCOLOR: 'colorBullets',
            GROUNDREMOVE: 'explGround',
            DISTRIBUTION: 'distribution',
            EXPLODEAFFECT: 'affectByExplosions',
            WORMDETECTRANGE: 'detectDistance',
            WORMREMOVE: 'wormDestroy',
            WORMEXPLODE: 'wormExplode',
            GRAVITY: 'gravity',
            HITDAMAGE: 'hitDamage',
            CREATEONHIT: 'createOnExp',
            MAPCHANGE: 'dirtEffect',
            ANIMFRAMES: 'numFrames',
            OTRAILDELAY: 'leaveObjDelay',
            OTRAILTYPE: 'leaveObj',
            SPEED: 'speed',
            SPEEDV: 'speedV',
            BOUNCE: 'bounce',
            SPLINTERAMOUNT: 'splinterAmount',
            SPLINTERCOLOR: 'splinterColour',
            SPLINTERTYPE: 'splinterType',
            ANIMSFRAME: 'startFrame',
            TIMETOEXPLODE: 'timeToExplo',
            TIMETOEXPLODEV: 'timeToExploV',
            DRAWOBJECT: 'drawOnMap',
            BTRAILDELAY: 'bloodTrailDelay',
            BTRAIL: 'bloodTrail'
        };

        const SparamMap = {
            BLOW: 'blowAway',
            WORMDETECTRANGE: 'detectRange',
            HITDAMAGE: 'damage',
            MAPCHANGE: 'dirtEffect',
            ANIMFRAMES: 'numFrames',
            ANIMSFRAME: 'startFrame',
            FIRSTSOUND: 'startSound',
            NUMOFSOUNDS: 'numSounds',
            ANIMDELAY: 'animDelay',
            EARTHQUAKE: 'shake',
            FLASH: 'flash',
            SHADOW: 'shadow'
        };

        const booleanParams = [
            'WORMAFFECT', 'WORMREMOVE', 'GROUNDEXPLODE', 'OBJECTCOLLIDE', 'EXPLODEAFFECT', 
            'WORMEXPLODE', 'LASERSIGHT', 'ANIMLOOP','SHADOW', 'RELOADSOUND','GROUNDREMOVE',                  'DRAWOBJECT', 'BTRAIL'
        ];

        const calculateParams = [
            'MAPCHANGE', 'FIRSTSOUND', 'SPLINTERTYPE', 'OTRAILTYPE', 'CREATEONHIT', 'SOUNDLAUNCH',
            'SOUNDEXPLODE', 'OTRAILTYPE', 'PTRAILPTYPE'
        ];

        // Parse and convert the data
        const groups = { weapons: [], sobjectTypes: [], nobjectTypes: [] };
        let currentGroup = null;
        let groupType = '';

        lines.forEach(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            if (!key || !value) return;

            if (key === 'WEAPON') {
                if (currentGroup) groups[groupType].push(currentGroup);
                currentGroup = { WEAPON: value, params: {} };
                groupType = 'weapons';
            } else if (key === 'SOBJECT') {
                if (currentGroup) groups[groupType].push(currentGroup);
                currentGroup = { SOBJECT: value, params: {} };
                groupType = 'sobjectTypes';
            } else if (key === 'OBJECT') {
                if (currentGroup) groups[groupType].push(currentGroup);
                currentGroup = { OBJECT: value, params: {} };
                groupType = 'nobjectTypes';
            } else if (currentGroup) {
                currentGroup.params[key] = value;
            }
        });
        if (currentGroup) groups[groupType].push(currentGroup);

        // Add weapOrder entries
        groups.weapons.forEach(weapon => {
            cfgContent += `    weapOrder${weapon.WEAPON} = ${weapon.params.ORDER - 1};\n`;
        });
        cfgContent += '  };\n';

        // Add weapon groups
        cfgContent += '  weapons :\n  {\n';
        groups.weapons.forEach(weapon => {
            cfgContent += `      weapons${weapon.WEAPON - 1} : \n      {\n`;

	// Add missing parameters
                if (!weapon.params['SHELLDELAY']) {
                    let convertedParam = WparamMap['SHELLDELAY'];
                    let convertedValue = weapon.params['SHELLDELAY'];
                    cfgContent += `        ${convertedParam} = 0;\n`;
                }

                if (!weapon.params['RELOADSOUND']) {
                    let convertedParam = WparamMap['RELOADSOUND'];
                    let convertedValue = weapon.params['RELOADSOUND'];
                    cfgContent += `        ${convertedParam} = false;\n`;
                }

            for (const param in weapon.params) {
                let convertedParam = WparamMap[param];
                let convertedValue = weapon.params[param];

                // Convert boolean values
                if (booleanParams.includes(param)) {
                    convertedValue = convertedValue === '1' ? 'true' : 'false';
                }

	// Convert some predefined values
	if (calculateParams.includes(param)) {
	convertedValue = convertedValue - 1;
	}

                if (convertedParam) {
                    if (convertedParam === 'name') {
                        cfgContent += `        ${convertedParam} = "${convertedValue}";\n`;
                    } else {
                        cfgContent += `        ${convertedParam} = ${convertedValue};\n`;
                    }
                }
            }
            cfgContent += '      };\n';
        });
        cfgContent += '    };\n';

        // Check if there is an SOBJECT section
        const hasSobject = lines.some(line => line.startsWith('SOBJECT'));

        // Add sobjectTypes groups
        cfgContent += '  sobjectTypes :\n  {\n';
        if (hasSobject) {
            groups.sobjectTypes.forEach(sobject => {            
	let sobjectIndex = parseInt(sobject.SOBJECT);
	if (lieroM8Plugin.checked) {
	cfgContent += `      sobjectTypes${sobjectIndex} : \n      {\n`;
    	} else {
	cfgContent += `      sobjectTypes${sobjectIndex - 1} :\n      {\n`;
	}
                for (const param in sobject.params) {
                    let convertedParam = SparamMap[param];
                    let convertedValue = sobject.params[param];

                    // Convert boolean values
                    if (booleanParams.includes(param)) {
                        convertedValue = convertedValue === '1' ? 'true' : 'false';
                    }

                    // Convert some predefined values
                    if (calculateParams.includes(param)) {
                        convertedValue = convertedValue - 1;
                    }

                    if (convertedParam) {
                        cfgContent += `        ${convertedParam} = ${convertedValue};\n`;
                    }
                }
                cfgContent += '      };\n';
            });
        } else {
            cfgContent += '      sobjectTypes0 : \n      {\n      startSound = 9;\n      numSounds = 4;\n      animDelay = 2;\n      startFrame = 40;\n      numFrames = 15;\n      detectRange = 20;\n      damage = 15;\n      blowAway = 3000;\n      shadow = true;\n      shake = 4;\n      flash = 8;\n      dirtEffect = 0;\n      };\n      sobjectTypes1 : \n      {\n      startSound = 9;\n      numSounds = 4;\n      animDelay = 2;\n      startFrame = 45;\n      numFrames = 10;\n      detectRange = 14;\n      damage = 10;\n      blowAway = 3000;\n      shadow = true;\n      shake = 2;\n      flash = 4;\n      dirtEffect = 1;\n      };\n      sobjectTypes2 : \n      {\n      startSound = 7;\n      numSounds = 2;\n      animDelay = 2;\n      startFrame = 50;\n      numFrames = 5;\n      detectRange = 8;\n      damage = 5;\n      blowAway = 3000;\n      shadow = true;\n      shake = 1;\n      flash = 0;\n      dirtEffect = 2;\n      };\n      sobjectTypes3 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 4;\n      startFrame = 64;\n      numFrames = 4;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 0;\n      shadow = false;\n      shake = 0;\n      flash = 0;\n      dirtEffect = -1;\n      };\n      sobjectTypes4 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 4;\n      startFrame = 100;\n      numFrames = 3;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 0;\n      shadow = true;\n      shake = 0;\n      flash = 0;\n      dirtEffect = 5;\n      };\n      sobjectTypes5 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 2;\n      startFrame = 104;\n      numFrames = 3;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 0;\n      shadow = false;\n      shake = 0;\n      flash = 0;\n      dirtEffect = -1;\n      };\n      sobjectTypes6 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 2;\n      startFrame = 76;\n      numFrames = 2;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 0;\n      shadow = true;\n      shake = 0;\n      flash = 0;\n      dirtEffect = -1;\n      };\n      sobjectTypes7 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 2;\n      startFrame = 91;\n      numFrames = 4;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 0;\n      shadow = true;\n      shake = 0;\n      flash = 0;\n      dirtEffect = -1;\n      };\n      sobjectTypes8 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 2;\n      startFrame = 49;\n      numFrames = 6;\n      detectRange = 8;\n      damage = 7;\n      blowAway = 0;\n      shadow = true;\n      shake = 0;\n      flash = 0;\n      dirtEffect = 2;\n      };\n      sobjectTypes9 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 2;\n      startFrame = 53;\n      numFrames = 2;\n      detectRange = 6;\n      damage = 0;\n      blowAway = 0;\n      shadow = true;\n      shake = 0;\n      flash = 0;\n      dirtEffect = 5;\n      };\n      sobjectTypes10 : \n      {\n      startSound = 9;\n      numSounds = 4;\n      animDelay = 2;\n      startFrame = 47;\n      numFrames = 8;\n      detectRange = 10;\n      damage = 8;\n      blowAway = 3000;\n      shadow = true;\n      shake = 2;\n      flash = 3;\n      dirtEffect = 8;\n      };\n      sobjectTypes11 : \n      {\n      startSound = 9;\n      numSounds = 4;\n      animDelay = 2;\n      startFrame = 42;\n      numFrames = 13;\n      detectRange = 15;\n      damage = 13;\n      blowAway = 3000;\n      shadow = true;\n      shake = 3;\n      flash = 6;\n      dirtEffect = 1;\n      };\n      sobjectTypes12 : \n      {\n      startSound = 9;\n      numSounds = 4;\n      animDelay = 2;\n      startFrame = 44;\n      numFrames = 11;\n      detectRange = 14;\n      damage = 12;\n      blowAway = 3000;\n      shadow = true;\n      shake = 3;\n      flash = 5;\n      dirtEffect = 1;\n      };\n      sobjectTypes13 : \n      {\n      startSound = -1;\n      numSounds = 0;\n      animDelay = 0;\n      startFrame = 0;\n      numFrames = 0;\n      detectRange = 0;\n      damage = 0;\n      blowAway = 65793;\n      shadow = false;\n      shake = 0;\n      flash = 0;\n      dirtEffect = -1;\n      };\n';
        }
        cfgContent += '    };\n';

// Add nobjectTypes groups
cfgContent += '  nobjectTypes :\n  {\n';
groups.nobjectTypes.forEach((nobject) => {
    let objectIndex = parseInt(nobject.OBJECT);
    if (lieroM8Plugin.checked) {
        cfgContent += `      nobjectTypes${objectIndex} : \n      {\n`;
    } else {
        cfgContent += `      nobjectTypes${objectIndex - 1} : \n      {\n`;
    }
	// Add missing parameter
                if (!nobject.params['EXPLODEAFFECT']) {
                    let convertedParam = NparamMap['EXPLODEAFFECT'];
                    let convertedValue = nobject.params['EXPLODEAFFECT'];
                    cfgContent += `        ${convertedParam} = false;\n`;
                }

    for (const param in nobject.params) {
        let convertedParam = NparamMap[param];
        let convertedValue = nobject.params[param];

        // Convert boolean values
        if (booleanParams.includes(param)) {
            convertedValue = convertedValue === '1' ? 'true' : 'false';
        }

         // Convert some predefined values
         if (calculateParams.includes(param)) {
             convertedValue = convertedValue - 1;
        }

        if (convertedParam) {
            cfgContent += `        ${convertedParam} = ${convertedValue};\n`;
        }
    }
    cfgContent += '      };\n';
});

cfgContent += '    };\n  };\n';

            // Add other fixed data
            cfgContent += Array(1).fill('Textures :\n{\ntextures0 :\n{\nnDrawBack = true;\nmFrame = 0;\nsFrame = 73;\nrFrame = 2;\n};\ntextures1 :\n{\nnDrawBack = true;\nmFrame = 1;\nsFrame = 73;\nrFrame = 2;\n};\ntextures2 :\n{\nnDrawBack = true;\nmFrame = 2;\nsFrame = 73;\nrFrame = 2;\n};\ntextures3 :\n{\nnDrawBack = true;\nmFrame = 37;\nsFrame = 73;\nrFrame = 2;\n};\ntextures4 :\n{\nnDrawBack = false;\nmFrame = 0;\nsFrame = 87;\nrFrame = 2;\n};\ntextures5 :\n{\nnDrawBack = true;\nmFrame = 39;\nsFrame = 73;\nrFrame = 2;\n};\ntextures6 :\n{\nnDrawBack = false;\nmFrame = 38;\nsFrame = 82;\nrFrame = 2;\n};\ntextures7 :\n{\nnDrawBack = true;\nmFrame = 99;\nsFrame = 73;\nrFrame = 2;\n};\ntextures8 :\n{\nnDrawBack = true;\nmFrame = 37;\nsFrame = 73;\nrFrame = 2;\n};\n};\nOthers :\n{\nbonusRandTimer = ( [ 3000, 2000 ], [ 2000, 2000 ] );\naiParams = ( [ 120, 120, 50, 50, 80, 300, 400 ], [ 20, 20, 20, 20, 80, 60, 1 ] );\nbonusSObjects = [ 0, 4 ];\n};').join('\n');

            // Create and download the converted .cfg file
            const blob = new Blob([cfgContent], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'liero.cfg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        reader.readAsText(file);
    };
    headerReader.readAsText(headerFile);
});