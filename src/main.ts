import * as Spawn_ from "spawn";
import * as Creep_ from "creep";
import * as Cpu_ from "cpu";
import * as Extension_ from "extension";
import * as Roads_ from "roads";

function garbageCollect() {
    for (const name of Object.keys(Memory.creeps)) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    Cpu_.garbageCollect();
}

function buildConstructionSites() {
    if (Game.time % 5 === 2) {
        console.log('extension building');
        _.forEach(Game.rooms, Extension_.buildSiteIfNeeded);
    } else if (Game.time % 15 === 0) {
        console.log('road building');
        for (const room of _.values(Game.rooms) as Room[]) {
            const positions = Roads_.roadSites(room);
            positions.forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
        }
    } else if (Game.time % 1 === 0) {
        // _.forEach(Game.rooms, room => console.log(room, Tower_.numTowers(room)));
    }
}

export function loop(): void {
    console.log('START ticks available:', Game.cpu.tickLimit, Game.cpu.bucket);
    buildConstructionSites();
    _.forEach(Game.spawns, Spawn_.doSpawn);
    _.forEach(Game.creeps, Creep_.run);

    // RoomVisual_.heatMap(_.values(Game.rooms)[0], RoomAlgs_.roomGrid((x, y) => x * y));

    garbageCollect();

    console.log('END   ticks used:', Math.ceil(Game.cpu.getUsed()));
}
