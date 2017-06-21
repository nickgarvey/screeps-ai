"use strict";

const Energy_ = require('energy');

// must be sorted by highest to lowest cost
const UNIT_OPTIONS = [
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    [WORK, WORK, CARRY, MOVE, MOVE],
    [WORK, CARRY, MOVE],
];

// must be sorted by highest to lowest cost
const UNIT_DEFENDER = [
    [TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK],
    [TOUGH, TOUGH, MOVE, MOVE, MOVE, ATTACK],
    [ATTACK, ATTACK, MOVE, MOVE],
    [TOUGH, ATTACK, MOVE, MOVE],
    [ATTACK, MOVE],
];

function configCost(unitConfig) {
    return _.reduce(unitConfig, (t, o) => t + BODYPART_COST[o], 0);
}

function bestCanBuild(units, energy) {
    return  _.find(units, c => configCost(c) <= energy);
}

/** @param {Room} room */
function needDefender(room) {
    if (_.isEmpty(room.find(FIND_HOSTILE_CREEPS))) {
        return false;
    }
    // just one defender for now
    return _.isEmpty(_.find(room.find(FIND_MY_CREEPS), c => c.getActiveBodyparts(ATTACK)));
}

const spawn_ = {
    CREEP_CAP: 15,

    doSpawn: function() {
        _.forEach(Game.spawns, (spawn) => {
            if (needDefender(spawn.room)) {
                const creepConfig = bestCanBuild(
                    UNIT_DEFENDER,
                    Energy_.current(spawn.room));
                if (creepConfig) {
                    const name = spawn.createCreep(creepConfig);
                    console.log('spawning defender', creepConfig, name);
                } else {
                    console.log('insufficient energy', Energy_.current(spawn.room));
                }
            }
            if (_.size(Game.creeps) < spawn_.CREEP_CAP) {
                const creepConfig = bestCanBuild(
                    UNIT_OPTIONS,
                    Energy_.totalCapacity(spawn.room));
                const name = spawn.createCreep(creepConfig);
                console.log('spawning', creepConfig, name);
            }

            if (spawn.spawning) {
                const spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    '🛠' + spawningCreep.name,
                    spawn.pos.x + 1,
                    spawn.pos.y, {
                        align: 'left',
                        opacity: 0.8
                    });
            }
        });
    }
}

module.exports = spawn_;
