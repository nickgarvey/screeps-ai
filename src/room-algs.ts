export const ROOM_WIDTH = 50;
export const ROOM_HEIGHT = 50;

const ANNEAL_COOL_RATE = 0.97;

export function roomGrid<T>(
    gridFunc: (x: number, y: number) => T,
): RoomGrid<T> {
    let arr = new Array(ROOM_WIDTH * ROOM_HEIGHT);
    for (const [x, y] of roomCoords()) {
        arr[x + ROOM_WIDTH * y] = gridFunc(x, y);
    }
    return {
        get: (x: number, y: number) => arr[x + ROOM_WIDTH * y]
    };
}

export function costMatrix(
    costFunction: (x: number, y: number) => number,
): CostMatrix {
    let matrix = new PathFinder.CostMatrix();
    for (const [x, y] of roomCoords()) {
        matrix.set(x, y, costFunction(x, y));
    }
    return matrix;
}

export function roomCoords(): Array<[number, number]> {
    let arr : Array<[number, number]> = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            arr.push([x, y]);
        }
    }
    return arr;
}

export function isWalkable(position: RoomPosition) {
    if (Game.map.getTerrainAt(position) === "wall") {
        return false;
    }
    return !_.any(position.lookFor<Structure>(LOOK_STRUCTURES), isObstacle);
}

export function isObstacle(obj: Structure): boolean {
    return _.contains(OBSTACLE_OBJECT_TYPES, obj.structureType);
}

export function positionsAround(pos: RoomPosition): RoomPosition[] {
    const room = Game.rooms[pos.roomName];
    return _.filter([
        room.getPositionAt(pos.x + 1, pos.y),
        room.getPositionAt(pos.x - 1, pos.y),
        room.getPositionAt(pos.x, pos.y + 1),
        room.getPositionAt(pos.x, pos.y - 1),
    ], p => p !== null) as RoomPosition[];
}

function nextInSearch(pos: RoomPosition, seen: Set<RoomPosition>): RoomPosition[] {
    return _.filter(positionsAround(pos), p => !seen.has(p));
}

export function roomHillClimb(
    startPos: RoomPosition,
    costFunc: (pos: RoomPosition) => number
) : [RoomPosition | null, number] {
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
        horizon.push(...nextInSearch(candidate, seen));
    }
    return [minFound, minCost];
}

export function roomBfsSearch(
    startPos: RoomPosition,
    searchFunc: (pos: RoomPosition) => boolean
) {
    let horizon = [startPos];
    let seen = new Set(horizon);
    while (!_.isEmpty(horizon)) {
        const candidate = horizon.shift() as RoomPosition;
        seen.add(candidate);
        if (searchFunc(candidate)) {
            return candidate;
        }
        horizon.push(...nextInSearch(candidate, seen));
    }
    return null;
}

export function findPosMiddle(room: Room, positions: Array<RoomPosition>): RoomPosition {
    const [x, y] = pointAverage(positions);
    const result = room.getPositionAt(x, y);
    if (result === null) {
        throw Error("Point average is null");
    }
    return result;
}


export function pointAverage(positions: Array<RoomPosition>): [number, number] {
    if (_.isEmpty(positions)) {
        throw Error("Positions was empty");
    }
    return [
        Math.round(_.sum(positions, p => p.x) / _.size(positions)),
        Math.round(_.sum(positions, p => p.y) / _.size(positions))
    ];
}

export function centerFinder(positions: Array<RoomPosition>) {
    const [avgX, avgY] = pointAverage(positions);
    return _.min(
        positions,
        p => Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2))
    );
}

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

export const printState = JSON.stringify;

export function simulatedAnneal<S>(
    initialState: S,
    stepFunction: (state: S) => S | null,
    costFunction: (state: S) => number,
    iterations = 1000,
    startTemp = 1,
): [S, number] {
    const anneal = (oldCost: number, newCost: number, iteration: number) =>
        Math.exp((oldCost - newCost) / (startTemp * Math.pow(ANNEAL_COOL_RATE, iteration)));

    let curState = initialState;
    let curCost = costFunction(initialState);
    for (let i = 0; i < iterations; i++) {
        const newState = stepFunction(curState);
        if (newState === null) {
            continue;
        }
        const newCost = costFunction(newState);
        const rand = Math.random();
        if (newCost <= curCost || rand < anneal(curCost, newCost, i)) {
            curCost = newCost;
            curState = newState;
        }
    }
    return [curState, curCost];
}

export function greedyMinimizer<S>(
    initialState: S,
    stepFunction: (state: S) => S | null,
    costFunction: (state: S) => number,
    iterations = 1000,
): [S, number] {
    let curState = initialState;
    let curCost = costFunction(initialState);
    for (let i = 0; i < iterations; i++) {
        const newState = stepFunction(curState);
        if (newState === null) {
            continue;
        }
        const newCost = costFunction(newState);
        if (newCost <= curCost) {
            curCost = newCost;
            curState = newState;
        }
    }
    return [curState, curCost];
}
