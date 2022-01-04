//thanks to https://github.com/Baizey for this cool idea.
//minimal ram hack, grow, weaken all in one script

/** @param {NS} ns **/
export async function main(ns) {
    const [target, method, time] = ns.args;

    if (time) await ns.sleep(time - Date.now());

    await ns[method](`${target}`);
}

//this part is necessary to get the correct static memory value.
//otherwise, calling this script with "exec" won't accurately calculate memory and you'll get an error
/** @param {NS} ns **/
async function staticMemoryWorkaround(ns) {
    await ns.weaken("");
}