/** @param {NS} ns **/
export async function main(ns) {
	ns.tprint(ns.getServer(ns.args[0]).backdoorInstalled);
	await ns.connect(ns.args[0]); //2GB
	await ns.installBackdoor(); //2GB
	await ns.connect("home");
	ns.tprint(ns.getServer(ns.args[0]).backdoorInstalled);
}