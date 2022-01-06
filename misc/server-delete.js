/** @param {NS} ns **/
export async function main(ns) {
    let servers = ns.getPurchasedServers();
    let start = ns.args[0] || 0;
    let end = Math.min(ns.args[1], (servers.length - 1));

    for (var i = start; i <= end; i++) {
        ns.deleteServer(servers[i]);
        ns.tprintf(`INFO--deleted server: ${servers[i]}`);
    }
}