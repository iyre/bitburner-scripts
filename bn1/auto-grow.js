import * as f from "./_format.js";
import {listServers} from "./_util.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog('ALL');
    const source = ns.getServer(ns.getHostname());
    const targets = listServers(ns, "money");
    const memoryRatio = 0.75; //how close to max memory should we get
    const timingGap = 1; //gap between operations (ms)

    //security impact of worker threads
    const growSecurity = ns.growthAnalyzeSecurity(1); //base 0.004
    const weakenSecurity = ns.weakenAnalyze(1, source.cpuCores); //base 0.05 (reduction)

    //memory usage of worker threads
    const workerMemory = ns.getScriptRam("work.js");

    function prepare(target, growAmount, weakenAmount) {
        let growMultiplier = growAmount / ns.getServerMoneyAvailable(target.hostname) + 1;
        let availableMemory = source.maxRam - ns.getServerUsedRam(source.hostname);

        let wThreadsPre = Math.max(Math.ceil(Math.min(weakenAmount / weakenSecurity), availableMemory / workerMemory ), 1); //threads to weaken to minimum security
        let gThreads = Math.max(Math.ceil(Math.min(ns.growthAnalyze(target.hostname, growMultiplier, source.cpuCores), availableMemory / workerMemory )) + 1, 1); //threads to grow to 100% money
        let wThreadsPost = Math.max(Math.ceil(Math.min(gThreads * growSecurity / weakenSecurity), availableMemory / workerMemory ) + 2, 1); //threads to weaken post-grow

        let requiredMemory = (wThreadsPre + gThreads + wThreadsPost) * workerMemory;
        
        if (requiredMemory / availableMemory > memoryRatio) {
            ns.print(`prep: ${target.hostname}\n  Low memory: ${f.formatBytes(requiredMemory)}/${f.formatBytes(availableMemory)}`);
        }

        let growTime = ns.getGrowTime(target.hostname); //execution time of grow
        let weakenTime = ns.getWeakenTime(target.hostname); //execution time of weaken
        let completeTime = Date.now() + weakenTime + timingGap * 4; //extra timing gap before the start

        try {
            ns.exec("work.js", source.hostname, wThreadsPre, target.hostname, "weaken", completeTime - weakenTime - timingGap * 3);
            ns.exec("work.js", source.hostname, gThreads, target.hostname, "grow", completeTime - growTime - timingGap * 2);
            ns.exec("work.js", source.hostname, wThreadsPost, target.hostname, "weaken", completeTime - weakenTime - timingGap * 1); //smallest "gap" finishes last
        } catch {}
        ns.print(target.hostname, "\n  completion: ", f.formatTime(completeTime), "\n  duration: ", ns.tFormat(completeTime - Date.now()));
    }

    //one-time
    do {
        for (const target of targets) {
            let growAmount = target.moneyMax - ns.getServerMoneyAvailable(target.hostname);
            let weakenAmount = ns.getServerSecurityLevel(target.hostname) - target.minDifficulty;
            // ns.print(target.hostname,
            // 	"  \nmoneyMax ", target.moneyMax,
            // 	"  \nmoneyAvail ", ns.getServerMoneyAvailable(target.hostname),
            // 	"  \nsecMin ", target.minDifficulty,
            // 	"  \nsecNow ", ns.getServerSecurityLevel(target.hostname));
            if (!ns.hasRootAccess(target.hostname)) continue;
            if (growAmount > 0 || weakenAmount > 0) prepare(target, growAmount, weakenAmount);
            targets.splice(targets.indexOf(target.hostname), 1); //remove completed target
        }
        await ns.sleep(10000);
    } while (!ns.args[0] && targets.length > 0);
}