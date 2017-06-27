import * as Spawn_ from "spawn";
import * as Creep_ from "creep";
import * as Cpu_ from "cpu";
import * as Roads_ from "roads";
import {buildIfNeeded} from "./room-plan";

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
    if (Game.cpu.bucket < 2000) {
        return;
    }
    if (Game.time % 10 === 0) {
        console.log('structure building');
        _.forEach(Game.rooms, buildIfNeeded);
    }
    if (Game.time % 10 === 5) {
        console.log('road building');
        for (const room of _.values(Game.rooms) as Room[]) {
            const positions = Roads_.roadSites(room);
            positions.forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
        }
    }
}

export function loop(): void {
    console.log('START ticks available:', Game.cpu.tickLimit, Game.cpu.bucket);
    _.forEach(Game.spawns, Spawn_.doSpawn);
    _.forEach(Game.creeps, Creep_.run);

    buildConstructionSites();

    garbageCollect();

    console.log('END   ticks used:', Math.ceil(Game.cpu.getUsed()));
}

// avoid warnings
if (!Game) loop();
