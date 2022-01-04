import {listServers} from "./_util.js"

/** @param {NS} ns **/
export async function main(ns) {

	let servers = listServers(ns, "slave");

	for (const server of servers) {
		await ns.scp(ns.args[0], "home", server.hostname);
	}

}