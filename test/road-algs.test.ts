import * as alg from "../src/room-algs";

test('roomGrid sets some values', () => {
    const valueFn = jest.fn();
    valueFn.mockImplementation((x: number, y: number) => x * y);
    const grid = alg.roomGrid(valueFn);
    expect(grid[4][5]).toBe(20);
    expect(grid[0][20]).toBe(0);
    expect(valueFn).toHaveBeenCalledTimes(alg.ROOM_HEIGHT * alg.ROOM_WIDTH);
});

test('roomGrid isn\'t too big', () => {
    const valueFn = jest.fn();
    valueFn.mockImplementation((_x: number, _y: number) => 0);
    const grid = alg.roomGrid(valueFn);
    expect(grid).not.toContain(alg.ROOM_HEIGHT);
    expect(grid[1]).not.toContain(alg.ROOM_HEIGHT);
    expect(valueFn).toHaveBeenCalledTimes(alg.ROOM_HEIGHT * alg.ROOM_WIDTH);
});

test('simulatedAnneal does climb at all', () => {
    const old = Math.random
    Math.random = () => 0.22;
    try {
        expect(alg.simulatedAnneal(1, x => x + 1, x => x, 20, 1)[0])
            .toBeGreaterThan(0);
    } finally {
        Math.random = old;
    }
});

test('simulatedAnneal finds min of array', () => {
    let array: Array<number> = [];
    for (let i = -15; i < 15; i++) {
        array.push(Math.abs(i));
    }

    const nextFunc = (index: number) => Math.random() < 0.5
        ? array[Math.max(index-1, 0)]
        : array[Math.min(index+1, 30)];

    const costFunc = (index: number) => array[index];
    const result = alg.simulatedAnneal(15, nextFunc, costFunc)[0];
    // allow some options as we might have gotten unlikely with a jump
    expect([14,15,16]).toContain(result);
});