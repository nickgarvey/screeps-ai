function coordIsPathable(coord_objs) {
    return !_.any(
        coord_objs,
        obj => _.contains(OBSTACLE_OBJECT_TYPES, obj.type)
            || _.contains(OBSTACLE_OBJECT_TYPES, _.get(obj, 'terrain', '')));
}

module.exports = {
    select: function(creep) {
        const sources = creep.room.find(FIND_SOURCES);
        return _.max(sources, (source) => {
            // if we are standing next to a source, then use it
            if (creep.pos.isNearTo(source.pos)) {
                return Number.MAX_SAFE_INTEGER;
            }
            if (source.energy === 0) {
                return 0;
            }

            const look = source.room.lookAtArea(
                source.pos.y - 1,
                source.pos.x - 1,
                source.pos.y + 1,
                source.pos.x + 1);
            let coords = {};
            for (const x in look) {
                for (const y in look[x]) {
                    coords[x + ":" + y] = look[x][y];
                }
            };

            const numFreeNodes = _.values(coords).filter(coordIsPathable).length;
            return numFreeNodes / creep.pos.getRangeTo(source.pos);
        });
    }
};