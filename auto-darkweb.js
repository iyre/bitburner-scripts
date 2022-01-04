/** @param {NS} ns **/
export async function main(ns) {
    const budget = ns.args[0] || 0.10; //spend no more than this (percentage of total money)
    const programs = [
        // { name: "ServerProfiler.exe", price: 500000},
        // { name: "DeepscanV1.exe", price: 500000},
        // { name: "DeepscanV2.exe", price: 25000000},
        // { name: "AutoLink.exe", price: 1000000},
        // { name: "Formulas.exe", price: 5000000000},
        { name: "BruteSSH.exe", price: 500000},
        { name: "FTPCrack.exe", price: 1500000},
        { name: "relaySMTP.exe", price: 5000000},
        { name: "HTTPWorm.exe", price: 30000000},
        { name: "SQLInject.exe", price: 250000000}];
    do {
        const tor = ns.serverExists("darkweb");
        if (!tor) ns.purchaseTor();
        programs.forEach(program => {
            let money = ns.getServerMoneyAvailable("home");
            if (money * budget < program.price)	ns.purchaseProgram(program.name);
        });
        await ns.sleep(10000);
    } while (!ns.args[0]);
}