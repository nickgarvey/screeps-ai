"use strict";

const tower = {
    /** @param {Room} room */
    towerSites: function(room) {
        // find all towers and queued towers
        // room.find
        // if towers < 2
        // find all objects of interest
        // try 10 times
        // pick a random point
        // verify it is not near one of the points of interest
        // select and return locations
    },

    numTowers: function(room) {
        return _.size(
            room.find(
                FIND_MY_STRUCTURES,
                {filter: s => s.structureType === STRUCTURE_TOWER}));
    },
};

module.exports = tower;