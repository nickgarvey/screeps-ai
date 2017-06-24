// const MAX_SITES = 8;

import {findPosMiddle, roomHillClimb, isWalkable, roomBfsSearch} from "room-algs";

Memory.costMemo = {};
function costFunctionMemo(keyPoints: Array<RoomPosition>, pos: RoomPosition) {
    const argsAsStr = keyPoints.toString() + ':' + pos.toString();
    const saved = Memory.costMemo[argsAsStr];
    if (saved) {
        return saved;
    }
    const result = costFunction(keyPoints, pos);
    Memory.costMemo[argsAsStr] = result;
    return result;
}

function costFunction(keyPoints: Array<RoomPosition>, pos: RoomPosition) {
    let total = 0;
    // PathFinder by default doesn't consider creeps or roads - great
    for (const keyPoint of keyPoints) {
        const search = PathFinder.search(
            pos,
            {pos: keyPoint, range: 1},
            {swampCost: 1});
        if (search["incomplete"] === true) {
            return Number.MAX_SAFE_INTEGER;
        }
        total += search["cost"];
    }
    return total;
}

function buildPoints(center: RoomPosition) {
    const room = Game.rooms[center.roomName];
    return [
        center,
        room.getPositionAt(center.x + 1, center.y),
        room.getPositionAt(center.x - 1, center.y),
        room.getPositionAt(center.x, center.y + 1),
        room.getPositionAt(center.x, center.y - 1),
    ];
}

function searchFunction(pos: RoomPosition) {
    const buildCandidates = buildPoints(pos);

    for (const buildCandidate of buildCandidates) {
        if (!buildCandidate || !isWalkable(buildCandidate)) {
            return false;
        }
    }
    return true;
}

export function extensionSites(room: Room) {
    // TODO so far this finds the first candidate for placement

    // find all sources & spawn
    const keyPoints = room.find(FIND_MY_SPAWNS)
        .concat(room.find(FIND_SOURCES))
        .map((obj: RoomObject)  => obj.pos);

    if (_.isEmpty(keyPoints)) {
        return [];
    }

    // bfs with our cost function
    const minFound = roomHillClimb(
        findPosMiddle(room, keyPoints),
        (p: RoomPosition) => costFunctionMemo(keyPoints, p)
    )[0];

    if (!minFound) {
        return [];
    }
    const center = roomBfsSearch(minFound, searchFunction);
    if (!center) {
        return [];
    }
    return buildPoints(center);
}

export function buildSiteIfNeeded(room: Room) {
    const numExtensions = extensions(room).length;
    const controller = room.controller;
    if (!controller || numExtensions >= CONTROLLER_STRUCTURES.extension[controller.level]) {
        return;
    }
    // TODO add one cluster at a time logic
    if (numExtensions >= 1) {
    // TODO replace 5 with size of build points
    // if (numExtensions >= MAX_SITES * 5) {
        return;
    }
    _.forEach(extensionSites(room), p => {
        p && room.createConstructionSite(p, STRUCTURE_EXTENSION);
    });
}

export function extensions(room: Room) {
    const structures = room.find(FIND_STRUCTURES) as Structure[];
    return _.filter(structures, s => s.structureType === STRUCTURE_EXTENSION);
}
