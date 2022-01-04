import * as f from "./_format.js"
import {getServerObjects} from "./_util.js"

/** @param {NS} ns **/
export function outputBasicStatistics(ns, servers) {
	ns.tprint(
		"hostname".padEnd(20, " "), 
		"skill".padEnd(7, " "),
		"ram".padEnd(7, " "), 
		"moneyAva".padEnd(9, " "), 
		"moneyMax".padEnd(9, " "), 
		"moneyPer".padEnd(9, " "), 
		"grow".padEnd(5, " "), 
		"security".padEnd(9, " "),
		"ports".padEnd(4, " ")
	);
	for (var i = 0; i < servers.length; i++) {
		ns.tprint(
			servers[i].hostname.padEnd(20, " "),
			servers[i].requiredHackingSkill.toString().padEnd(7, " "),
			f.formatBytes(servers[i].maxRam).padEnd(7, " "),
			f.formatNumber(servers[i].moneyAvailable, 1).padEnd(9, " "),
			f.formatNumber(servers[i].moneyMax, 1).padEnd(9, " "),
			Math.floor(servers[i].moneyAvailable / servers[i].moneyMax * 100).toString().padEnd(9, " "),
			f.formatNumber(servers[i].serverGrowth, 1).padEnd(5, " "),
			servers[i].hackDifficulty.toFixed(1).toString().padStart(4, " "),
			("(" + f.formatNumber(servers[i].minDifficulty, 1) + ")").padEnd(5, " "),
			servers[i].openPortCount, "/", servers[i].numOpenPortsRequired
		);
	}
}

export function outputDetailedStatistics(ns, server) {
	const threads = 1;
	const cores = 1;
	const moneyReserve = 0.75;

	let hackAmount = Math.max(0, server.moneyAvailable - server.moneyMax * moneyReserve);
	let growAmount = server.moneyMax - server.moneyAvailable;
	let growMultiplier = growAmount / server.moneyAvailable + 1;
	let security = server.hackDifficulty - server.minDifficult;
	let hackTime = ns.getHackTime(server.hostname); //execution time of hack
	let growTime = ns.getGrowTime(server.hostname); //execution time of grow
	let weakenTime = ns.getWeakenTime(server.hostname); //execution time of weak
	let hackAnalyze = ns.hackAnalyze(server.hostname); //percent stolen per thread
	let hackAnalyzeChance = ns.hackAnalyzeChance(server.hostname); //chance of success
	let hackAnalyzeThreads = ns.hackAnalyzeThreads(server.hostname, hackAmount);
	let growthAnalyze = ns.growthAnalyze(server.hostname, growMultiplier, cores); //threads needed to reach growth multiplier
	let adjGrowth = Math.min(server.serverGrowth, (server.serverGrowth / server.hackDifficulty)) / 100;
	let hackSecurity = ns.hackAnalyzeSecurity(threads); //security increase (constant 0.002 per thread)
	let growthSecurity = ns.growthAnalyzeSecurity(threads); //security increase (constant 0.004 per thread)
	let weakenSecurity = ns.weakenAnalyze(threads, cores); //security decrease (constant 0.05 per thread)

	ns.tprint(" ");
	ns.tprint("hackTime: ", f.formatDuration(hackTime, 3));
	ns.tprint("growTime: ", f.formatDuration(growTime, 3));
	ns.tprint("weakTime: ", f.formatDuration(weakenTime, 3));
	ns.tprint(" ",);
	ns.tprint(`hackChance: ${(hackAnalyzeChance * 100).toFixed(2)}%`);
	ns.tprint(`hackPower: ${(hackAnalyze * 100).toFixed(2)}% (+${hackSecurity})`);
	ns.tprint(`growPower: ${(adjGrowth * 100).toFixed(2)}% (+${growthSecurity})`);
	ns.tprint(`weakPower: -${(weakenSecurity).toFixed(3)}`);
	ns.tprint(" ",);
	ns.tprint(`hackCalc: \$${f.formatNumber(hackAmount)}(${Math.round(hackAmount / server.moneyAvailable * 100, 0)}%) [${Math.ceil(hackAnalyzeThreads)}]`);
	ns.tprint(`growCalc: ${growMultiplier.toFixed(2)}x [${Math.ceil(growthAnalyze)}]`);
	ns.tprint(`weakCalc: -${f.formatNumber(security)} [${Math.ceil(security / weakenSecurity)}]`);
}

/** @param {NS} ns **/
export async function main(ns) {
	var servers;
	switch (ns.args[0]) {
		case undefined:
		case "slave":
		case "all":
			servers = getServerObjects(ns, ns.args[0], ns.args[1]);
			outputBasicStatistics(ns, servers);
			break;
		default:
			servers = [ns.getServer(ns.args[0])];
			outputBasicStatistics(ns, servers);
			outputDetailedStatistics(ns, servers[0]);
			break;
	}
}

export function autocomplete(data, args) {
    return [...data.servers];
}