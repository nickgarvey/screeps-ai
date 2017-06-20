const Source_ = require('source');
const Energy_ = require('energy');

const UPGRADE_THRESHOLD = 2000;

/**
  * @param {Creep} creep
  * @param {RoomPosition} destination
*/
function move(creep, destination) {
    const color = creep.memory.role ? {
        "builder": "#FFFF00",
        "depositor": "#009900",
        "collector": "#AAAAFF",
        "upgrader": "#0F0F0F0",
        "defender": "#FF0000",
    }[creep.memory.role] : "#000000";
    creep.moveTo(destination, {
        visualizePathStyle: {
            stroke: color,
        }
    });
}

/** @param {Creep} creep */
function collect(creep) {
    const source = Source_.select(creep);
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        move(creep, source);
    }

    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.role = null;
    }
}

/** @param {Creep} creep */
function deposit(creep) {
    const targets = Energy_.structuresLessThanFull(creep.room);
    const target = creep.pos.findClosestByRange(targets);
    if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            move(creep, target);
        }
    } else {
        // nothing needs energy, so don't deposit
        creep.memory.role = null;
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

/** @param {Creep} creep */
function upgrade(creep) {
    if (creep.upgradeController(creep.room.controller) ===
            ERR_NOT_IN_RANGE) {
        move(creep, creep.room.controller.pos);
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

/** @param {Creep} creep */
function build(creep) {
    const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (!target) {
        creep.memory.role = null;
        return;
    }
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
        move(creep, target);
    }
    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

/** @param {Creep} creep */
function defend(creep) {
    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (_.isEmpty(target)) {
        // don't clear the role as the creep can't do anything anyway
        return;
    }

    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        move(creep, target);
    }
}

/** @param {Creep} creep */
function shouldDefend(creep) {
    if (creep.getActiveBodyparts(ATTACK) === 0) {
        return false;
    }
    return !_.isEmpty(creep.room.find(FIND_HOSTILE_CREEPS));
}

var roleGatherer = {
    /**
     * @function
     * @param {Creep} creep
     */
    run: function(creep) {
        if (!creep.memory.role) {
            if (shouldDefend(creep)) {
                creep.memory.role = "defender";
            } else if (creep.carry.energy < creep.carryCapacity / 2) {
                creep.memory.role = "collector";
            } else if (creep.room.controller.ticksToDowngrade < UPGRADE_THRESHOLD) {
                creep.memory.role = "upgrader";
            } else if (Energy_.structuresLessThanFull(creep.room).length) {
                creep.memory.role = "depositor";
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
            default:
                console.log("invalid role", creep.memory.role);
                creep.memory.role = null;
        }
    }
};

module.exports = roleGatherer;
