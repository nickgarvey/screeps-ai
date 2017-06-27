
interface FillPriorities {
    [type: string]: number,
}
const TO_FILL_PRIORITIES : FillPriorities = {
    tower: 3,
    extension: 2,
    spawn: 1,
};

export function structuresToFill(room: Room): Structure[] {
    const structures = room.find(
        FIND_MY_STRUCTURES,
        {filter: (s: Structure) => _.get(s, 'energyCapacity')},
    ) as Structure[];
    const group = _.groupBy(structures, s => s.structureType);
    for (const priority in TO_FILL_PRIORITIES) {
        if (_.get(group, priority)) {
            return group[priority];
        }
    }
    return [];
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
