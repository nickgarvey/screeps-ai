import {positionsAround} from "./room-algs";
export function selectSource(creep: Creep): Source {
    const lairs = creep.room.find(
        FIND_HOSTILE_STRUCTURES,
        {filter: (s: Structure) => s.structureType === STRUCTURE_KEEPER_LAIR},
    );
    const sources = creep.room.find(
        FIND_SOURCES, {filter: (s: Source) => s.pos.findInRange(lairs, 10).length === 0},
    ) as Array<Source>;

    return _.max(sources, (source: Source) => {
        if (source.pos.isNearTo(creep.pos)) {
            return Number.POSITIVE_INFINITY;
        }
        return (sourceOccupied(source) ? Math.random() / 2 : 1) * (0.3 * source.energy) / creep.pos.getRangeTo(source.pos);
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
