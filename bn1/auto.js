/** @param {NS} ns **/
export async function main(ns) {
    ns.run("auto-open.js");
    ns.run("auto-hacknet.js");
    ns.run("auto-grow.js");
    ns.run("auto-server.js");
    ns.run("control.js", 1, "foodnstuff", 10, "home", 10);
}