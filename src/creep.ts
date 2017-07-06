import {structuresToFill} from "energy";
import {selectSource, sourceOccupied} from "source";

const UPGRADE_THRESHOLD = 2000;

const MOVE_STUCK_TICKS = 1;
const PATH_REUSE = 1;

interface RoleToColor {
    [index:string]: string,
}

// TODO roles as enums
const ROLE_TO_COLORS: RoleToColor = {
    builder: "#FFFF00",
    depositor: "#009900",
    collector: "#AAAAFF",
    upgrader: "#0F0F0F0",
    defender: "#FF0000",
};

function move(creep: Creep, destination: RoomPosition) {
    const color = creep.memory.role ? ROLE_TO_COLORS[creep.memory.role] : "#000000";

    // TODO pull into own file and avoid problem where it moves one step in
    // TODO the ignoreCreeps direction but then is instantly blocked again
    let ignoreCreeps = true;
    const posHistory = _.get(creep.memory, 'posHistory', []) as RoomPosition[];
    posHistory.push(creep.pos);
    if (posHistory.length > MOVE_STUCK_TICKS) {
        if (_.every(posHistory, p => creep.pos.isEqualTo(p.x, p.y))) {
            ignoreCreeps = false;
            console.log(creep.name, 'is stuck, repathing around creeps');
        }
        posHistory.shift();
    }
    creep.memory.posHistory = posHistory;

    return creep.moveTo(destination, {
        reusePath: PATH_REUSE,
        visualizePathStyle: {
            stroke: color,
        },
        ignoreCreeps: ignoreCreeps,
    });
}

/** @param {Creep} creep */
function collect(creep: Creep) {
    let source = null;
    let source_id = _.get(creep.memory, 'selection', null);
    if (source_id) {
        source = Game.getObjectById(source_id) as (Source | null);
    }
    if (source === null || sourceOccupied(source)) {
        source = selectSource(creep);
    }

    creep.memory.selection = source.id;
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        move(creep, source.pos);
    }

    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.role = null;
        creep.memory.selection = null;
    }
}

function deposit(creep: Creep) {
    const targets = structuresToFill(creep.room);
    const target = creep.pos.findClosestByRange(targets);
    if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            move(creep, target.pos);
        }
    } else {
        // nothing needs energy, so don't deposit
        creep.memory.role = null;
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

function needRepairs(creep: Creep) : boolean {
    return !!creep.room.find(FIND_STRUCTURES, {filter:  (s: Structure) => {
        if (s.structureType === STRUCTURE_TOWER) {
            return s.hits < s.hitsMax;
        } else {
            // TODO repair logic for roads ? or just let them rebuild?
            return false;
        }
    }}).length;
}

function repair(creep: Creep) {
    const structures = creep.room.find(FIND_STRUCTURES, {filter:  (s: Structure) => s.hits < s.hitsMax}) as Structure[];
    const towers = _.filter(structures, s => s.structureType === STRUCTURE_TOWER) as Tower[];
    const needingRepairs = towers.length ? towers : structures;
    if (needingRepairs.length) {
        const toRepair = creep.pos.findClosestByPath(needingRepairs);
        if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) {
            move(creep, toRepair.pos);
            return;
        }
    } else {
        creep.memory.role = null;
    }
    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

function upgrade(creep: Creep) {
    const controller = creep.room.controller;
    if (!controller) {
        creep.memory.role = null;
        return;
    }
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        move(creep, controller.pos);
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

function build(creep: Creep) {
    const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES) as ConstructionSite;
    if (!target) {
        creep.memory.role = null;
        return;
    }
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
        move(creep, target.pos);
    }
    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

function defend(creep: Creep) {
    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS) as Creep;
    if (_.isEmpty(target)) {
        // don't clear the role as the creep can't do anything anyway
        return;
    }

    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        move(creep, target.pos);
    }
}

function badSign(creep: Creep) {
    if (!creep.room.controller) {
        return;
    }
    const sign = creep.room.controller.sign;
    return sign && (sign.username !== creep.owner.username || sign.text !== SIGN_TEXT);
}

const SIGN_TEXT = "http://github.com/nickgarvey/screeps-ai";

function clearSign(creep: Creep) {
    if (!creep.room.controller) {
        return;
    }
    if (!badSign(creep)) {
        creep.memory.role = null;
        return;
    }
    switch (creep.signController(creep.room.controller, SIGN_TEXT)) {
        case OK:
        case ERR_BUSY:
        case ERR_INVALID_TARGET:
            creep.memory.role = null;
            return;
        case ERR_NOT_IN_RANGE:
            move(creep, creep.room.controller.pos);
            return;
    }
}

/** @param {Creep} creep */
function shouldDefend(creep: Creep) {
    if (creep.getActiveBodyparts(ATTACK) === 0) {
        return false;
    }
    return !_.isEmpty(creep.room.find(FIND_HOSTILE_CREEPS));
}

export function run(creep: Creep) {
    // TODO role type
    if (!creep.memory.role) {
        if (shouldDefend(creep)) {
            creep.memory.role = "defender";
        } else if (creep.carry.energy < creep.carryCapacity / 2) {
            creep.memory.role = "collector";
        } else if (creep.room.controller && creep.room.controller.ticksToDowngrade < UPGRADE_THRESHOLD) {
            creep.memory.role = "upgrader";
        } else if (needRepairs(creep)) {
            creep.memory.role = "repairer";
        } else if (structuresToFill(creep.room).length) {
            creep.memory.role = "depositor";
        } else if (badSign(creep)) {
            creep.memory.role = "clearer";
        } else if (!_.isEmpty(Game.constructionSites)) {
            creep.memory.role = "builder";
        } else {
            creep.memory.role = "upgrader";
        }
        creep.say(creep.memory.role);
        console.log("Reassigning:", creep.name, creep.memory.role);
    }
    switch (creep.memory.role) {
        case "defender":
            defend(creep);
            break;
        case "collector":
            collect(creep);
            break;
        case "depositor":
            deposit(creep);
            break;
        case "builder":
            build(creep);
            break;
        case "upgrader":
            upgrade(creep);
            break;
        case "clearer":
            clearSign(creep);
            break;
        case "repairer":
            repair(creep);
            break;
        default:
            console.log("invalid role", creep.memory.role);
            creep.memory.role = null;
    }
}
