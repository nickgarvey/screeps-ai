import * as alg from "../src/room-algs";

test('roomGrid sets correct values', () => {
    const valueFn = jest.fn();
    valueFn.mockImplementation((x: number, y: number) => 2 * x * y);
    const grid = alg.roomGrid(valueFn);
    expect(grid.get(4, 5)).toBe(4 * 2 * 5);
    expect(grid.get(0, 20)).toBe(0);
    expect(valueFn).toHaveBeenCalledTimes(alg.ROOM_HEIGHT * alg.ROOM_WIDTH);
});

test('simulatedAnneal follows down slope', () => {
    expect(alg.simulatedAnneal(0, x => x + 1, x => -x, 20, 1)[0]).toBe(20);
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
    expect([14, 15, 16]).toContain(result);
});

test('simulatedAnneal escapes local min of array', () => {
    let array: Array<number> = [];
    for (let i = -15; i < 15; i++) {
        array.push(Math.abs(i));
    }
    // set first element to be less than next, but we should jump anyway
    // there is a very small chance we just never do, but at 1000 iterations
    // we surely are fine
    array[0] = 10;

    const nextFunc = (index: number) => Math.random() < 0.5
        ? array[Math.max(index-1, 0)]
        : array[Math.min(index+1, 30)];

    const costFunc = (index: number) => array[index];
    const result = alg.simulatedAnneal(0, nextFunc, costFunc, 10000)[0];
    // allow some options as we might have gotten unlikely with a jump
    expect(result).toBeGreaterThan(5);
    expect(result).toBeLessThan(20);
});
