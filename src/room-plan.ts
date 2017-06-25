import {ROOM_HEIGHT, ROOM_WIDTH, roomGrid, simulatedAnneal} from "./room-algs";

interface RoomState {
    extensions: Array<[number, number]>,
    towers:  Array<[number, number]>,
}

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

function maybeCanBuild(x: number, y: number) {
    // can't build on the edges
    return x >= 2 && x < ROOM_WIDTH - 1 && y >= 2 && y < ROOM_HEIGHT - 1;
}

function getBuildableGrid(room: Room): Array<Array<boolean>> {
    const isBuildable = (x: number, y: number) => {
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
        if (curCost === Number.MAX_SAFE_INTEGER) {
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
    const sources = room.find(FIND_SOURCES) as Source[];
    const cost = (state: RoomState) => {
        let cost = 0;
        for (const [x, y] of state.extensions) {
            if (!maybeCanBuild(x, y) || !buildableGrid[x][y]) {
                return Number.MAX_SAFE_INTEGER;
            }
            for (const source of sources) {
                cost += source.pos.getRangeTo(x, y);
            }
        }
        for (const [x, y] of state.towers) {
            if (!maybeCanBuild(x, y) || !buildableGrid[x][y]) {
                return Number.MAX_SAFE_INTEGER;
            }
        }
        return cost;
    };
    const result = simulatedAnneal(randState(), step, cost);
    console.log(JSON.stringify(result[0]), result[1]);
    return result[0];
}
