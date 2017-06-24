export function selectSource(creep: Creep): Source {
    const sources = creep.room.find(FIND_SOURCES) as Array<Source>;
    return _.max(sources, (source: Source) => {
        return Math.random() * source.energy;
    });
}
