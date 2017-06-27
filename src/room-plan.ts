import {greedyMinimizer, isObstacle, printState, ROOM_HEIGHT, ROOM_WIDTH, roomGrid} from "./room-algs";

const PER_TICK_PATH_ITERATIONS = 100;
const JIGGLE_AMOUNT = 5;
const LINEAR_CONVERGE = 2;
const PATHING_CONVERGE = 10;
// keep under 1 unless they will value being close more than keeping a clear path
const PULL_WEIGHT = 0.2;

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
    const sources = room.find(FIND_SOURCES) as Source[];
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
        for (const source of sources) {
            if (source.pos.inRangeTo(x, y, 2)) {
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
): RoomPlanMemory | null {
    if (!Memory.plan) {
        return null;
    }
    let id = [room.name, numExtensions, numTowers].join(":");
    return Memory.plan[id] || null;
}

enum CostAlgorithm {
    linear,
    pathing,
}

function setCached(
    room: Room,
    numExtensions: number,
    numTowers: number,
    state: RoomState,
    cost: number,
    algUsed: CostAlgorithm,
): void {
    let id = [room.name, numExtensions, numTowers].join(":");
    if (!_.isObject(Memory.plan)) {
        Memory.plan = {};
    }
    if (!_.isObject(Memory.plan[id])) {
        Memory.plan[id] = {
            // okay to cast, we are about to override
            currentBest: state,
            linearHist: [],
            pathingHist: [],
        }
    }

    Memory.plan[id].currentBest = state;
    switch (algUsed) {
        case CostAlgorithm.linear:
            Memory.plan[id].linearHist.push(cost);
            break;
        case CostAlgorithm.pathing:
            Memory.plan[id].pathingHist.push(cost);
            break;
    }
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

export function allSame<T>(items: Array<T>) {
    let first = null;
    for (let i = 0; i < items.length; i++) {
        if (first === null) {
            first = items[i];
        } else if (first !== items[i]) {
            return false;
        }
    }
    return true;
}

// no array copies
export function* stateCoordItr(state: RoomState) {
    for (let i = 0; i < state.extensions.length; i++) {
        yield state.extensions[i];
    }
    for (let i = 0; i < state.towers.length; i++) {
        yield state.towers[i];
    }
}

function validState(
    state: RoomState,
    buildableGrid: RoomGrid<boolean>,
): boolean {
    const boundsCheck = (x: number, y: number) =>
        x >= 0 && x < ROOM_WIDTH && y >= 0 && y < ROOM_HEIGHT;
    const allCoords = Array.from(stateCoordItr(state));
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

function buildPathFindingCostFunction(room: Room) {
    const sources = room.find(FIND_SOURCES) as Source[];
    const structures = room.find(FIND_STRUCTURES) as Structure[];
    const spawns = _.filter(
        structures,
        s => s.structureType === STRUCTURE_SPAWN
    ) as Spawn[];
    const extensions = _.filter(
        structures,
        s => s.structureType === STRUCTURE_EXTENSION
    ) as Extension[];

    // we expect that no coordinates are either
    // 1. in walls
    // 2. in existing structures
    // 3. on top of each other
    const extensionsCost = (
        exs: Array<[number, number]>,
        costMat: CostMatrix,
    ) => {
        let cost = 0;
        // TODO ensure not blocking source
        const all_extensions = _.union(_.map(extensions, e => [e.pos.x, e.pos.y]), exs);
        // extensions
        for (const [x, y] of all_extensions) {
            // minimize distance for creeps to walk after gathering
            for (const source of sources) {
                const search = PathFinder.search(
                    room.getPositionAt(x, y) as RoomPosition,
                    [{pos: source.pos, range: 1}],
                    {
                        roomCallback: (_r) => { return costMat; },
                        plainCost: 1,
                        swampCost: 2,
                        // https://github.com/screepers/typed-screeps/pull/5
                        // maxCost: 200, // TODO optimize here!
                        heuristicWeight: 1.2,
                    }
                );
                if (search.incomplete) {
                    return Number.POSITIVE_INFINITY;
                }
                cost += search.cost;
            }
            // pull them together
            for (const [ox, oy] of exs) {
                cost += PULL_WEIGHT * Math.max(Math.abs(x - ox), Math.abs(y - oy));
            }


        }
        return cost;
    };

    const towerCost = (
        towers: Array<[number, number]>
    ) => {
        let cost = 0;
        for (const [x, y] of towers) {
            for (const spawn of spawns) {
                // TODO 5 to constant
                cost += Math.abs(5 - spawn.pos.getRangeTo(x, y));
            }
        }
        return cost;
    }

    return (state: RoomState): number => {
        // load in the structures we have
        const costMat = new PathFinder.CostMatrix();
        for (const [x, y] of stateCoordItr(state)) {
            costMat.set(x, y, 0xFF);
        }
        for (const s of structures) {
            if (isObstacle(s)) {
                costMat.set(s.pos.x, s.pos.y, 0XFF0);
            }
        }
        return extensionsCost(state.extensions, costMat) + towerCost(state.towers);
    };
}


function buildLinearCostFunction(room: Room) {
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

export function chooseAlg(
    memory: RoomPlanMemory | null,
): CostAlgorithm | "finished" {
    // just started
    if (memory === null) {
        return CostAlgorithm.linear;
    }
    // pathing converged
    if (memory.pathingHist.length > PATHING_CONVERGE * 2) {
        const slice = _.slice(memory.pathingHist, memory.pathingHist.length - PATHING_CONVERGE);
        if (allSame(slice)) {
            return "finished";
        }
    }
    // in the middle of pathing
    if (memory.pathingHist.length > 0) {
        return CostAlgorithm.pathing;
    }
    // in the middle of linear
    if (memory.linearHist.length < LINEAR_CONVERGE * 2) {
        return CostAlgorithm.linear;
    }
    // finished linear, move to pathing
    if (allSame(_.slice(memory.linearHist, memory.linearHist.length - LINEAR_CONVERGE))) {
        return CostAlgorithm.pathing;
    }
    // still in linear
    return CostAlgorithm.linear;
}

export function buildRoomPlan(
    room: Room,
    numExtensions: number,
    numTowers: number,
): RoomState | null {
    // TODO good place for LRU cache so if we need to rerun with
    // same parameters after attack we don't get old data
    let saved: RoomPlanMemory | null = getCached(room, numExtensions, numTowers);
    console.log('build:', JSON.stringify(saved));
    if (saved) {
        drawRoomState(saved.currentBest, room);
    }

    // if we have converged then return!
    const costAlg = chooseAlg(saved);
    if (costAlg === "finished") {
        return (saved && saved.currentBest) || null;
    }

    const buildableGrid = getBuildableGrid(room);
    const stepFn = buildStepFunction(numExtensions, numTowers, buildableGrid);
    const costFn = costAlg === CostAlgorithm.linear
        ? buildLinearCostFunction(room)
        : buildPathFindingCostFunction(room);

    let startState = saved && saved.currentBest
        ? saved.currentBest
        : randState(numExtensions, numTowers, buildableGrid);

    console.log('start state:', printState(startState), costFn(startState));
    const [result, resultCost] = greedyMinimizer(
        startState,
        stepFn,
        costFn,
        PER_TICK_PATH_ITERATIONS);
    console.log('end state:', printState(result), resultCost);

    setCached(room, numExtensions, numTowers, result, resultCost, costAlg);
    return null;
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


// This doesn't do roads yet
export function buildIfNeeded(room: Room) {
    if (!room.controller) {
        return;
    }
    const countType = (objs: Array<Structure> | Array<ConstructionSite>, type: string) => {
        let count = 0;
        for (const o of objs) {
            if (o.structureType === type) {
                count++;
            }
        }
        return count;
    }

    const constructionSites = room.find(FIND_CONSTRUCTION_SITES) as ConstructionSite[];
    const structures = room.find(FIND_STRUCTURES) as Structure[];

    let numExtensions = countType(structures, STRUCTURE_EXTENSION)
        + countType(constructionSites, STRUCTURE_EXTENSION);
    let numTowers = countType(structures, STRUCTURE_TOWER)
        + countType(constructionSites, STRUCTURE_TOWER);

    const neededExtensions = CONTROLLER_STRUCTURES["extension"][room.controller.level] - numExtensions;
    const neededTower = CONTROLLER_STRUCTURES["tower"][room.controller.level] - numTowers;

    if (!(neededExtensions > 0 || neededTower > 0)) {
        return;
    }
    const plan = buildRoomPlan(room, Math.max(neededExtensions, 0), Math.max(neededTower, 0));
    if (plan !== null) {
        for (const [x, y] of plan.extensions) {
            room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
        }
        for (const [x, y] of plan.towers) {
            room.createConstructionSite(x, y, STRUCTURE_TOWER);
        }
    }

}
