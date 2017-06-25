import {allUnique} from "../src/room-plan";

test('allUnique finds dup', () => {
    const arr : Array<[number, number]> = [[1,2], [2,3], [1,2]];
    expect(allUnique(arr)).toBeFalsy();
});

test('allUnique okay on unique array', () => {
    const arr : Array<[number, number]> = [[1,2], [2,3], [2,2]];
    expect(allUnique(arr)).toBeTruthy();
});
