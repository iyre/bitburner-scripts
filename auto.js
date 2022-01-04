/** @param {NS} ns **/
export async function main(ns) {
    ns.run("auto-open.js");
    // ns.run("auto-hacknet.js");
    ns.run("auto-grow.js");
    ns.run("auto-server.js", 10, 64);
    ns.run("d-control.js", 1, "n00dles", 10);
}