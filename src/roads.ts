import {findClusters, centerFinder} from "room-algs";
import {extensions} from "extension";

export function roadSites(room: Room): RoomPosition[] {
    // TODO constant
    if (extensions(room).length < 5) {
        return [];
    }

    // TODO connect sources to deposits, but not sources to sources

    const structures = room.find(FIND_MY_STRUCTURES) as _HasRoomPosition[];
    const sources = room.find(FIND_SOURCES)as _HasRoomPosition[];
    const importantPositions = _.map(sources.concat(structures), o => o.pos);
    // list of positions grouped together
    const groups = findClusters(importantPositions);

    if (_.isEmpty(groups)) {
        return [];
    }

    let paths = [];
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const center = centerFinder(group);
        for (let j = i + 1; j < groups.length; j++) {
            // TODO favor existing roads slightly
            const options = {ignoreCreeps: true};
            const closest = center.findClosestByPath(groups[j], options);
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
