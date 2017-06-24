"use strict";

module.exports = {
    select: function(creep) {
        const sources = creep.room.find(FIND_SOURCES);
        return _.max(sources, (source) => {
            return Math.random() * source.energy;
        });
    }
};
