interface CreepMemory {
    role: string | null | undefined;
    selection: string | null | undefined;
}


interface RoomState {
    extensions: Array<[number, number]>,
    towers:  Array<[number, number]>,
}

interface Memory {
    plan: {
        [name: string]: RoomState;
    };
}

interface RoomGrid<T> {
    // access out of bounds behavior undefined
    get: (x: number, y: number) => T;
}
