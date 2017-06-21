"use strict";

const Creep_ = require('creep');
const Extension_ = require('extension');
const Spawn_ = require('spawn');
const Cpu_ = require('cpu');
const Roads_ = require('roads');

function garbageCollect() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    Cpu_.garbageCollect();
}

function buildConstructionSites() {
    if (Game.time % 20 === 5) {
        // TODO site selection then building
        _.forEach(Game.rooms, Extension_.buildSiteIfNeeded);
    } else if (Game.time % 30 === 0) {
        console.log('road building');
        for (const room of _.values(Game.rooms)) {
            const positions = Roads_.roadSites(room);
            positions.forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
        }
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
