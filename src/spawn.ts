import {currentEnergy, totalEnergyCapacity} from "energy";

// must be sorted by highest to lowest cost
const UNIT_OPTIONS = [
//    [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
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

function configCost(unitConfig: Array<BodyPartConstant>) {
    return _.reduce(unitConfig, (t: number, o: BodyPartConstant) => t + BODYPART_COST[o], 0);
}

function bestCanBuild(
    units: Array<Array<BodyPartConstant>>,
    energy: number
): Array<BodyPartConstant> {
    return  _.find(units, c => configCost(c) <= energy);
}

function needDefender(room: Room) {
    if (room.name === "sim" || _.isEmpty(room.find(FIND_HOSTILE_CREEPS))) {
        return false;
    }
    // just one defender for now
    return _.isEmpty(_.find(room.find(FIND_MY_CREEPS), (c: Creep) => c.getActiveBodyparts(ATTACK)));
}

export const  CREEP_CAP = { 1: 5 };

export const CREEP_CAP_DEFAULT = 10;

export function doSpawn(spawn: Spawn) {
    const controller = spawn.room.controller;
    if (!controller) {
        return;
    }
    if (needDefender(spawn.room)) {
        const creepConfig = bestCanBuild(
            UNIT_DEFENDER,
            currentEnergy(spawn.room));
        if (creepConfig) {
            const name = spawn.createCreep(creepConfig);
            console.log('spawning defender', creepConfig, name);
        } else {
            console.log('insufficient energy', currentEnergy(spawn.room));
        }
    }
    const spawnCap = _.get(
        CREEP_CAP,
        controller.level,
        CREEP_CAP_DEFAULT);
    if (_.size(Game.creeps) < spawnCap) {
        const creepConfig = bestCanBuild(
            UNIT_OPTIONS,
            totalEnergyCapacity(spawn.room));
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
}
