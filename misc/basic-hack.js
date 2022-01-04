/** @param {NS} ns **/
export async function main(ns) {
	var target = ns.args[0];
	var minSecLevel = ns.args[1];
	var maxMoney = ns.args[2];
	
	//continously weaken/grow/hack the target server
	while (true) {
		var threshSecLevel = minSecLevel + 5;
		var threshMoney = maxMoney * 0.75;
		ns.print(threshSecLevel); //0GB
		if (ns.getServerSecurityLevel(target) > threshSecLevel) {
			await ns.weaken(target);} //0.15GB
		else if (ns.getServerMoneyAvailable(target) < threshMoney) {
			await ns.grow(target);} //0.15GB
		else {
			await ns.hack(target);} //0.1GB
		await ns.sleep(1000); //0GB
	}
}