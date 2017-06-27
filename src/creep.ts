import {structuresToFill} from "energy";
import {selectSource} from "source";

const UPGRADE_THRESHOLD = 2000;

interface RoleToColor {
    [index:string]: string,
}

const ROLE_TO_COLORS: RoleToColor = {
    builder: "#FFFF00",
    depositor: "#009900",
    collector: "#AAAAFF",
    upgrader: "#0F0F0F0",
    defender: "#FF0000",
};

function move(creep: Creep, destination: RoomPosition) {
    const color = creep.memory.role ? ROLE_TO_COLORS[creep.memory.role] : "#000000";
    return creep.moveTo(destination, {
        reusePath: 2,
        visualizePathStyle: {
            stroke: color,
        },
        ignoreCreeps: Math.random() > 0.5,
    });
}

/** @param {Creep} creep */
function collect(creep: Creep) {
    let source = null;
    let source_id = _.get(creep.memory, 'selection', null);
    if (source_id) {
        source = Game.getObjectById(source_id) as (Source | null);
    }
    if (source === null) {
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
    return sign.username !== creep.owner.username || sign.text !== SIGN_TEXT;
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
    if (!creep.memory.role) {
        if (shouldDefend(creep)) {
            creep.memory.role = "defender";
        } else if (creep.carry.energy < creep.carryCapacity / 2) {
            creep.memory.role = "collector";
        } else if (creep.room.controller && creep.room.controller.ticksToDowngrade < UPGRADE_THRESHOLD) {
            creep.memory.role = "upgrader";
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
        default:
            console.log("invalid role", creep.memory.role);
            creep.memory.role = null;
    }
}
