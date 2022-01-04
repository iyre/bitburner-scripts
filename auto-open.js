import {getServerListHostname} from "./_util.js"

export function crackServer(ns, target) {
	var exploitCount = 0;
	let files = ns.ls("home", ".exe"); //0.20GB
	if (files.includes("BruteSSH.exe")) { ns.brutessh(target); exploitCount++; } //0.05GB
	if (files.includes("FTPCrack.exe")) { ns.ftpcrack(target); exploitCount++; }
	if (files.includes("relaySMTP.exe")) { ns.relaysmtp(target); exploitCount++; }
	if (files.includes("HTTPWorm.exe")) { ns.httpworm(target); exploitCount++; }
	if (files.includes("SQLInject.exe")) { ns.sqlinject(target); exploitCount++; }
	if (ns.getServerNumPortsRequired(target) <= exploitCount) {ns.nuke(target);} //0.10GB, 0.05GB
}

/** @param {NS} ns **/
export async function main(ns) {
	do {
		let servers = getServerListHostname(ns);
		for (const server of servers) {
			if (! ns.hasRootAccess(server)) { //0.05GB
				crackServer(ns, server);
			}
			await ns.scp("work.js", "home", server);
		}
		await ns.sleep(30000);
	} while (!ns.args[0]); //only run once if there are any arguments
}