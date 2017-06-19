const Energy_ = require('energy');

// must be sorted by highest to lowest cost
UNIT_OPTIONS = [
    [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    [WORK, WORK, CARRY, MOVE, MOVE],
    [WORK, CARRY, MOVE],
];

function bestCanBuild(maxEnergy) {
    for (const option of UNIT_OPTIONS) {
        const cost = _.reduce(option, (t, o) => t + BODYPART_COST[o], 0);
        if (cost < maxEnergy) {
            return option;
        }
    }
    // if we hit this that means UNIT_OPTIONS doesn't have anything we can spawn
    // this should never happen
    console.log('not enough energy to spawn anything?');
    return null;
}

spawn = {
    CREEP_CAP: 11,

    doSpawn: function() {
        _.forEach(Game.spawns, (spawn) => {
            if (_.size(Game.creeps) < spawn.CREEP_CAP) {
                const creepConfig = bestCanBuild(Energy_.totalCapacity(spawn.room));
                const name = spawn.createCreep(creepConfig);
                console.log('spawning', name);
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

module.exports = spawn;