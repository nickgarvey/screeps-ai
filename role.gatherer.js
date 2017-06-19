const sourceLib = require('source.lib');
const energyLib = require('energy.lib');

function collect(creep) {
    const source = sourceLib.select(creep);
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
            visualizePathStyle: {
                stroke: '#ffaa00'
            }
        });
    }

    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.role = null;
    }
}

function deposit(creep) {
    const targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy < structure.energyCapacity;
        }
    });
    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], {
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            });
        }
    } else {
        // nothing needs energy, so don't deposit
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

function upgrade(creep) {
    if (creep.upgradeController(creep.room.controller) ==
            ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {
            visualizePathStyle: {
                stroke: '#ffffff'
            }
        });
    }

    if (creep.carry.energy === 0) {
        creep.memory.role = null;
    }
}

var roleGatherer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.role) {
            if (creep.carry.energy < creep.carryCapacity) {
                creep.memory.role = "collector";
            } else if (energyLib.structuresLessThanFull(creep)) {
                creep.memory.role = "depositor";
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
            case "upgrader":
                upgrade(creep);
                break;
            default:
                creep.memory.role = null;
                       
        }
    }
};

module.exports = roleGatherer;