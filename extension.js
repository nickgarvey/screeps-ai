"use strict";

const ROOM_WIDTH = 50;
const ROOM_HEIGHT = 50;

const MAX_SITES = 8;

/** @param {Array<RoomPosition>} positions */
function findPosMiddle(room, positions) {
    return room.getPositionAt(
        Math.floor(_.sum(positions, p => p.x) / _.size(positions)),
        Math.floor(_.sum(positions, p => p.y) / _.size(positions))
    );
}

Memory.costMemo = {}
function costFunctionMemo(keyPoints, pos) {
    const argsAsStr = keyPoints.toString() + ':' + pos.toString();
    const saved = Memory.costMemo[argsAsStr];
    if (saved) {
        return saved;
    }
    const result = costFunction(keyPoints, pos);
    Memory.costMemo[argsAsStr] = result;
    return result;
}

function costFunction(keyPoints, pos) {
    let total = 0;
    // PathFinder by default doesn't consider creeps or roads - great
    for (const keyPoint of keyPoints) {
        const search = PathFinder.search(
            pos,
            {pos: keyPoint, range: 1},
            {swampCost: 1});
        if (search.incomplete === true) {
            return Number.MAX_SAFE_INTEGER;
        }
        total += search.cost;
    }
    return total;
}

function buildPoints(center) {
    // TODO remove
    const pos = center;
    const room = Game.rooms[pos.roomName];
    return [
        pos,
        room.getPositionAt(pos.x + 1, pos.y),
        room.getPositionAt(pos.x - 1, pos.y),
        room.getPositionAt(pos.x, pos.y + 1),
        room.getPositionAt(pos.x, pos.y - 1),
    ];
}

let buildMemo = {};
function searchFunction(room, pos) {
    const buildCandidates = buildPoints(pos);
    
    for (const buildCandidate of buildCandidates) {
        if (!buildCandidate) {
            return false;
        }
        if (_.get(buildMemo, buildCandidate) !== undefined) {
            return _.get(buildMemo, buildCandidate);
        }
        const objs = buildCandidate.look();
        for (const obj in objs) {
            if (obj.type === "terrain" && obj["terrain"] === "wall") {
                buildMemo[buildCandidate] = false;
                return false;
            }
            if (obj.type === "structure" && obj["struture"].structureType !== "road") {
                buildMemo[buildCandidate] = false;
                return false;
            }
        }
        buildMemo[buildCandidate] = true;
    }
    return true;
}

function roomBfsSearch(startPos, searchFunc) {
    const room = Game.rooms[startPos.roomName];
    let horizon = [startPos];
    let seen = new Set(horizon);
    while (!_.isEmpty(horizon)) {
        const candidate = horizon.shift();
        seen.add(candidate);
        if (searchFunc(candidate)) {
            return candidate;
        }
        const next = _.filter([
            room.getPositionAt(candidate.x + 1, candidate.y),
            room.getPositionAt(candidate.x - 1, candidate.y),
            room.getPositionAt(candidate.x, candidate.y + 1),
            room.getPositionAt(candidate.x, candidate.y - 1),
        ], p => p !== null && !seen.has(p));
        
        horizon = horizon.concat(next);
    }
    return null;
}

// TODO rename, this is closer to gradient descent
function roomBfsCost(startPos, costFunc) {
    const room = Game.rooms[startPos.roomName];
    let horizon = [startPos];
    let seen = new Set(horizon);
    let minCost = Number.MAX_SAFE_INTEGER;
    let minFound = null;

    while (!_.isEmpty(horizon)) {
        const candidate = horizon.shift();
        seen.add(candidate);
        
        const cost = costFunc(candidate);
        if (cost >= minCost) {
            continue;
        }
        // TODO don't run this twice
        minCost = cost;
        minFound = candidate;
        
        const next = _.filter([
            room.getPositionAt(candidate.x + 1, candidate.y),
            room.getPositionAt(candidate.x - 1, candidate.y),
            room.getPositionAt(candidate.x, candidate.y + 1),
            room.getPositionAt(candidate.x, candidate.y - 1),
        ], p => p !== null && !seen.has(p));
        
        horizon = horizon.concat(next);
    }
    return [minFound, minCost];
}

const extension = {

    /** @param {Room} room */
    extensionSites: function(room) {
        // TODO so far this finds the first candidate for placement
        // build our cost function
        // find all sources & spawn
        const keyPoints = []
            .concat(room.find(FIND_MY_SPAWNS))
            .concat(room.find(FIND_SOURCES))
            .map(obj => obj.pos);
        if (_.isEmpty(keyPoints)) {
            return [];
        }
        const costFunc = (p) => costFunctionMemo(keyPoints, p);
        
        // bfs with it
        const [minFound, minCost] = roomBfsCost(findPosMiddle(room, keyPoints), costFunc);
        const searchFunc = (p) => searchFunction(room, p);
        const center = roomBfsSearch(minFound, searchFunc);
        return buildPoints(center);
    },

    buildSiteIfNeeded: function(room) {
        const numExtensions = extension.extensions(room).length;
        if (numExtensions >= CONTROLLER_STRUCTURES.extension[room.controller.level]) {
            return;
        }
        // TODO add one cluster at a time logic
        if (numExtensions >= 1) {
        // TODO replace 5 with size of build points
        // if (numExtensions >= MAX_SITES * 5) {
            return;
        }
        _.forEach(extension.extensionSites(room), p => {
            const r = room.createConstructionSite(p, STRUCTURE_EXTENSION);
            console.log(p, r);
        });
    },

    extensions: function(room) {
        const structures = room.find(FIND_STRUCTURES);
        return _.filter(structures, s => s.structureType === STRUCTURE_EXTENSION);
    },
};

module.exports = extension;
