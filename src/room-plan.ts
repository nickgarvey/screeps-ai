import {greedyMinimizer, printState, ROOM_HEIGHT, ROOM_WIDTH, roomGrid} from "./room-algs";

const PER_TICK_PATH_ITERATIONS = 15;
const JIGGLE_AMOUNT = 5;

function randXY(): [number, number] {
    return [Math.round(Math.random() * ROOM_WIDTH), Math.round(Math.random() * ROOM_HEIGHT)];
}

function jiggleCoord(coord: [number, number], jiggleAmount: number = 1): [number, number] {
    // uniform distribution over xOff = -1|0|1 and yOff = -1|0|1
    // test in console
    // rs = {"-1": 0, "0": 0, "1": 0};
    // for (i = 0; i < 200000; i++) rs[r() + ""]++; rs;
    const xOff = Math.round(jiggleAmount * 3 * (Math.random() - 0.5));
    const yOff = Math.round(jiggleAmount * 3 * (Math.random() - 0.5));
    return [coord[0] + xOff, coord[1] + yOff];
}

function getBuildableGrid(room: Room): RoomGrid<boolean> {
    const isBuildable = (x: number, y: number) => {
        if (x < 2 || x > ROOM_WIDTH - 3) {
            return false;
        }
        if (y < 2 || y > ROOM_HEIGHT - 3) {
            return false;
        }
        if (Game.map.getTerrainAt(x, y, room.name) === "wall") {
            return false;
        }

        const structures = room.lookForAt(LOOK_STRUCTURES, x, y) as Structure[];
        for (const structure of structures) {
            if (_.contains(OBSTACLE_OBJECT_TYPES, structure.structureType)) {
                return false;
            }
        }
        return true;
    };
    return roomGrid(isBuildable);
}

function getCached(
    room: Room,
    numExtensions: number,
    numTowers: number,
): RoomState | null {
    if (!Memory.plan) {
        return null;
    }
    let id = [room.name, numExtensions, numTowers].join(":");
    return Memory.plan[id] || null;
}

function setCached(
    room: Room,
    numExtensions: number,
    numTowers: number,
    state: RoomState,
): void {
    let id = [room.name, numExtensions, numTowers].join(":");
    if (!_.isObject(Memory.plan)) {
        Memory.plan = {};
    }
    Memory.plan[id] = state;
}

export function printGrid(grid: RoomGrid<boolean>) {
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        let toPrint = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            toPrint.push(grid.get(x, y) ? '-' : 'O');
        }
        console.log(toPrint);
    }
}

// this is n^2, but should be fast for small arrays
// I haven't checked though. better is sort and check
// even better is get the damn Set to work
export function allUnique(items: Array<[number, number]>): boolean {
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (items[i][0] === items[j][0] && items[i][1] === items[j][1]) {
                return false;
            }
        }
    }
    return true;
}

function validState(
    state: RoomState,
    buildableGrid: RoomGrid<boolean>,
): boolean {
    const boundsCheck = (x: number, y: number) =>
        x >= 0 && x < ROOM_WIDTH && y >= 0 && y < ROOM_HEIGHT;
    const allCoords = _.union(state.extensions, state.towers);
    for (let i = 0; i < allCoords.length; i++) {
        if (!boundsCheck(allCoords[i][0], allCoords[i][1])) {
            return false;
        }
    }
    if (!allUnique(allCoords)) {
        return false;
    }
    for (const [x, y] of allCoords) {
        if (!buildableGrid.get(x, y)) {
            return false;
        }
    }
    return true;
}

function buildCostFunction(room: Room) {
    const sources = room.find(FIND_SOURCES) as Source[];

    // the state must be valid before entering this function
    return (state: RoomState): number => {
        // check for overlap
        let cost = 0;
        for (const [x, y] of state.extensions) {
            for (const source of sources) {
                cost += source.pos.getRangeTo(x, y);
            }
        }
        return cost;
    };
}

function buildStepFunction(
    numExtensions: number,
    numTowers: number,
    buildableGrid: RoomGrid<boolean>,
) {
    return (state: RoomState): RoomState | null => {
        let newState = _.clone(state, true);

        const toMoveIndex = Math.floor(Math.random() * (numExtensions + numTowers));
        if (toMoveIndex < numExtensions) {
            newState.extensions[toMoveIndex] = jiggleCoord(
                state.extensions[toMoveIndex],
                JIGGLE_AMOUNT,
            );
        } else {
            newState.towers[toMoveIndex - numExtensions] = jiggleCoord(
                state.towers[toMoveIndex - numExtensions],
                JIGGLE_AMOUNT,
            );
        }
        if (!validState(newState, buildableGrid)) {
            return null;
        }
        return newState;
    };
}

function randState(
    numExtensions: number,
    numTowers: number,
    buildableGrid: RoomGrid<boolean>,
) {
    let randBuildable = () => {
        while (true) {
            const coords = randXY();
            if (buildableGrid.get(coords[0], coords[1])) {
                return coords;
            }
        }
    };

    while (true) {
        let state: RoomState = {extensions: [], towers: []};
        for (let i = 0; i < numExtensions; i++) {
            state.extensions.push(randBuildable());
        }
        for (let i = 0; i < numTowers; i++) {
            state.towers.push(randBuildable());
        }
        if (validState(state, buildableGrid)) {
            return state;
        }
    }
}

export function buildRoomPlan(
    room: Room,
    numExtensions: number,
    numTowers: number,
): number | RoomState {
    const buildableGrid = getBuildableGrid(room);

    const stepFn = buildStepFunction(numExtensions, numTowers, buildableGrid);
    const costFn = buildCostFunction(room);

    let startState = getCached(room, numExtensions, numTowers)
        || randState(numExtensions, numTowers, buildableGrid);

    console.log('start state:', printState(startState), costFn(startState));
    const [result, resultCost] = greedyMinimizer(
        startState,
        stepFn,
        costFn,
        PER_TICK_PATH_ITERATIONS);
    console.log('end state:', printState(result), resultCost);

    setCached(room, numExtensions, numTowers, result);
    return result;
}

export function drawRoomState(
    state: RoomState,
    room: Room,
) {
    _.forEach(
        state.extensions,
        e => room.visual.text('E', e[0], e[1],
            {opacity: 0.7, backgroundColor: 'green'}),
    );
    _.forEach(
        state.towers,
        e => room.visual.text('T', e[0], e[1],
            {opacity: 0.7, backgroundColor: 'blue'}),
    );
}
