const Creep_ = require('creep');
const Extension_ = require('extension');
const Spawn_ = require('spawn');

function cleanUpOldCreeps() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
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
       _.forEach(Game.rooms, Extension_.buildSiteIfNeeded);
    }
}

module.exports.loop = function() {
    console.log('START ticks available:', Game.cpu.tickLimit);
    cleanUpOldCreeps();
    buildConstructionSites();
    // killExcessCreeps();
    Spawn_.doSpawn();
    _.forEach(Game.creeps, Creep_.run);
    console.log('END   ticks used:', Math.ceil(Game.cpu.getUsed()));
}