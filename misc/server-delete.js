/** @param {NS} ns **/
export async function main(ns) {
    let servers = ns.getPurchasedServers();

    servers.forEach(server => {
        ns.deleteServer(server);
    });
}