import {ROOM_HEIGHT, ROOM_WIDTH, roomGrid, simulatedAnneal} from "./room-algs";

function randXY(): [number, number] {
    return [Math.round(Math.random() * ROOM_WIDTH), Math.round(Math.random() * ROOM_HEIGHT)];
}

function jiggleCoord(coord: [number, number]): [number, number] {
    // uniform distribution over xOff = -1|0|1 and yOff = -1|0|1
    // test in console
    // rs = {"-1": 0, "0": 0, "1": 0};
    // for (i = 0; i < 200000; i++) rs[r() + ""]++; rs;
    const xOff = Math.round(3 * (Math.random() - 0.5));
    const yOff = Math.round(3 * (Math.random() - 0.5));
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
    let plan = Memory.plan[id];
    return plan || null;
}

function setCached(
    room: Room,
    numExtensions: number,
    numTowers: number,
    state: RoomState,
): void {
    let id = [room.name, numExtensions, numTowers].join(":");
    if (!Memory.plan) {
        Memory.plan = {};
    }
    Memory.plan[id] = state;
}

const printState = JSON.stringify;

function printGrid(grid: RoomGrid<boolean>) {
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        let toPrint = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            toPrint.push(grid.get(x, y) ? '-' : 'O');
        }
        console.log(toPrint);
    }
}

export function buildRoomPlan(
    room: Room,
    numExtensions: number,
    numTowers: number,
): number | RoomState {
    // initial state: everything all over the place
    const randState = () => {
        let state: RoomState = {extensions: [], towers: []};
        for (let i = 0; i < numExtensions; i++) {
            state.extensions.push(randXY());
        }
        for (let i = 0; i < numTowers; i++) {
            state.towers.push(randXY());
        }
        return state;
    };

    const step = (state: RoomState, curCost: number) => {
        if (curCost === Number.POSITIVE_INFINITY) {
            return randState();
        }
        let newState = {...state};
        const toMoveIndex = Math.floor(Math.random() * (numExtensions + numTowers));
        if (toMoveIndex < numExtensions) {
            newState.extensions[toMoveIndex] = jiggleCoord(state.extensions[toMoveIndex]);
        } else {
            newState.extensions[toMoveIndex - numExtensions] =
                jiggleCoord(state.towers[toMoveIndex - numExtensions]);
        }
        return newState;
    };

    const buildableGrid = getBuildableGrid(room);
    printGrid(buildableGrid);
    const sources = room.find(FIND_SOURCES) as Source[];
    const cost = (state: RoomState) => {
        let cost = 0;
        for (const [x, y] of state.extensions) {
            if (!buildableGrid.get(x, y)) {
                return Number.POSITIVE_INFINITY;
            }
            for (const source of sources) {
                cost += source.pos.getRangeTo(x, y);
            }
        }
        for (const [x, y] of state.towers) {
            if (!buildableGrid.get(x, y)) {
                return Number.POSITIVE_INFINITY;
            }
        }
        // TODO collide logic
        return cost;
    };
    let startState = getCached(room, numExtensions, numTowers) || randState();
    console.log('start state:', printState(startState), cost(startState));
    const [result, resultCost] = simulatedAnneal(startState, step, cost, 20);
    setCached(room, numExtensions, numTowers, result);
    console.log('end state:', printState(result), resultCost);
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
