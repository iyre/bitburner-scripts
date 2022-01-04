/** @param {NS} ns **/
export async function main(ns) {
	let limit = ns.getPurchasedServerLimit(); //0.05GB
	let quantity = ns.args[0] || limit;
	let owned = ns.getPurchasedServers().length; //2.25GB
	let ram = ns.args[1] || ns.getPurchasedServerMaxRam(); //1 petabyte
	let cost = ns.getPurchasedServerCost(ram);
	let budget = ns.args[2] || 0.20;

	while (owned < limit && quantity > 0) {
		var money = ns.getServerMoneyAvailable("home");
		money = Math.floor(money);
		//dont spend more than 25% of total money on a single server
		if (money * 0.10 > cost) { //0.1GB + 0.25GB
			var server = ns.purchaseServer("home-" + String(owned).padStart(2, "0"), ram); //2.25GB
			await ns.scp("work.js", 'home', server);
			owned++;
			quantity--;
			ns.tprint("purchased server: " + server); //0GB
		} else {
			ns.print("need: " + Math.floor(cost - money * budget));
		}
		await ns.sleep(5000);
	}
}