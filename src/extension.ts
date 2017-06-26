export function extensions(room: Room) {
    const structures = room.find(FIND_STRUCTURES) as Structure[];
    return _.filter(structures, s => s.structureType === STRUCTURE_EXTENSION);
}
