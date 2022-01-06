import * as f from "./_format.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.tprint("purchased: " + ns.getPurchasedServers().length + " / " + ns.getPurchasedServerLimit());
    for (var i = 1; i <= ns.getPurchasedServerMaxRam(); i*=2) {
        ns.tprint(
            ("$" + f.formatNumber(ns.getPurchasedServerCost(i), 0)).padStart(8, " "),
            f.formatBytes(i).padStart(8, " "),
            (" [" + i + "] ").padEnd(11, " ")
        );
    }
}