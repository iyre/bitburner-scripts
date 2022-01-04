/** @param {NS} ns **/
export async function main(ns) {
	var scriptName = "hack.ns";
	var scriptRam = ns.getScriptRam(scriptName); //0.1GB
	
	//hard coded target
	//"n00dles","joesguns","nectar-net"

	var target = "nectar-net";
	if (ns.args.length > 0) {
		target = ns.args[0];
	}
	var targetMinSec = ns.getServerMinSecurityLevel(target); //0.1GB
	var targetMaxMoney = ns.getServerMaxMoney(target); //0.1GB

	var servers = ["home"];
	
	function probe(newNode) {
		//ns.tprint("node: " + newNode); //0GB
		var newNeighbors = ns.scan(newNode);  //0.2GB
		for (const neighbor of newNeighbors) {
			if (servers.indexOf(neighbor) === -1) {
				servers.push(neighbor);
				probe(neighbor);
			}
		}
	}
	probe("home");

	for (const server of servers) {
		var serverMaxRam = ns.getServerMaxRam(server); //0.05GB
		var threads = Math.floor(serverMaxRam / scriptRam);

		if (! ns.hasRootAccess(server)) { //0.05GB
			//fileExists: 0.1GB
			//exploit: 0.05GB
			var exploitCount = 0;
			if (ns.fileExists("BruteSSH.exe", "home")) {ns.brutessh(server);exploitCount++;}
			if (ns.fileExists("FTPCrack.exe", "home")) {ns.ftpcrack(server);exploitCount++;}
			if (ns.fileExists("relaySMTP.exe", "home")) {ns.relaysmtp(server);exploitCount++;}
			if (ns.fileExists("HTTPWorm.exe", "home")) {ns.httpworm(server);exploitCount++;}
			if (ns.fileExists("SQLInject.exe", "home")) {ns.sqlinject(server);exploitCount++;}
			if (ns.getServerNumPortsRequired(server) <= exploitCount) {ns.nuke(server);} //0.1GB
		}

		//skip if still no root
		if (! ns.hasRootAccess(server)) {continue;} //0.05GB

		//skip setup on low-ram machines
		if (serverMaxRam < scriptRam) {continue;}

		await ns.scp(scriptName, server); //0.6GB

		if (server == "home") {
			//dont kill other scripts and leave some headroom on home
			ns.scriptKill(scriptName, server); //1GB
			threads = Math.floor((serverMaxRam - ns.getServerUsedRam(server) * 2) / scriptRam); //0.05GB
		} else {ns.killall(server);} //0.5GB
		ns.exec(scriptName, server, threads, target, targetMinSec, targetMaxMoney); //1.3GB
		ns.tprint(server + " [" + threads + "]"); //0GB
	}
	//await ns.sleep(60000000);
}