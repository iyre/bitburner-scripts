import {getServerHostnames} from "./_util.js"

/** @param {NS} ns **/
export async function main(ns) {
    let files = ["work.js","hack.js","grow.js","weaken.js"];
    let servers = getServerHostnames(ns);
    if (ns.args[0]) servers = [ns.args[0]];

    for (const server of servers) {
        await ns.scp(files, "home", server);
    }

}