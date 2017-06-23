"use strict";

const Extension_ = require('extension');
const RoomAlgs_ = require('room-algs');

const roads = {
    /**
      * @type {function}
      * @param {Room} room
      * @return {Array}
      */
    roadSites: function(room) {
        // TODO constant
        if (Extension_.extensions(room).length < 5) {
            return [];
        }

        // TODO connect sources to deposits, but not sources to sources

        const structures = room.find(FIND_MY_STRUCTURES);
        const sources = room.find(FIND_SOURCES);
        const importantPositions = _.map(sources.concat(structures), o => o.pos);
        // list of positions grouped together
        const groups = RoomAlgs_.findClusters(importantPositions);

        if (_.isEmpty(groups)) {
            return [];
        }

        let paths = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const center = RoomAlgs_.centerFinder(group);
            for (let j = i + 1; j < groups.length; j++) {
                // TODO favor existing roads slightly
                const options = {ignoreCreeps: true};
                const closest = center.findClosestByPath(groups[j], options);
                paths.push(center.findPathTo(closest, options));
            }
        }
        return _.flatten(paths)
            .map(p => room.getPositionAt(p.x, p.y))
            .filter(p => !_.any(importantPositions, impPos => impPos.isEqualTo(p)));
    },
};

module.exports = roads;
