import * as f from "./_format.js";
import { getServerObjects, getDistributedCapacity } from "./_util.js";

//usage
//d <target> <max_instances> <home | ""> <take_ratio> <timing_gap>

/**
 * Distributed version of single-host control script.
 * Schedules balanced hack/grow/weaken operations to complete in unison, allowing many cycles to be run concurrently.
 * Can't think of a way to reliably schedule around the execution 
 * Delegates work to any available memory on the network.
 * @param {NS} ns
**/
export async function main(ns) {
    ns.disableLog('ALL');

    let settings = {
        debug: -1,
        target: ns.args[0] || "n00dles",
        useHome: true,
        splitWork: false,
        instances: ns.args[1] || 100,
        moneyRatio: ns.args[2] || 0.25,
        timingGap: 100,
        portNumber: ns.args[3] || 1
    }

    var target, slaves;
    /* somewhat optimal targets (in my opinion)
    001-100: n00dles
    100-200: phantasy
    200-300: omega-net
    300-400: the-hub
    400-???: rho-construction
    */
    
    var limitingFactor = false;
    const memoryRatio = 0.95; //how close to max memory should we get on distributed workers
    const memoryHeadroom = 128; //how much memory should be left available on home
    const bigGap = 500;

    //security impact of worker threads
    const hackSecurity = ns.hackAnalyzeSecurity(1); //base 0.002
    const growSecurity = ns.growthAnalyzeSecurity(1); //base 0.004
    const weakenSecurity = ns.weakenAnalyze(1); //base 0.050 (reduction)

    //memory usage of worker threads
    // const workerMemory = ns.getScriptRam("work.js"); //0.10 GB
    const workerMemory = 1.75;

    async function updateParameters() {
        while (await ns.peek(settings.portNumber) != "NULL PORT DATA") {
            let rawData = await ns.readPort(settings.portNumber);
            let data = rawData.split("=");
            if (data.length == 2) {
                settings[data[0]] = data[1];
            }
            // ns.tprint(data);
            // ns.tprint(settings);
            await ns.sleep(100);
        }
    }

    /**
     * @returns {Promise<void>}
    **/
    async function assignWork(operation, threads, startExecutionTime, instance = "pre") {
        // ns.print(operation, " order: ", threads, " threads");
        var ordersFilled = 0;
        while (threads > 0) {
            for (const slave of slaves) {
                let availableMemory = (slave.hostname == "home" ? slave.maxRam - memoryHeadroom : slave.maxRam * memoryRatio) - ns.getServerUsedRam(slave.hostname);
                let threadCapacity = Math.floor(availableMemory / workerMemory);
                let openThreads = Math.min(threadCapacity, threads);
                // ns.print(target.hostname, ": ", openThreads, "/", threads);
                if ((!settings.splitWork && openThreads == threads && threads > 0) || (settings.splitWork && openThreads > 0)) {
                    // ns.print("  worker: ", slave.hostname, " [", openThreads, "/", threadCapacity, "]");
                    let pid = ns.exec(`${operation}.js`, slave.hostname, openThreads, target.hostname, operation, startExecutionTime, instance, settings.debug);
                    if (pid == 0) {
                        ns.print("failed to assign work");
                        continue;
                    }
                    ordersFilled++;
                    threads -= openThreads;
                }

            }
            // slaves.sort(() => Math.random() - 0.5); //shuffle the array to work around any hangups
            if (threads > 0) {
                await ns.sleep(Math.min(settings.timingGap * threads, 5000));
                ns.print("resubmitting ", operation, " order: ", threads, " threads");
            }
        }
        return ordersFilled;
    }


    /**
     * @param {number} growAmount
     * @param {number} weakenAmount
     * @returns {Promise<void>}
    **/
    async function prepare(growAmount, weakenAmount) {
        ns.tprint("preparing target: ", target.hostname,
            (growAmount > 0 ? " grow" : ""), (weakenAmount > 0 ? " weaken" : "")); //print to terminal as a notification
        ns.print("preparing target:");
        ns.print(`  grow: ${f.formatNumber(growAmount, 2)}  weak: ${f.formatNumber(weakenAmount, 2)}`);
        let growMultiplier = growAmount / ns.getServerMoneyAvailable(target.hostname) + 1;

        let wThreadsPre = Math.ceil(weakenAmount / weakenSecurity) + 1; //threads to weaken to minimum security
        let gThreads = Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier)) + 1; //threads to grow to 100% money (ignore core bonus)
        let wThreadsPost = Math.ceil(gThreads * growSecurity / weakenSecurity) + 1; //threads to weaken post-grow

        let growTime = ns.getGrowTime(target.hostname); //execution duration of grow
        let weakenTime = ns.getWeakenTime(target.hostname); //execution duration of weaken
        let executionTime = Date.now() + weakenTime + settings.timingGap * 4; //time of execution

        await assignWork("weaken", wThreadsPre, executionTime - weakenTime - settings.timingGap * 3);
        await assignWork("grow", gThreads, executionTime - growTime - settings.timingGap * 2);
        await assignWork("weaken", wThreadsPost, executionTime - weakenTime - settings.timingGap * 1); //smallest "gap" finishes last

        ns.print("  completing: ", f.formatTime(executionTime));
        ns.print("  duration: ", ns.tFormat(executionTime - Date.now()));
        // if (! (await ns.prompt("continue after prepare?"))) { ns.exit(); } //abort for testing
        await ns.sleep(executionTime - Date.now() + settings.timingGap);
    }

    while (true) {
        await updateParameters();
        target = ns.getServer(settings.target);
        slaves = getServerObjects(ns, "slave", "ram");
// slaves = []; //testing
        if (settings.useHome) { slaves.push(ns.getServer("home")); }
        
        ns.print("");
        ns.print("begin distributed hacking volley");
        ns.print("  targeting: ", target.hostname);
        ns.print("  parameter port: ", settings.portNumber);
        
        let hackAmount = target.moneyMax * settings.moneyRatio;
        let growMultiplier = hackAmount / (target.moneyMax - hackAmount) + 1;
        let growAmount = target.moneyMax - ns.getServerMoneyAvailable(target.hostname);
        let weakenAmount = ns.getServerSecurityLevel(target.hostname) - target.minDifficulty;

        if (growAmount > 0 || weakenAmount > 0) {
            await prepare(growAmount, weakenAmount);
            await ns.sleep(1000);
            continue;
        }

        let hackTime = ns.getHackTime(target.hostname); //execution time of hack
        let growTime = ns.getGrowTime(target.hostname); //execution time of grow
        let weakenTime = ns.getWeakenTime(target.hostname); //execution time of weaken

        let hThreads = Math.floor(ns.hackAnalyzeThreads(target.hostname, hackAmount)) - 1;
        let wThreadsHack = Math.ceil(hThreads * hackSecurity / weakenSecurity) + 1; //threads to weaken to minimum security
        let gThreads = Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier, 1)) + 1; //threads to grow to 100% money
        let wThreadsGrow = Math.ceil(gThreads * growSecurity / weakenSecurity) + 1; //threads to weaken post-grow
        let workerThreads = hThreads + wThreadsHack + gThreads + wThreadsGrow; //threads required per instance
        let instanceMemory = workerThreads * workerMemory; //memory per instance
        let networkMemory = getDistributedCapacity(ns)[1] * memoryRatio; //total available memory in the network
        //handle memory headroom for "home" differently
        if (ns.args[2] == "home") {
            let homeMemoryAvailable = ns.getServerMaxRam("home") - Math.max(memoryHeadroom, ns.getServerUsedRam("home"));
            networkMemory += homeMemoryAvailable;
        }

        //TODO - adjust settings.moneyRatio dynamically based on memory capacity

        if (networkMemory < instanceMemory) {
            let moneyRatioMin = ns.hackAnalyze(target.hostname) * 25; //25 weaken threads per hack (.05 / .002)
            ns.print("insufficient network memory: ");
            ns.print("  ", f.formatBytes(networkMemory), "/", f.formatBytes(instanceMemory));
            ns.print("lowering money target: ");
            ns.print("  ", (settings.moneyRatio * 100), "% ==> ", (moneyRatioMin * 100).toFixed(3), "%");
            settings.moneyRatio = moneyRatioMin;
            // ns.alert("");
            // ns.exit();
            continue;
        }

        let instanceLimitMemory = Math.floor(networkMemory / instanceMemory); //instance count supported by memory
        let instanceLimitTime = Math.floor(hackTime / (settings.timingGap * 5)); //instance count supported by time
        var instanceLimit = Math.min(settings.instances, instanceLimitMemory, instanceLimitTime);

        switch (instanceLimit) {
            case instanceLimitMemory:
                limitingFactor = "memory-constrained";
                break;
            case instanceLimitTime:
                limitingFactor = "time-constrained";
                break;
            case settings.instances:
            default:
                limitingFactor = false;
        }

        var startedInstances = 0;
        var orders = 0;

        var startExecutionTime = Date.now() + weakenTime + bigGap; //time when first cycle can be executed
        var executionWindow = (instanceLimit - 1) * settings.timingGap * 5; //duration where instances can safely be started
        var endExecutionTime = startExecutionTime + executionWindow; //time when newly started actions will overlap ones being completed - conflict to avoid
        var times = [];
        for (var i = 0; i < instanceLimit; i++) {
            // ns.print("queueing hack instance: ", i);
            let cycleTime = startExecutionTime + i * settings.timingGap * 5;

//debugging timing
            // times.push({ instance: i, operation: "weaken2", type: "start", time: (cycleTime - weakenTime - settings.timingGap * 1) });
            // times.push({ instance: i, operation: "weaken2", type: "end", time: (cycleTime - settings.timingGap * 1) });
            // times.push({ instance: i, operation: "weaken1", type: "start", time: (cycleTime - weakenTime - settings.timingGap * 3) });
            // times.push({ instance: i, operation: "weaken1", type: "end", time: (cycleTime - settings.timingGap * 3) });
            // times.push({ instance: i, operation: "grow", type: "start", time: (cycleTime - growTime - settings.timingGap * 2) });
            // times.push({ instance: i, operation: "grow", type: "end", time: (cycleTime - settings.timingGap * 2) });
            // times.push({ instance: i, operation: "hack", type: "start", time: (cycleTime - hackTime - settings.timingGap * 4) });
            // times.push({ instance: i, operation: "hack", type: "end", time: (cycleTime - settings.timingGap * 4) });

            if (cycleTime > endExecutionTime) {
                ns.print("cycle limit reached");
                ns.print("  ", startedInstances, "/", instanceLimitTime, " instances queued");
                ns.print("  cycleTime: ", f.formatTime(cycleTime));
                break;
            }
            //idea: schedule execution times on a predictable interval which can be avoided when setting new start times.
            orders += await assignWork("hack", hThreads, cycleTime - hackTime - settings.timingGap * 4, i);
            orders += await assignWork("weaken", wThreadsHack, cycleTime - weakenTime - settings.timingGap * 3, i);
            orders += await assignWork("grow", gThreads, cycleTime - growTime - settings.timingGap * 2, i);
            orders += await assignWork("weaken", wThreadsGrow, cycleTime - weakenTime - settings.timingGap * 1, i);
            // ns.print("cycle: ", f.formatTime(cycleTime), " end: ", f.formatTime(endExecutionTime));
            startedInstances++;
            await ns.sleep(10);
        }

//debugging timing
        // times = times.sort(function (a, b) {
        //     //descending: a < b = 1
        //     //ascending:  a > b = 1
        //     if (a["time"] < b["time"]) { return -1; }
        //     if (a["time"] > b["time"]) { return 1; }
        //     return 0;
        // });
//debugging timing
        // ns.tprint("d-control log");
        // for (var i = 0; i < Math.min(times.length, 100); i++) {
        //     let color = "SUCCESS";
        //     if (times[i].type == "end") { color = "WARN"; }
        //     ns.tprintf(`${color.padEnd(7, " ")} ${target.hostname} ${("" + times[i].instance).padStart(3)} ${times[i].operation.padEnd(7)} ${parseInt(times[i].time)}`);
        // }

        if (startedInstances > 0) {
            ns.print("all orders queued. awaiting completion.",
                (limitingFactor ? ("\n  " + limitingFactor) : ""),
                "\n  instances: ", startedInstances, "/", settings.instances,
                "  orders: ", orders,
                "\n  ram: ", f.formatBytes(instanceMemory * startedInstances),
                "  threads: ", Math.floor(workerThreads * startedInstances),
                "\n  completing: ", f.formatTime(endExecutionTime),
                "\n  duration: ", ns.tFormat(endExecutionTime - Date.now()));
            await ns.sleep(endExecutionTime - Date.now() + bigGap);
        }
        else {
            ns.print("no instances could be started.  sleeping for 30 seconds.")
            await ns.sleep(30000);
        }
        // ns.exit(); //testing
    }
}

export function autocomplete(data, args) {
    return [...data.servers];
}