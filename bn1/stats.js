/** @param {NS} ns **/
export async function main(ns) {
    var hostname = ns.args[0];
    var playerHackingSkill = ns.getHackingLevel();
    const threads = 1;
    const cores = 4;
    const moneyReserve = 0.75;

    function pretty(num) {
        return Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 2
        }).format(num).toLowerCase();
    }
    function prettyTime(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    function report(hostname) {
        var server = ns.getServer(hostname);
        var hackAmount = Math.max(0, server.moneyAvailable - server.moneyMax * moneyReserve);
        var growAmount = server.moneyMax - server.moneyAvailable;
        var growMultiplier = growAmount / server.moneyAvailable + 1;
        var security = server.hackDifficulty - server.minDifficulty;

        var hackTime = ns.getHackTime(hostname); //execution time of hack
        var growTime = ns.getGrowTime(hostname); //execution time of grow
        var weakenTime = ns.getWeakenTime(hostname); //execution time of weaken

        var hackAnalyze = ns.hackAnalyze(hostname); //percent stolen per thread
        var hackAnalyzeChance = ns.hackAnalyzeChance(hostname); //chance of success
        var hackAnalyzeThreads = ns.hackAnalyzeThreads(hostname, hackAmount);

        var growthAnalyze = ns.growthAnalyze(hostname, growMultiplier, cores); //threads needed to reach growth multiplier
        var adjGrowth = Math.min(server.serverGrowth, (server.serverGrowth / server.hackDifficulty)) / 100;

        var hackSecurity = ns.hackAnalyzeSecurity(threads); //security increase (constant 0.002 per thread)
        var growthSecurity = ns.growthAnalyzeSecurity(threads); //security increase (constant 0.004 per thread)
        var weakenSecurity = ns.weakenAnalyze(threads, cores); //security decrease (constant 0.05 per thread)

        ns.tprint(
            "hostname".padEnd(20, " "),
            "skill".padEnd(7, " "),
            "moneyAva".padEnd(9, " "),
            "moneyMax".padEnd(9, " "),
            "moneyPer".padEnd(9, " "),
            "grow".padEnd(5, " "),
            "security".padEnd(9, " ")
        );

        ns.tprint(
            server.hostname.padEnd(20, " "),
            server.requiredHackingSkill.toString().padEnd(7, " "),
            pretty(server.moneyAvailable).padEnd(9, " "),
            pretty(server.moneyMax).padEnd(9, " "),
            Math.floor(server.moneyAvailable / server.moneyMax * 100).toString().padEnd(9, " "),
            pretty(server.serverGrowth).padEnd(5, " "),
            server.hackDifficulty.toFixed(3).toString().padStart(5, " "),
            ("(" + server.minDifficulty + ")").padEnd(5, " ")
        );

        ns.tprint(" ");
        ns.tprint("hackTime: ", prettyTime(hackTime));
        ns.tprint("growTime: ", prettyTime(growTime));
        ns.tprint("weakTime: ", prettyTime(weakenTime));
        ns.tprint(" ",);
        ns.tprint(`hackChance: ${(hackAnalyzeChance * 100).toFixed(2)}%`);
        ns.tprint(`hackPower: ${(hackAnalyze * 100).toFixed(2)}% (+${hackSecurity})`);
        ns.tprint(`growPower: ${(adjGrowth * 100).toFixed(2)}% (+${growthSecurity})`);
        ns.tprint(`weakPower: -${(weakenSecurity).toFixed(3)}`);
        ns.tprint(" ",);
        ns.tprint(`hackCalc: \$${pretty(hackAmount)}(${Math.round(hackAmount / server.moneyAvailable * 100, 0)}%) [${Math.ceil(hackAnalyzeThreads)}]`);
        ns.tprint(`growCalc: ${growMultiplier.toFixed(2)}x [${Math.ceil(growthAnalyze)}]`);
        ns.tprint(`weakCalc: -${pretty(security)} [${Math.ceil(security / weakenSecurity)}]`);

    }

    report(hostname);
}

export function autocomplete(data, args) {
    return [...data.servers];
}