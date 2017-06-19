const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');

const CREEP_CAP = 10;
const MAX_UPGRADERS = CREEP_CAP;
const UPGRADE_TICK_THRESHOLD = 1000;
const UPGRADE_ENERGY_RATIO = (250 / 300);

function energyAvailable(room) {
    // todo handle multiple rooms
    return _.chain(Game.structures)
        .filter(s => s.room === room)
        .map((structure) => _.get(structure, 'energy', 0))
        .sum()
        .value();
}

function energyCapacity(room) {
    return _.chain(Game.structures)
        .filter(s => s.room === room)
        .map((structure) => _.get(structure, 'energyCapacity', 0))
        .sum()
        .value();
}

function shouldUpgrade(room) {
    if (energyAvailable(room) >= energyCapacity(room) * UPGRADE_ENERGY_RATIO) {
        return true;
    }
    return room.controller.ticksToDowngrade < UPGRADE_TICK_THRESHOLD;
}

function cleanUpOldCreeps() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

function pickJobs() {
    let numBuilders = 0;
    let numUpgraders = 0;

    _.forEach(Game.creeps, (creep) => {
        if (shouldUpgrade(creep.room) && numUpgraders < MAX_UPGRADERS) {
            numUpgraders++;
            creep.memory.role = "upgrader";
        } else {
            creep.memory.role = "harvester";
        }
    });
}

function doSpawn() {
    _.forEach(Game.spawns, (spawn) => {
        if (_.size(Game.creeps) < CREEP_CAP) {
            const name = spawn.createCreep([WORK, CARRY, MOVE], undefined, {
                role: 'harvester'
            });
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

function doJobs() {
    _.forEach(Game.creeps, (creep) => {
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }

    });
}

function killExcessCreeps() {
    // leave one extra
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

module.exports.loop = function() {
    console.log('ticks available:', Game.cpu.tickLimit);
    cleanUpOldCreeps();
    killExcessCreeps();
    doSpawn();
    pickJobs();
    doJobs();
}