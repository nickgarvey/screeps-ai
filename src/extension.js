"use strict";

// const MAX_SITES = 8;

const RoomAlgs_ = require('room-algs');

Memory.costMemo = {};
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
        if (search["incomplete"] === true) {
            return Number.MAX_SAFE_INTEGER;
        }
        total += search["cost"];
    }
    return total;
}

function buildPoints(center) {
    const room = Game.rooms[center.roomName];
    return [
        center,
        room.getPositionAt(center.x + 1, center.y),
        room.getPositionAt(center.x - 1, center.y),
        room.getPositionAt(center.x, center.y + 1),
        room.getPositionAt(center.x, center.y - 1),
    ];
}

let buildMemo = {};
function searchFunction(pos) {
    const buildCandidates = buildPoints(pos);

    for (const buildCandidate of buildCandidates) {
        if (!buildCandidate) {
            return false;
        }
        if (_.get(buildMemo, buildCandidate) !== undefined) {
            return _.get(buildMemo, buildCandidate);
        }

        buildMemo[buildCandidate] = RoomAlgs_.isWalkable(buildCandidate);
        if (!buildMemo[buildCandidate]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    /** @param {Room} room */
    extensionSites: function(room) {
        // TODO so far this finds the first candidate for placement

        // find all sources & spawn
        const keyPoints = []
            .concat(room.find(FIND_MY_SPAWNS))
            .concat(room.find(FIND_SOURCES))
            .map(obj => obj.pos);

        if (_.isEmpty(keyPoints)) {
            return [];
        }

        // bfs with our cost function
        const [minFound, _2] = RoomAlgs_.roomHillClimb(
            RoomAlgs_.findPosMiddle(room, keyPoints),
            (p) => costFunctionMemo(keyPoints, p)
        );

        const center = RoomAlgs_.roomBfsSearch(minFound, searchFunction);
        return buildPoints(center);
    },

    buildSiteIfNeeded: function(room) {
        const numExtensions = module.exports.extensions(room).length;
        if (numExtensions >= CONTROLLER_STRUCTURES.extension[room.controller.level]) {
            return;
        }
        // TODO add one cluster at a time logic
        if (numExtensions >= 1) {
        // TODO replace 5 with size of build points
        // if (numExtensions >= MAX_SITES * 5) {
            return;
        }
        _.forEach(module.exports.extensionSites(room), p => {
            room.createConstructionSite(p, STRUCTURE_EXTENSION);
        });
    },

    extensions: function(room) {
        const structures = room.find(FIND_STRUCTURES);
        return _.filter(structures, s => s.structureType === STRUCTURE_EXTENSION);
    },
};
