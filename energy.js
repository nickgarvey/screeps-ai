module.exports = {
    structuresLessThanFull: function(room) {
        // TODO memoize
        const structures = room.find(FIND_STRUCTURES);
        return _
            .chain(structures)
            .filter(structure =>
                    (structure.structureType == STRUCTURE_EXTENSION
                        || structure.structureType == STRUCTURE_SPAWN)
                    && structure.energy < structure.energyCapacity)
            .value();
    },

    current: function(room) {
        const structures = room.find(FIND_MY_STRUCTURES);
        return _
            .chain(structures)
            .map(structure => _.get(structure, 'energy', 0))
            .sum();
    },

    totalCapacity: function(room) {
        const structures = room.find(FIND_MY_STRUCTURES);
        return _
            .chain(structures)
            .map(structure => _.get(structure, 'energyCapacity', 0))
            .sum();
    }
};
