export function garbageCollect() {
    // Clear all times other than the current one
    const current = _.get(Memory.timer, Game.time, {});
    Memory.timer = {};
    Memory.timer[Game.time] = current;
}

export function startTimer() {
    Memory.timer = Memory.timer || {};
    // get the timeList for the current game tick.
    // if we are the first timer, then return a default list
    let timeList = Memory.timer[Game.time] || [];
    timeList.push(Game.cpu.getUsed());
    Memory.timer[Game.time] = timeList;
    // return our index into time list for later access
    return timeList.length - 1;
}

export function elaspedTime(handle: any) {
    let timeList = Memory.timer[Game.time] || [];
    if (!_.has(timeList, handle)) {
        throw new Error('Bad handle ' + handle);
    }
    console.log(Game.cpu.getUsed(), timeList[handle]);
    return Game.cpu.getUsed() - timeList[handle];
}
