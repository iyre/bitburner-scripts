import * as f from "./_format.js"

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length < 1) {
		return 0;
	}
	var servers = ns.getPurchasedServers();
	switch (ns.args[0]) {
		case "start":
			var gap = 2000;
			var target = ns.args[1] || "the-hub";
			var startIndex = ns.args[2] || 0;
			var endIndex = ns.args[3] || servers.length - 1;
			for (var i = startIndex; i <= endIndex; i++) {
				let cycleTime = ns.getWeakenTime(target);
				let maxInstances = cycleTime / gap;
				let count = endIndex - startIndex;
				let instances = Math.floor(maxInstances / (count+1));
				let delay = instances * gap;
				ns.run("control.js", 1, target, instances, servers[i]);
				ns.tprint("start: ", servers[i],
					"\n  sleeping: ", ns.tFormat(delay));
				await ns.sleep(delay);
			}
			break;
		case "stop":
			var startIndex = ns.args[1] || 0;
			var endIndex = ns.args[2] || servers.length - 1;
			for (var i = startIndex; i <= endIndex; i++) {
				ns.tprint("stop: ", servers[i]);
				ns.scriptKill("work.js", servers[i]);
			}
			break;
		case "update":
			for (const server of servers) {
				ns.tprint("update: ", server);
				await ns.scp("work.js", server);
			}
			break;
		default:
			ns.tprint("accepts 'start', 'stop', 'update'")
			return 0;
	}
}