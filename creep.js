const Source_ = require('source');
const Energy_ = require('energy');

const UPGRADE_THRESHOLD = 2000;

function move(creep, destination) {
    const color = creep.memory.role ? {
        "builder": "#FF0000",
        "depositor": "#009900",
        "collector": "#AAAAFF",
        "upgrader": "#0F0F0F0",
    }[creep.memory.role] : "#000000";
    creep.moveTo(destination, {
        visualizePathStyle: {
            stroke: color,
        }
    });
}

function collect(creep) {
    const source = Source_.select(creep);
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        move(creep, source);
    }

    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.role = null;
    }
}

function deposit(creep) {
    const targets = Energy_.structuresLessThanFull(creep.room);
    const target = creep.pos.findClosestByRange(targets);
    if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
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

function upgrade(creep) {
    if (creep.upgradeController(creep.room.controller) ==
            ERR_NOT_IN_RANGE) {
        move(creep, creep.room.controller);
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

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

var roleGatherer = {
    run: function(creep) {
        if (!creep.memory.role) {
            if (creep.carry.energy < creep.carryCapacity) {
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
                creep.memory.role = null;
        }
    }
};

module.exports = roleGatherer;
