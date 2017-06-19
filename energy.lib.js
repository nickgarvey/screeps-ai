module.exports = {
    // pick a place to deposit energy
    // null if nothing needs it
    energyDestination: function(creep) {
        const structures = creep.room.find(FIND_STRUCTURES);
        const closest = this.structuresLessThanFull(creep)
            .min(structure => PathFinder.search(creep.pos, structure.pos).cost);
        return closest !== Infinity ? closest : null;
    },

    structuresLessThanFull: function(creep) {
        // TODO memoize
        const structures = creep.room.find(FIND_STRUCTURES);
        return _
            .chain(structures)
            .filter(structure => 
                    (structure.structureType == STRUCTURE_EXTENSION
                        || structure.structureType == STRUCTURE_SPAWN)
                    && structure.energy < structure.energyCapacity);
    }
};