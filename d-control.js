import * as f from "./_format.js";
import {getServerObjects, getDistributedCapacity} from "./_util.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('ALL');
	var slaves;
	const source = ns.getServer("home");
	const target = ns.getServer(ns.args[0] || "n00dles"); //host to attack
	/* somewhat optimal targets (in my opinion)
	001-100: n00dles
	100-200: phantasy
	200-300: omega-net
	300-400: the-hub
	400-???: rho-construction
	*/
	const instances = ns.args[1] || 100; //how to distribute weakening power
	const memoryRatio = 1; //how close to max memory should we get
	const moneyRatio = 0.10; //ratio of available money to hack
	const timingGap = 100; //gap between operations (ms)
	const bigGap = 500;

	//security impact of worker threads
	const hackSecurity = ns.hackAnalyzeSecurity(1); //base 0.002
	const growSecurity = ns.growthAnalyzeSecurity(1); //base 0.004
	const weakenSecurity = ns.weakenAnalyze(1, source.cpuCores); //base 0.05 (reduction)

	//memory usage of worker threads
	const workerMemory = 1.75;
	var workerThreads = 0;
	var completeTime = 0; //store completion time of latest order

	/**
	 * @returns {Promise<void>}
	**/
	async function assignWork(operation, threads, startTime) {
		let a = getDistributedCapacity()
		ns.print(operation, " order: ", threads, " threads");
		do {
			for (const slave of slaves) {
				let availableMemory = slave.maxRam - ns.getServerUsedRam(slave.hostname);
				let threadCapacity = Math.floor(availableMemory / workerMemory);
				let openThreads = Math.min(threadCapacity, threads);
				if (openThreads > 0) {
					ns.print("  worker: ", slave.hostname, " [", openThreads, "/", threadCapacity, "]");
					try {
						ns.exec("work.js", slave.hostname, openThreads, target.hostname, operation, startTime);
					} catch { continue; }
					threads -= openThreads;
				}
				await ns.sleep(timingGap);
			}
			slaves.sort(() => Math.random() - 0.5); //shuffle the array to work around any hangups
			await ns.sleep(Math.min(timingGap * threads, 5000));
			if (threads > 0) ns.print("resubmitting ", operation," order: ", threads, " threads")
		} while (threads > 0);
	}


	/**
	 * @returns {Promise<void>}
	**/
	async function prepare(growAmount, weakenAmount) {
		ns.tprint(`queueing prep: ${target.hostname} grow: ${growAmount} weak: ${weakenAmount}`);
		let growMultiplier = growAmount / ns.getServerMoneyAvailable(target.hostname) + 1;

		let wThreadsPre = Math.max(Math.ceil(weakenAmount / weakenSecurity), 1); //threads to weaken to minimum security
		let gThreads = Math.max(Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier, source.cpuCores)), 1); //threads to grow to 100% money
		let wThreadsPost = Math.max(Math.ceil(gThreads * growSecurity / weakenSecurity), 1); //threads to weaken post-grow

		let growTime = ns.getGrowTime(target.hostname); //execution time of grow
		let weakenTime = ns.getWeakenTime(target.hostname); //execution time of weaken
		completeTime = Math.max(completeTime, Date.now()) + weakenTime + timingGap * 4; //extra timing gap before the start

		await assignWork("weaken", wThreadsPre, completeTime - weakenTime - timingGap * 3);
		await assignWork("grow", gThreads, completeTime - growTime - timingGap * 2);
		await assignWork("weaken", wThreadsPost, completeTime - weakenTime - timingGap * 1); //smallest "gap" finishes last

		// ns.print(f.formatTime(completeTime), "\n  duration: ", ns.tFormat(completeTime - Date.now()));
		await ns.sleep(completeTime - Date.now() + timingGap);
	}

	while (true) {
		slaves = getServerObjects(ns, "slave");
		if (ns.args[2] == "home") slaves.push(source);
		let hackAmount = target.moneyMax * moneyRatio;
		let growMultiplier = hackAmount / (target.moneyMax - hackAmount) + 1;
		let growAmount = target.moneyMax - ns.getServerMoneyAvailable(target.hostname);
		let weakenAmount = ns.getServerSecurityLevel(target.hostname) - target.minDifficulty;

		if (growAmount > 0 || weakenAmount > 0) {
			await prepare(growAmount, weakenAmount);
			continue;
		}

		let hThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target.hostname, hackAmount)), 1);
		let wThreadsHack = Math.max(Math.ceil(hThreads * hackSecurity / weakenSecurity), 1); //threads to weaken to minimum security
		let gThreads = Math.max(Math.ceil(ns.growthAnalyze(target.hostname, growMultiplier, 1)), 2); //threads to grow to 100% money
		let wThreadsGrow = Math.max(Math.ceil(gThreads * growSecurity / weakenSecurity), 3); //threads to weaken post-grow
		workerThreads = hThreads + wThreadsHack + gThreads + wThreadsGrow;

		let hackTime = ns.getHackTime(target.hostname); //execution time of hack
		let growTime = ns.getGrowTime(target.hostname); //execution time of grow
		let weakenTime = ns.getWeakenTime(target.hostname); //execution time of weaken

		let instanceLimit = Math.floor(hackTime / (timingGap * 5));

		var startTime = Date.now() + weakenTime + bigGap; //time when first cycle can be completed
		var endTime = startTime + hackTime; //point when newly started actions will overlap actions being completed - conflict
		for (var i = 0; i < instances; i++) {
			//ns.print("queueing hack: ", target.hostname);

			let cycleTime = startTime + i * timingGap * 5;
			if (cycleTime + bigGap > endTime) {
				ns.print("cycle limit reached",
					"\n  ", i, "/", instanceLimit, " instances queued",
					"\n  cycle: ", f.formatTime(cycleTime), " end: ", f.formatTime(endTime));
				break;
			}

			await assignWork("hack", hThreads, cycleTime - hackTime - timingGap * 4);
			await assignWork("weaken", wThreadsHack, cycleTime - weakenTime - timingGap * 3);
			await assignWork("grow", gThreads, cycleTime - growTime - timingGap * 2);
			await assignWork("weaken", wThreadsGrow, cycleTime - weakenTime - timingGap * 1);
			// ns.print("cycle: ", f.formatTime(cycleTime), " end: ", f.formatTime(endTime));
			await ns.sleep(timingGap);
		}
		
		ns.print(source.hostname, " -> ", target.hostname,
			"\n  completing: ", f.formatTime(endTime),
			"\n  duration: ", ns.tFormat(endTime - Date.now()));
		await ns.sleep(endTime - Date.now() + bigGap * 2);
	}
}

export function autocomplete(data, args) {
    return [...data.servers];
}