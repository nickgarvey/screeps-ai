const Creep = require('creep');
const Extension = require('extension');

const CREEP_CAP = 11;
const MAX_UPGRADERS = CREEP_CAP;
const UPGRADE_TICK_THRESHOLD = 1000;
const UPGRADE_ENERGY_RATIO = (250 / 300);

function cleanUpOldCreeps() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

function doSpawn() {
    _.forEach(Game.spawns, (spawn) => {
        if (_.size(Game.creeps) < CREEP_CAP) {
            const name = spawn.createCreep([WORK, CARRY, MOVE]);
            console.log('spawning', name);
        }

        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.name,
                spawn.pos.x + 1,
                spawn.pos.y, {
                    align: 'left',
                    opacity: 0.8
                });
        }
    });
}

function killExcessCreeps() {
    const totalOver = _.size(Game.creeps) - CREEP_CAP;
    if (totalOver <= 0) {
        return;
    }

    _.chain(Game.creeps)
        .sortBy((creep) => _.sum(creep.carry))
        .slice(0, totalOver)
        .value()
        .forEach((c) => {
            console.log('killing', c);
            c.suicide();
        });
}

function buildConstructionSites() {
    if (Game.time % 20 === 0) {
       _.forEach(Game.rooms, Extension.buildSiteIfNeeded);
    }
}

module.exports.loop = function() {
    console.log('ticks available:', Game.cpu.tickLimit);
    cleanUpOldCreeps();
    buildConstructionSites();
    // killExcessCreeps();
    doSpawn();
    _.forEach(Game.creeps, Creep.run);
}