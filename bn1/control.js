import * as f from "./_format.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('ALL');
	const source = ns.getServer(ns.args[2] || ns.getHostname());
	const target = ns.getServer(ns.args[0] || "foodnstuff"); //host to attack
	/* somewhat optimal targets (in my opinion)
	001-100: foodnstuff
	100-208: phantasy
	208-311: omega-net
	208-411: the-hub
	411-???: rho-construction
	*/
	const instances = ns.args[1] || 10; //how to distribute weakening power
	const memoryRatio = 0.95; //how close to max memory should we get
	const moneyRatio = 0.75; //ratio of available money to hack
	const timingGap = 5; //gap between operations (ms)
	const cycleDuration = timingGap * 5;
	var bigGap = ns.args[3] || 500;

	//security impact of worker threads
	const hackSecurity = ns.hackAnalyzeSecurity(1); //base 0.002
	const growSecurity = ns.growthAnalyzeSecurity(1); //base 0.004
	const weakenSecurity = ns.weakenAnalyze(1, source.cpuCores); //base 0.05 (reduction)

	//memory usage of worker threads
	const workerMemory = ns.getScriptRam("work.js");
	var workerThreads = 0;

	var completeTime = 0; //store completion time of latest order

	var cycles = 0;
	var preps = 0;

	/**
	 * @returns {Promise<void>}
	**/
	async function prepare(growAmount, weakenAmount) {
		ns.print(`queueing prep: ${target.hostname} grow: ${growAmount} weak: ${weakenAmount}`);
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
		completeTime = Math.max(completeTime, Date.now()) + weakenTime + timingGap * 4; //extra timing gap before the start

		try {
			ns.exec("work.js", source.hostname, wThreadsPre, target.hostname, "weaken", completeTime - weakenTime - timingGap * 3);
			ns.exec("work.js", source.hostname, gThreads, target.hostname, "grow", completeTime - growTime - timingGap * 2);
			ns.exec("work.js", source.hostname, wThreadsPost, target.hostname, "weaken", completeTime - weakenTime - timingGap * 1); //smallest "gap" finishes last
		} catch {}
		// ns.print(f.formatTime(completeTime), "\n  duration: ", ns.tFormat(completeTime - Date.now()));
		preps++
		await ns.sleep(completeTime - Date.now() + timingGap);
	}

	while (true) {
		let hackAmount = target.moneyMax * moneyRatio;
		let growMultiplier = hackAmount / (target.moneyMax - hackAmount) + 1;
		let growAmount = target.moneyMax - ns.getServerMoneyAvailable(target.hostname);
		let weakenAmount = ns.getServerSecurityLevel(target.hostname) - target.minDifficulty;

		if (growAmount > 0 || weakenAmount > 0) {
			await prepare(growAmount, weakenAmount);
			continue;
		}

		let hThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target.hostname, hackAmount)) -2, 1);
		let wThreadsHack = Math.max(Math.ceil(hThreads * hackSecurity / weakenSecurity), 1); //threads to weaken to minimum security
		let gThreads = Math.max(Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier, source.cpuCores)) + 2, 2); //threads to grow to 100% money (extra thread for insurance)
		let wThreadsGrow = Math.max(Math.ceil(gThreads * growSecurity / weakenSecurity) + 2, 3); //threads to weaken post-grow
		workerThreads = hThreads + wThreadsHack + gThreads + wThreadsGrow;
		let requiredMemory = workerThreads * workerMemory;

		let hackTime = ns.getHackTime(target.hostname); //execution time of hack
		let growTime = ns.getGrowTime(target.hostname); //execution time of grow
		let weakenTime = ns.getWeakenTime(target.hostname); //execution time of weaken

		let instanceLimit = Math.floor(hackTime / (timingGap * 5));

		var startTime = Date.now() + weakenTime + bigGap; //time when first cycle can be completed
		var endTime = startTime + hackTime; //point when newly started actions will overlap actions being completed - conflict
		for (var i = 0; i < instances; i++) {
			//ns.print("queueing hack: ", target.hostname);

			let availableMemory = source.maxRam - ns.getServerUsedRam(source.hostname);
			if (requiredMemory / availableMemory > memoryRatio) {
				ns.print(`unable to hack/grow: ${target.hostname}\n  insufficient memory: ${f.formatBytes(requiredMemory)}/${f.formatBytes(availableMemory)}`);
				break;
			}

			let cycleTime = startTime + i * timingGap * 5;
			if (cycleTime + bigGap > endTime) {
				ns.print("cycle limit reached",
					"\n  ", i, "/", instanceLimit, " instances queued",
					"\n  cycle: ", f.formatTime(cycleTime), " end: ", f.formatTime(endTime));
				break;
			}

			ns.exec("work.js", source.hostname, hThreads, target.hostname, "hack", cycleTime - hackTime - timingGap * 4);
			ns.exec("work.js", source.hostname, wThreadsHack, target.hostname, "weaken", cycleTime - weakenTime - timingGap * 3);
			ns.exec("work.js", source.hostname, gThreads, target.hostname, "grow", cycleTime - growTime - timingGap * 2);
			ns.exec("work.js", source.hostname, wThreadsGrow, target.hostname, "weaken", cycleTime - weakenTime - timingGap * 1);
			// ns.print("cycle: ", f.formatTime(cycleTime), " end: ", f.formatTime(endTime));
			await ns.sleep(timingGap);
		}
		cycles++;
		ns.print(source.hostname, " -> ", target.hostname,
			"\n  completing: ", f.formatTime(endTime),
			"\n  duration: ", ns.tFormat(endTime - Date.now()),
			"\n  reliability: ", cycles, "/", preps + cycles, "(", (Math.min(1, cycles / preps + cycles) * 100).toFixed(2), "%)");
		await ns.sleep(endTime - Date.now() + bigGap * 2);
	}
}

export function autocomplete(data, args) {
    return [...data.servers];
}