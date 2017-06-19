const ROOM_WIDTH = 50;
const ROOM_HEIGHT = 50;

const MAX_SITES = 10;

extension = {
    buildSiteIfNeeded: function(room) {
        const numExtensions = extension.extensions(room).length;
        if (numExtensions >= CONTROLLER_STRUCTURES.extension[room.controller.level]) {
            return;
        }

        // need this so we don't hit CPU limit for now
        if (numExtensions >= MAX_SITES) {
            return;
        }

        // one at a time
        if (!_.isEmpty(Game.constructionSites)) {
            return;
        }

        // just try to build in the middle spiraling out.
        // this isn't very smart at all but that's fine for now
        let x = ROOM_WIDTH / 2;
        let y = ROOM_HEIGHT / 2;
        for (s = 0; true; s++) {
            for (i = -s; i < s; i++) {
                for (j = -s; j < s; j++) {
                    const result = room.createConstructionSite(
                        x + i,
                        y + j,
                        STRUCTURE_EXTENSION);
                    if (result === OK || result === ERR_INVALID_ARGS) {
                        console.log('buildResult', result);
                        return;
                    } else if (!result === ERR_INVALID_TARGET) {
                        console.log('createConstructionSite unexpected', result);
                        return;
                    }
                }
            }
        }
    },

    extensions: function(room) {
        const structures = room.find(FIND_STRUCTURES);
        return _.filter(structures, s => s.structureType == STRUCTURE_EXTENSION);
    },
};

module.exports = extension;