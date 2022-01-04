/**
 * Returns an array containing all known servers as objects
 * @param {NS} ns
 * @param {string} [type="money"] Type of servers to include. Valid options include: "all", "slave", "faction", "money"
 * @param {string} [sort="money"] Sort column. Valid options include: "skill", "name", "ram", "money"
 * @returns {[Server]}
**/
export function getServerObjects(ns, type, sort) {
	// let result = [];
	// let visited = {"home": true};
	// let queue = ["home"];
	// let current;
	// while (current = queue.pop()) {
	// 	ns.scan(current).forEach(neighbor => {
	// 		if (!visited[neighbor]) {
	// 			queue.push(neighbor);
	// 			visited[neighbor] = true;
	// 			result.push(ns.getServer(neighbor));
	// 		}
	// 	});
	// }
	let hostnames = getServerHostnames(ns);
	let result = [];
	hostnames.forEach(hostname => { result.push(ns.getServer(hostname)); });

	switch (type) {
		case "all":
			break;
		case "slave":
			result = result.filter(s => s.hasAdminRights && s.maxRam >= 8);
			break;
		case "faction":
			result = result.filter(s => s.hackDifficulty == 0); //faction servers
			break;
		case "money":
		default: //all
			let playerHackingSkill = ns.getHackingLevel();
			result = result.filter(s => s.requiredHackingSkill <= playerHackingSkill);
			result = result.filter(s => !s.purchasedByPlayer);
			result = result.filter(s => s.hackDifficulty > 0); //faction servers
			result = result.filter(s => !["darkweb"].includes(s.hostname)); //special servers
			break;
	}

	let sortProperty;
	switch (sort) {
		case "skill":
			sortProperty = "requiredHackingSkill";
			break;
		case "name":
			sortProperty = "hostname";
			break;
		case "ram":
			sortProperty = "maxRam";
			break;
		case "money":
		default:
			sortProperty = "moneyMax";
			break;
	}
	
	result = result.sort(function(a, b) {
		//descending: a < b = 1
		//ascending:  a > b = 1
		if (a[sortProperty] > b[sortProperty]) { return -1; }
		if (a[sortProperty] < b[sortProperty]) { return 1; }
		return 0;
	});

	return result;
}

/**
 * Returns an array containing hostnames of all known servers
 * @param {NS} ns 
 * @returns {[string]}
**/
export function getServerHostnames(ns) {
	let result = ["home"];
	function probe(newNode) {
		var newNeighbors = ns.scan(newNode);  //0.2GB
		for (const neighbor of newNeighbors) {
			if (result.indexOf(neighbor) === -1) {
				result.push(neighbor);
				probe(neighbor);
			}
		}
	}
	probe("home");

	return result;
}

/**
 * Returns an array describing the total memory capacity of all slave servers on the network 
 * @param {NS} ns 
 * @returns {[max: number, available: number]}
**/
export function getDistributedCapacity(ns) {
	const servers = getServerObjects(ns, "slave", "ram");
	var memoryPoolMax = 0;
	var memoryPoolAvailable = 0;
	servers.forEach(server => {
		memoryPoolMax += server.maxRam;
		memoryPoolAvailable += (server.maxRam - ns.getServerRamUsed(server.hostname));
	});
	return [memoryPoolMax, memoryPoolAvailable];
}


/** 
 * @param {NS} ns 
 * @returns {[{name: string, depth: number, parent: string}]}
**/
export function getNetworkMap(ns) {
	let mapNodeObject = (name = "home", depth = 0, parent = "") => ({ name: name, depth: depth, parent: parent });
	let result = [mapNodeObject()];
	let visited = {"home": 0};
	let queue = ["home"];
	let name;
	while (name = queue.pop()) {
		let depth = visited[name] + 1;
		ns.scan(name).forEach(res => {
			if (!visited.hasOwnProperty(res)) {
				queue.push(res);
				visited[res] = depth;
				result.push(mapNodeObject(res, depth, name));
			}
		});
	}

	result.forEach(node => {
		let next = node.parent;
		let path = [node.name, next];
		for (var d = node.depth; d > 0; d--) {
			next = result.find( ({ name }) => name === next).parent;
			if (next) path.push(next);
		}
		node["path"] = path.reverse();
		// ns.tprint(node.name);
		// ns.tprint("  " + path);
	});

	return result;
}

/** 
 * @param {NS} ns 
 * @returns {number}
**/
export function countOwnedPortTools(ns) {
	let result = 0;
	const portTools = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
	let files = ns.ls("home");
	files.forEach(file => {
		if (portTools.includes(file)) result++;
	});
	return result;
}


/** @param {NS} ns **/
export async function main(ns) {

}