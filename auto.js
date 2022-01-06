/** @param {NS} ns **/
export async function main(ns) {
    ns.run("auto-open.js");
    ns.run("auto-darkweb.js", 1, 1);
    // ns.run("auto-hacknet.js");
    // ns.run("auto-prepare.js");
    ns.run("auto-server.js", 1, 10, 1024, .30); //buy early servers
    ns.run("auto-server.js", 1, "", 32768, 1); //buy bigger servers later
    ns.run("d-control.js", 1, "foodnstuff", 100, "home", 0.10);
}