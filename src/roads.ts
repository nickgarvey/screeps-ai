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

    const sources = room.find(FIND_SOURCES) as Source[];
    let toPathPositions : RoomPosition[] = [];

    for (const source of sources) {
        toPathPositions.push(source.pos);
    }

    const structures = room.find(FIND_MY_STRUCTURES) as Structure[];
    for (const obj of structures) {
        if (obj.structureType !== STRUCTURE_ROAD) {
            toPathPositions.push(obj.pos);
        }
    }


    // list of positions grouped together
    const clusters = findClusters(toPathPositions);
    if (_.isEmpty(clusters)) {
        return [];
    }

    let paths : RoomPosition[] = [];
    for (let i = 0; i < clusters.length; i++) {
        const group = clusters[i];
        const center = centerFinder(group);
        for (let j = i + 1; j < clusters.length; j++) {
            // try to avoid swamps but it's okay to build over them
            const options = {swampCost: 3, maxRooms: 1, heuristicWeight: 1};
            // TODO avoid trying to build roads through structures
            const path = PathFinder.search(center, clusters[j].map(p => ({pos: p, range: 1})), options);
            if (path.incomplete) {
                continue;
            }
            for (const square of path.path) {
                paths.push(square);
            }
        }
    }

    let result : RoomPosition[] = [];
    for (const pos of _.uniq(paths, p => p.x + ":" + p.y)) {
        // not going to bother deduplicating, doesn't do any harm
        if (!_.any(toPathPositions, p => p.isEqualTo(pos))) {
            result.push(pos);
        }
    }
    return result;
}
