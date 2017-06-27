import {findClusters, centerFinder} from "room-algs";

const MIN_ROOM_LEVEL_ROADS = 3;

export function roadSites(room: Room): RoomPosition[] {
    if (room.controller && room.controller.level < MIN_ROOM_LEVEL_ROADS) {
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

    const structures = room.find(FIND_MY_STRUCTURES) as RoomObject[];
    const sources = room.find(FIND_SOURCES)as RoomObject[];
    const importantPositions = _.map(sources.concat(structures), o => o.pos);

    // list of positions grouped together
    const clusters = findClusters(importantPositions);
    if (_.isEmpty(clusters)) {
        return [];
    }

    let paths = [];
    for (let i = 0; i < clusters.length; i++) {
        const group = clusters[i];
        const center = centerFinder(group);
        for (let j = i + 1; j < clusters.length; j++) {
            // try to avoid swamps but it's okay to build over them
            const options = {ignoreCreeps: true, swampCost: 2};
            const closest = center.findClosestByPath(clusters[j], options);
            paths.push(center.findPathTo(closest, options));
        }
    }

    let result = [];
    for (const pathSquare of _.flatten(paths)) {
        const pos = room.getPositionAt(pathSquare.x, pathSquare.y);
        if (pos !== null && !_.any(importantPositions, pos.isEqualTo)) {
            result.push(pos);
        }
    }

    return result;
}
