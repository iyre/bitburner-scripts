/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('ALL');
	let node = ns.hacknet.numNodes();
	let maxNodes = ns.hacknet.maxNumNodes();
	let delay = 100;
	function outfitNode(n) {
		ns.hacknet.upgradeLevel(n, 200);
		ns.hacknet.upgradeRam(n, 64);
		ns.hacknet.upgradeCore(n, 16);
		ns.print(`outfitted note ${n}`)
	}

	for (var i = 0; i < node; i++) outfitNode(i);

	while (node < maxNodes) {
		for (var i = 0; i < node; i++) outfitNode(i);
		//spend no more than 25% on a single hacknet server
		if (ns.hacknet.getPurchaseNodeCost() < ns.getServerMoneyAvailable("home") * 0.10) {
			node = ns.hacknet.purchaseNode();
			outfitNode(node);
		} else delay = 10000;

		await ns.sleep(delay);
	}
}