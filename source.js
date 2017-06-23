"use strict";

const RoomAlgs_ = require('room-algs');

module.exports = {
    select: function(creep) {
        const sources = creep.room.find(FIND_SOURCES);
        return _.max(sources, (source) => {
            // if we are standing next to a source, then use it
            if (creep.pos.isNearTo(source.pos)) {
                return Number.MAX_SAFE_INTEGER;
            }
            if (source.energy === 0) {
                return 0;
            }

            const look = source.room.lookForAtArea(
                LOOK_STRUCTURES,
                source.pos.y - 1,
                source.pos.x - 1,
                source.pos.y + 1,
                source.pos.x + 1);

            // flatten the structure as it's tough to work with
            let objs = {};
            for (const x of Object.keys(look)) {
                for (const y of Object.keys(look[x])) {
                    // if there's a wall here then ignore it
                    if (Game.map.getTerrainAt(x, y, source.room.name) !== "wall") {
                        objs[x + ":" + y] = look[x][y];
                    }
                }
            }

            const distanceTo = creep.pos.getRangeTo(source.pos);
            const numFreeNodes = _.values(objs).filter(c => RoomAlgs_.isObstacle(c)).length;
            const energyAvailableFactor = Math.pow(source.energy / source.energyCapacity, 0.4) + 0.001;

            return energyAvailableFactor * numFreeNodes / distanceTo;
        });
    }
};
