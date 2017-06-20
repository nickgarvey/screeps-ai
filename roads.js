/**
 *  @param {Array<RoomPosition>} positions
  */
function findGroupedObjects(positions) {
    let toSearch = new Set(positions);
    let groups = [];

    while (toSearch.size !== 0) {
        const startPos = toSearch.values().next().value;
        let horizon = new Set([startPos]);
        let curGroup = [];

        while (horizon.size !== 0) {
            if (Game.cpu.getUsed() > 25) return;
            let newHorizon = new Set();
            for (const pos of horizon.values()) {
                toSearch.delete(pos);
                curGroup.push(pos);
                for (const nextPos of toSearch.values()) {
                    pos.isNearTo(nextPos);
                    if (pos.isNearTo(nextPos)) {
                        newHorizon.add(nextPos);
                    }
                }
            }
            horizon = newHorizon;
        }
        groups.push(curGroup);
    }

    return groups;
}

/**
 *  @param {Array<RoomPosition>} positions
 *  Must be in same room
 */
function centerFinder(positions) {
    if (_.isEmpty(positions)) {
        return null;
    }
    const averageX = _.sum(positions, p => p.x) / _.size(positions);
    const averageY = _.sum(positions, p => p.y) / _.size(positions);
    return _.min(positions, p => Math.sqrt(Math.pow(p.x - averageX, 2) + Math.pow(p.y - averageY, 2)));
}

roads = {
    /**
      * @type {function}
      * @param {Room} room
      * @return {Array}
      */
    roadSites: function(room) {
        const structures = room.find(FIND_MY_STRUCTURES);
        const sources = room.find(FIND_SOURCES);
        const positions = _.map(sources.concat(structures), o => o.pos);
        // list of positions grouped together
        const groups = findGroupedObjects(positions);

        if (_.isEmpty(groups)) {
            return;
        }

        let paths = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const center = centerFinder(group);
            for (let j = i + 1; j < groups.length; j++) {
                const options = {ignoreCreeps: true, ignoreRoads: true};
                const closest = center.findClosestByPath(groups[j], options);
                paths.push(center.findPathTo(closest, options));
            }
        }
        return paths;
    },

    findGroupedObjects: findGroupedObjects,
};

module.exports = roads;
