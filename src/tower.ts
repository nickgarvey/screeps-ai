export function towerSites(room: Room) {
    // find all towers and queued towers
    // room.find
    // if towers < 2
    // find all objects of interest
    // try 10 times
    // pick a random point
    // verify it is not near one of the points of interest
    // select and return locations
    return [room.getPositionAt(25, 25)];
}

export function numTowers(room: Room) {
    return _.size(
        room.find(
            FIND_MY_STRUCTURES,
            {filter: (s: Structure) => s.structureType === STRUCTURE_TOWER}));
}
