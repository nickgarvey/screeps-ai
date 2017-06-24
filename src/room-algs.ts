export const ROOM_WIDTH = 50;
export const ROOM_HEIGHT = 50;

export function roomGrid(gridFunc: (x: number, y: number) => number): Array<Array<number>> {
    let arr = new Array(ROOM_HEIGHT);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(ROOM_WIDTH);
        for (let j = 0; j < arr[i].length; j++) {
            arr[i][j] = gridFunc(i, j);
        }
    }
    return arr;
};

/**
 * @param {RoomPosition} position
 * @return boolean
 */
export function isWalkable(position: RoomPosition) {
    if (Game.map.getTerrainAt(position) === "wall") {
        return false;
    }
    return !_.any(position.lookFor<Structure>(LOOK_STRUCTURES), isObstacle);
};

/**
* @return boolean
*/
export function isObstacle(obj: Structure) {
    return _.contains(OBSTACLE_OBJECT_TYPES, obj.structureType);
}

function nextInSearch(room: Room, pos: RoomPosition, seen: Set<RoomPosition>): RoomPosition[] {
    return _.filter([
        room.getPositionAt(pos.x + 1, pos.y),
        room.getPositionAt(pos.x - 1, pos.y),
        room.getPositionAt(pos.x, pos.y + 1),
        room.getPositionAt(pos.x, pos.y - 1),
    ], p => p !== null && !seen.has(p)) as RoomPosition[];
}

export function roomHillClimb(
    startPos: RoomPosition,
    costFunc: (pos: RoomPosition) => number
) : [RoomPosition | null, number] {
    const room = Game.rooms[startPos.roomName];
    let horizon = [startPos];
    let seen = new Set(horizon);
    let minCost = Number.MAX_SAFE_INTEGER;
    let minFound = null;

    while (!_.isEmpty(horizon)) {
        const candidate = horizon.shift() as RoomPosition;
        seen.add(candidate);

        const cost = costFunc(candidate);
        if (cost >= minCost) {
            continue;
        }
        minCost = cost;
        minFound = candidate;
        horizon.push(...nextInSearch(room, candidate, seen));
    }
    return [minFound, minCost];
};

/**
 *
 * @param {RoomPosition} startPos
 * @param {searchFunc} searchFunc
 * @returns {[RoomPosition, number]}
 */
export function roomBfsSearch(
    startPos: RoomPosition,
    searchFunc: (pos: RoomPosition) => boolean
) {
    const room = Game.rooms[startPos.roomName];
    let horizon = [startPos];
    let seen = new Set(horizon);
    while (!_.isEmpty(horizon)) {
        const candidate = horizon.shift() as RoomPosition;
        seen.add(candidate);
        if (searchFunc(candidate)) {
            return candidate;
        }
        horizon.push(...nextInSearch(room, candidate, seen));
    }
    return null;
}

/**
 * @param {Room} room
 * @param {Array<RoomPosition>} positions
 */
export function findPosMiddle(room: Room, positions: Array<RoomPosition>): RoomPosition {
    const [x, y] = pointAverage(positions);
    const result = room.getPositionAt(x, y);
    if (result === null) {
        throw Error("Point average is null");
    }
    return result;
};

/**
 *
 * @param {Array<RoomPosition>} positions
 * @returns {[number, number]}
 */
export function pointAverage(positions: Array<RoomPosition>): [number, number] {
    if (_.isEmpty(positions)) {
        throw Error("Positions was empty");
    }
    return [
        Math.round(_.sum(positions, p => p.x) / _.size(positions)),
        Math.round(_.sum(positions, p => p.y) / _.size(positions))
    ];
};

/**
 *  @param {Array<RoomPosition>} positions
 *  Must be in same room
 */
export function centerFinder(positions: Array<RoomPosition>) {
    const [avgX, avgY] = pointAverage(positions);
    return _.min(
        positions,
        p => Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2))
    );
};

export function findClusters(positions: Array<RoomPosition>) {
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
