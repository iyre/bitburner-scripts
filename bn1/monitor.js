function pretty(num) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 2
    }).format(num).toLowerCase();
}

/** @param {NS} ns **/
export async function main(ns) {
    var target = ns.args[0];
    var data = Math.round(ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) * 100, 0);
    while (true) {
        ns.toast(`${target}: ${data}%`);
        // ns.tprint(`${target}: ${data}%`);
        await ns.sleep(2500);
    }
}