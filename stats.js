import * as f from "./_format.js"
import { getServerObjects, getDistributedCapacity } from "./_util.js"

/** @param {NS} ns **/
export function outputBasicStatistics(ns, servers) {

    //use tprintf to leave out the script name
    ns.tprintf("| hostname           | skill | ram    | money                  | grow | security   | ports |");
    ns.tprintf("|--------------------|-------|--------|------------------------|------|------------|-------|");
  //ns.tprint("| abcdefghizklmnopqr |  9999 | 999 GB | 999.9m / 999.9m (100%) |   99 | 99.99 (99) |   5/5 |"); //testing

    for (var i = 0; i < servers.length; i++) {
        let row = "| ";
            row += servers[i].hostname.padEnd(18, " ") + " | ";
            row += servers[i].requiredHackingSkill.toString().padStart(5, " ") + " | ";
            row += f.formatBytes(servers[i].maxRam, 0).padStart(6, " ") + " | ";
            if (servers[i].moneyMax > 0) {
                row += f.formatNumber(servers[i].moneyAvailable, 1, 1).padStart(6, " ") + " / ";
                row += f.formatNumber(servers[i].moneyMax, 1, 1).padStart(6, " ") + " ";
                row += ("(" + (Math.floor(servers[i].moneyAvailable / servers[i].moneyMax * 100) || 0) + "%%)").padStart(7, " ") + " | ";  //double % to escape with sprintf
            }
            else { row += " ".repeat(22) + " | "; }
            row += f.formatNumber(servers[i].serverGrowth).padStart(4, " ") + " | ";
            row += servers[i].hackDifficulty.toFixed(2).toString().padStart(5, " ") + " ";
            row += ("(" + f.formatNumber(servers[i].minDifficulty, 1) + ")").padStart(4, " ") + " | ";
            row += (servers[i].openPortCount + "/" + servers[i].numOpenPortsRequired).padStart(5, " ") + " | ";
        ns.tprintf(row);
    }
}

export function outputDetailedStatistics(ns, server, moneyTakeFraction = 0.25) {
    const threads = 1;
    const cores = 1;
    const moneyReserveFraction = 1 - moneyTakeFraction;
    const workerMemory = 1.75;

    let hackAmount = Math.max(0, server.moneyAvailable - server.moneyMax * moneyReserveFraction);
    let growAmount = server.moneyMax - server.moneyAvailable;
    let growMultiplierPrep = growAmount / server.moneyAvailable + 1;
    let growMultiplierHack = hackAmount / (server.moneyAvailable - hackAmount) + 1;
    let security = server.hackDifficulty - server.minDifficulty;
    let hackTime = ns.getHackTime(server.hostname); //execution time of hack
    let growTime = ns.getGrowTime(server.hostname); //execution time of grow
    let weakenTime = ns.getWeakenTime(server.hostname); //execution time of weak
    let hackAnalyze = ns.hackAnalyze(server.hostname); //percent stolen per thread
    let hackAnalyzeChance = ns.hackAnalyzeChance(server.hostname); //chance of success
    let hackAnalyzeThreads = Math.ceil(ns.hackAnalyzeThreads(server.hostname, hackAmount)); //threads needed to hack specified amount
    let growthAnalyzeThreadsPrep = Math.ceil(ns.growthAnalyze(server.hostname, growMultiplierPrep, cores)); //threads needed to reach growth multiplier
    let growthAnalyzeThreadsHack = Math.ceil(ns.growthAnalyze(server.hostname, growMultiplierHack, cores)); //threads needed to reach growth multiplier
    let adjGrowth = Math.min(server.serverGrowth, (server.serverGrowth / server.hackDifficulty)) / 100;
    let hackSecurity = ns.hackAnalyzeSecurity(threads); //security increase (constant 0.002 per thread)
    let growthSecurity = ns.growthAnalyzeSecurity(threads); //security increase (constant 0.004 per thread)
    let weakenSecurity = ns.weakenAnalyze(threads, cores); //security decrease (constant 0.05 per thread)
    let weakenThreadsPrep1 = Math.ceil(security / weakenSecurity);
    let weakenThreadsPrep2 = Math.ceil(growthAnalyzeThreadsPrep * growthSecurity / weakenSecurity);
    let weakenThreadsHack = Math.ceil(hackAnalyzeThreads * hackSecurity / weakenSecurity);
    let weakenThreadsGrow = Math.ceil(growthAnalyzeThreadsHack * growthSecurity / weakenSecurity);
    let totalThreadsPrepCycle = weakenThreadsPrep1 + growthAnalyzeThreadsPrep + weakenThreadsPrep2; 
    let totalThreadsHackCycle = hackAnalyzeThreads + weakenThreadsHack + growthAnalyzeThreadsHack + weakenThreadsGrow;

    ns.tprintf("");
    ns.tprintf("operation timing:");
    ns.tprintf(`  hackTime: ${f.formatDuration(hackTime, 3)}`);
    ns.tprintf(`  growTime: ${f.formatDuration(growTime, 3)}`);
    ns.tprintf(`  weakTime: ${f.formatDuration(weakenTime, 3)}`);
    ns.tprintf("");
    ns.tprintf("operation effects:");
    ns.tprintf(`  hack chance:  ${(hackAnalyzeChance * 100).toFixed(2)}%%`); //double % to escape with sprintf
    ns.tprintf(`  hack effect:  ${(hackAnalyze * 100).toFixed(2)}%% (+${hackSecurity})`);
    ns.tprintf(`  grow effect:  ${(adjGrowth * 100).toFixed(2)}%% (+${growthSecurity})`);
    ns.tprintf(`  weak effect: -${(weakenSecurity).toFixed(3)}`);
    ns.tprintf("");
    ns.tprintf("prepare cycle:");
    ns.tprintf(`  weaken1: -${(growthAnalyzeThreadsPrep * growthSecurity).toFixed(3)} [${weakenThreadsPrep1}]`);
    ns.tprintf(`  grow:     ${growMultiplierPrep.toFixed(2)}x [${Math.ceil(growthAnalyzeThreadsPrep)}]`);
    ns.tprintf(`  weaken2: -${(growthAnalyzeThreadsPrep * growthSecurity).toFixed(3)} [${weakenThreadsPrep2}]`);
    ns.tprintf(`  total:    ${f.formatBytes(totalThreadsPrepCycle * workerMemory)} [${totalThreadsPrepCycle}]`);
    ns.tprintf("");
    //uses the current money & security values - not necessarily optimal
    ns.tprintf("hack cycle:");
    ns.tprintf(`  hack:    \$${f.formatNumber(hackAmount)} (${f.formatNumber(hackAmount / server.moneyAvailable * 100)}%%) [${hackAnalyzeThreads}]`);
    ns.tprintf(`  weaken1: -${(hackAnalyzeThreads * hackSecurity).toFixed(3)} [${weakenThreadsHack}]`);
    ns.tprintf(`  grow:     ${growMultiplierHack.toFixed(2)}x [${Math.ceil(growthAnalyzeThreadsHack)}]`);
    ns.tprintf(`  weaken2: -${(growthAnalyzeThreadsHack * growthSecurity).toFixed(3)} [${weakenThreadsGrow}]`);
    ns.tprintf(`  total:    ${f.formatBytes(totalThreadsHackCycle * workerMemory)} [${totalThreadsHackCycle}]`);
    ns.tprintf("");
}

/** @param {NS} ns **/
export async function main(ns) {
    var servers;
    switch (ns.args[0]) {
        case undefined:
        case "all":
        case "faction":
        case "hack":
        case "slave":
            servers = getServerObjects(ns, ns.args[0], ns.args[1]);
            outputBasicStatistics(ns, servers);
            break;
        default:
            if (ns.serverExists(ns.args[0])) {
                let moneyTakeFraction = ns.args[1] || 0.25;

                servers = [ns.getServer(ns.args[0])];
                outputBasicStatistics(ns, servers);
                outputDetailedStatistics(ns, servers[0], moneyTakeFraction);
            }
            else {
                ns.tprint("Invalid filter (hostname / type)\n  'all','faction',*'hack','slave',<hostname>")
            }
            break;
    }
}

export function autocomplete(data, args) {
    return [...data.servers, "all", "faction", "slave"];
}