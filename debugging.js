"use strict";

const Spawn_ = require('spawn');

module.exports = {
    killExcessCreeps: function() {
        const totalOver = _.size(Game.creeps) - Spawn_.CREEP_CAP;
        if (totalOver <= 0) {
            return;
        }

        _.chain(Game.creeps)
            .sortBy((creep) => _.sum(creep.carry))
            .slice(0, totalOver)
            .value()
            .forEach((c) => {
                console.log('killing', c);
                c.suicide();
            });
    }
}