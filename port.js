/** @param {NS} ns **/
export async function main(ns) {
    var [port, data] = ns.args;

    await ns.writePort(port, data);
}