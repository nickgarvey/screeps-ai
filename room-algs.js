"use strict";

module.exports = {

    ROOM_WIDTH: 50,
    ROOM_HEIGHT: 50,

    /**
     * @callback gridInitFunc
     * @param {number} x
     * @param {number} y
     * @return number
     */

    /**
     * @param {gridInitFunc} gridFunc
     * @returns {Array<Array<number>>}
     */
    roomGrid: (gridFunc) => {
        let arr = new Array(module.exports.ROOM_HEIGHT);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = new Array(module.exports.ROOM_WIDTH);
            for (let j = 0; j < arr[i].length; j++) {
                arr[i][j] = gridFunc(i, j);
            }
        }
        return arr;
    },

    /**
     * @param {RoomPosition} position
     * @return boolean
     */
    isWalkable: (position) => {
        if (Game.map.getTerrainAt(position) === "wall") {
            return false;
        }
        return !_.any(position.lookFor(LOOK_STRUCTURES), module.exports.isObstacle);
    },

    /**
    * @return boolean
    */
    isObstacle: (obj) => {
        return _.contains(OBSTACLE_OBJECT_TYPES, obj.type);
    },

    /**
     * @callback costFunc
     * @param {RoomPosition}
     * @return number
     */

    /**
     * @callback searchFunc
     * @param {RoomPosition}
     * @return bool
     */

    /**
     *
     * @param {RoomPosition} startPos
     * @param {costFunc} costFunc
     * @returns {[RoomPosition, number]}
     */
    roomHillClimb: (startPos, costFunc) => {
        const room = Game.rooms[startPos.roomName];
        let horizon = [startPos];
        let seen = new Set(horizon);
        let minCost = Number.MAX_SAFE_INTEGER;
        let minFound = null;

        while (!_.isEmpty(horizon)) {
            const candidate = horizon.shift();
            seen.add(candidate);

            const cost = costFunc(candidate);
            if (cost >= minCost) {
                continue;
            }
            minCost = cost;
            minFound = candidate;

            const next = _.filter([
                room.getPositionAt(candidate.x + 1, candidate.y),
                room.getPositionAt(candidate.x - 1, candidate.y),
                room.getPositionAt(candidate.x, candidate.y + 1),
                room.getPositionAt(candidate.x, candidate.y - 1),
            ], p => p !== null && !seen.has(p));

            horizon = horizon.concat(next);
        }
        return [minFound, minCost];
    },

    /**
     *
     * @param {RoomPosition} startPos
     * @param {searchFunc} searchFunc
     * @returns {[RoomPosition, number]}
     */
    roomBfsSearch: (startPos, searchFunc) => {
        const room = Game.rooms[startPos.roomName];
        let horizon = [startPos];
        let seen = new Set(horizon);
        while (!_.isEmpty(horizon)) {
            const candidate = horizon.shift();
            seen.add(candidate);
            if (searchFunc(candidate)) {
                return candidate;
            }
            const next = _.filter([
                room.getPositionAt(candidate.x + 1, candidate.y),
                room.getPositionAt(candidate.x - 1, candidate.y),
                room.getPositionAt(candidate.x, candidate.y + 1),
                room.getPositionAt(candidate.x, candidate.y - 1),
            ], p => p !== null && !seen.has(p));

            horizon = horizon.concat(next);
        }
        return null;
    },

    /**
     * @param {Room} room
     * @param {Array<RoomPosition>} positions
     */
    findPosMiddle: (room, positions) => {
        return room.getPositionAt.apply(module.exports.pointAverage(positions));
    },

    /**
     *
     * @param {Array<RoomPosition>} positions
     * @returns {[number, number]}
     */
    pointAverage: (positions) => {
        if (_.isEmpty(positions)) {
            return [NaN, NaN];
        }
        return [
            Math.round(_.sum(positions, p => p.x) / _.size(positions)),
            Math.round(_.sum(positions, p => p.y) / _.size(positions))
        ];
    },

    /**
     *  @param {Array<RoomPosition>} positions
     *  Must be in same room
     */
    centerFinder: (positions) => {
        const [avgX, avgY] = module.exports.pointAverage(positions);
        if (_.isNaN(avgX) || _.isNaN(avgY)) {
            return null;
        }
        return _.min(
            positions,
            p => Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2))
        );
    },

    /**
     *  @param {Array<RoomPosition>} positions
     *  @return {Array<Array<RoomPosition>>}
     */
    findClusters: (positions) => {
        let toSearch = new Set(positions);
        let groups = [];

        while (toSearch.size !== 0) {
            const startPos = toSearch.values().next().value;
            let horizon = new Set([startPos]);
            let curGroup = [];

            while (horizon.size !== 0) {
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
};
