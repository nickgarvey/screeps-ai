interface CreepMemory {
    role: string | null | undefined;
    selection: string | null | undefined;
    posHistory: RoomPosition[] | null | undefined;
}

interface RoomState {
    extensions: Array<[number, number]>,
    towers:  Array<[number, number]>,
}

interface RoomPlanMemory {
    currentBest: RoomState;
    // cost histories
    linearHist: Array<number>;
    pathingHist: Array<number>;
}

interface Memory {
    plan: {
        [room: string]: RoomPlanMemory;
    };
}

interface RoomGrid<T> {
    // access out of bounds behavior undefined
    get: (x: number, y: number) => T;
}
