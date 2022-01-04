import {listServers} from "./_util.js"
import * as f from "./_format.js"

export function countPortTools(ns) {
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
    var playerHackingSkill = ns.getHackingLevel();
    var servers = listServers(ns);

    var sortProperty = "requiredHackingSkill"; //moneyMax, requiredHackingSkill
    function compare(a, b) {
        //descending: a < b = 1
        //ascending:  a > b = 1
        if (a[sortProperty] > b[sortProperty]) {return -1;}
        if (a[sortProperty] < b[sortProperty]) {return 1;}
        return 0;
    }
    servers = servers.sort(compare);

    if (ns.args.length > 0) {
        if (ns.args[0] == "all") ;
        else servers = servers.filter(s => ns.args.includes(s.hostname));
    } else {
        servers = servers.filter(s => s.requiredHackingSkill <= playerHackingSkill);
        servers = servers.filter(s => !s.purchasedByPlayer);
        servers = servers.filter(s => s.hackDifficulty > 0); //faction servers
        servers = servers.filter(s => !["darkweb"].includes(s.hostname)); //special servers
    }

    function pretty(num) {
        return Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(num).toLowerCase();
    }

    ns.tprint(
        "hostname".padEnd(20, " "), 
        "skill".padEnd(7, " "),
        "ram".padEnd(7, " "), 
        "moneyAva".padEnd(9, " "), 
        "moneyMax".padEnd(9, " "), 
        "moneyPer".padEnd(9, " "), 
        "grow".padEnd(5, " "), 
        "security".padEnd(9, " "),
        "ports".padEnd(4, " ")
    );
    for (const server of servers) {
        ns.tprint(
            server.hostname.padEnd(20, " "),
            server.requiredHackingSkill.toString().padEnd(7, " "),
            f.formatBytes(server.maxRam).padEnd(7, " "),
            pretty(server.moneyAvailable).padEnd(9, " "),
            pretty(server.moneyMax).padEnd(9, " "),
            Math.floor(server.moneyAvailable / server.moneyMax * 100).toString().padEnd(9, " "),
            pretty(server.serverGrowth).padEnd(5, " "),
            server.hackDifficulty.toFixed(1).toString().padStart(4, " "),
            ("(" + pretty(server.minDifficulty) + ")").padEnd(5, " "),
            server.openPortCount, "/", server.numOpenPortsRequired
        );

    }
}

export function autocomplete(data, args) {
    return [...data.servers];
}