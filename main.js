const Creep_ = require('creep');
const Extension_ = require('extension');
const Spawn_ = require('spawn');

function garbageCollect() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

function buildConstructionSites() {
    if (Game.time % 20 === 0) {
       _.forEach(Game.rooms, Extension_.buildSiteIfNeeded);
    }
}

module.exports.loop = function() {
    console.log('START ticks available:', Game.cpu.tickLimit, Game.cpu.bucket);

    buildConstructionSites();
    Spawn_.doSpawn();
    _.forEach(Game.creeps, Creep_.run);

    garbageCollect();

    console.log('END   ticks used:', Math.ceil(Game.cpu.getUsed()));
}