import {positionsAround} from "./room-algs";
export function selectSource(creep: Creep): Source {
    const sources = creep.room.find(FIND_SOURCES) as Array<Source>;
    return _.max(sources, (source: Source) => {
        return Math.random() * source.energy * creep.pos.getRangeTo(source.pos);
    });
}

export function sourceOccupied(source: Source): boolean {
    for (const pos of positionsAround(source.pos)) {
        if (Game.map.getTerrainAt(pos) === "wall") {
            continue;
        }
        if (!pos.lookFor(LOOK_CREEPS).length) {
            return false;
        }
    }
    return true;
}
