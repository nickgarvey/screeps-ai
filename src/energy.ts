export function structuresLessThanFull(room: Room) {
    // TODO memoize
    const structures = room.find(FIND_STRUCTURES) as Array<Structure>;
    return _
        .chain(structures)
        .filter(structure =>
                (structure.structureType === STRUCTURE_EXTENSION
                    || structure.structureType === STRUCTURE_SPAWN)
                && _.get(structure, 'energy') < _.get(structure, 'energyCapacity'))
        .value();
}

export function currentEnergy(room: Room): number {
    const structures = room.find(FIND_MY_STRUCTURES);
    return _(structures)
        .map(structure => _.get(structure, 'energy', 0))
        .sum();
}

export function totalEnergyCapacity(room: Room): number {
    const structures = room.find(FIND_MY_STRUCTURES);
    return _(structures)
        .map(structure => _.get(structure, 'energyCapacity', 0))
        .sum();
}
