module.exports = {
    structuresLessThanFull: function(creep) {
        // TODO memoize
        const structures = creep.room.find(FIND_STRUCTURES);
        return _
            .chain(structures)
            .filter(structure => 
                    (structure.structureType == STRUCTURE_EXTENSION
                        || structure.structureType == STRUCTURE_SPAWN)
                    && structure.energy < structure.energyCapacity)
            .value();
    }
};