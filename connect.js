import {getNetworkMap} from "./_util.js"

/** @param {NS} ns **/
export async function main(ns) {
	let hostname = ns.args[1] || "The-Cave";
	let host = getNetworkMap(ns).find( ({name}) => name === hostname);

	for (const node of host.path) {
		await ns.connect(node); //singularity 1
	};
	if (ns.args[0] == "b") {
		await ns.installBackdoor(); //2GB
		await ns.connect("home");
	}
}

export function autocomplete(data, args) {
    return [...data.servers];
}