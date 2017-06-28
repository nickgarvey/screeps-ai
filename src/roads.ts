import {findClusters, centerFinder} from "room-algs";

const MIN_ROOM_LEVEL_ROADS = 3;

export function newRoadSites(room: Room): RoomPosition[] {
    if (!room.controller || room.controller.level < MIN_ROOM_LEVEL_ROADS) {
        return [];
    }

    const pendingRoads = room.find(
        FIND_MY_CONSTRUCTION_SITES,
        {filter: (s: Structure) => s.structureType === STRUCTURE_ROAD}
    );
    // avoid a ton of roads to the same places
    if (pendingRoads.length) {
        return [];
    }

    const structures = room.find(FIND_STRUCTURES) as Structure[];
    const sources = room.find(FIND_SOURCES) as Source[];
    let toPathPositions : RoomPosition[] = [];
    for (const obj of structures) {
        if (obj.structureType !== STRUCTURE_ROAD) {
            toPathPositions.push(obj.pos);
        }
    }
    toPathPositions.push.apply(sources.map(s => s.pos));

    // list of positions grouped together
    const clusters = findClusters(toPathPositions);
    if (_.isEmpty(clusters)) {
        return [];
    }

    let paths = [];
    for (let i = 0; i < clusters.length; i++) {
        const group = clusters[i];
        const center = centerFinder(group);
        for (let j = i + 1; j < clusters.length; j++) {
            // try to avoid swamps but it's okay to build over them
            const options = {ignoreCreeps: true, swampCost: 3};
            const closest = center.findClosestByPath(clusters[j], options);
            paths.push(center.findPathTo(closest, options));
        }
    }

    let existingRoads = new Set();
    for (const structure of structures) {
        if (structure.structureType === STRUCTURE_ROAD) {
            existingRoads.add(structure.pos.x + ":" + structure.pos.y);
        }
    }

    let result = [];
    for (const pathSquare of _.flatten(paths)) {
        const pos = room.getPositionAt(pathSquare.x, pathSquare.y);
        if (pos !== null && !existingRoads.has(pos) && !_.any(toPathPositions, pos.isEqualTo)) {
            result.push(pos);
        }
    }

    return result;
}
