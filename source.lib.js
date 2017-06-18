module.exports = {
    select: function(creep) {
        const sources = creep.room.find(FIND_SOURCES);
        const source = _.max(sources, (source) => {
            if (creep.pos.isNearTo(source.pos)) {
                return Number.MAX_SAFE_INTEGER;
            }
            const pos = source.pos;
            const look = source.room.lookAtArea(
                pos.y - 1,
                pos.x - 1,
                pos.y + 1,
                pos.x + 1);
            let totalLegit = 0;
            // TODO this is terrible but it's late
            for (const x in look) {
                for (const y in look[x]) {
                    let isLegit = true;
                    for (const i in look[x][y]) {
                        const obj = look[x][y][i];
                        if (_.contains(OBSTACLE_OBJECT_TYPES, obj.type) || _.contains(OBSTACLE_OBJECT_TYPES, _.get(obj, 'terrain', ''))) {
                            isLegit = false;
                            break;
                        }
                    }
                    if (isLegit) {
                        totalLegit++;
                    }
                }
            }
            return totalLegit / PathFinder.search(creep.pos, source.pos).cost;
        });
        
        return source;
    }
};