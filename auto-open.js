import {getServerHostnames} from "./_util.js"

export function crackServer(ns, target) {
    var exploitCount = 0;
    let files = ns.ls("home", ".exe"); //0.20GB
    if (files.includes("BruteSSH.exe")) { ns.brutessh(target); exploitCount++; } //0.05GB
    if (files.includes("FTPCrack.exe")) { ns.ftpcrack(target); exploitCount++; }
    if (files.includes("relaySMTP.exe")) { ns.relaysmtp(target); exploitCount++; }
    if (files.includes("HTTPWorm.exe")) { ns.httpworm(target); exploitCount++; }
    if (files.includes("SQLInject.exe")) { ns.sqlinject(target); exploitCount++; }
    if (ns.getServerNumPortsRequired(target) <= exploitCount) { ns.nuke(target); return 1; } //0.10GB, 0.05GB
    return 0;
}

/** @param {NS} ns **/
export async function main(ns) {
    let servers = getServerHostnames(ns);
    do {
        for (var i = 0; i < servers.length; i++) {
            ns.print(servers[i], " ", ns.hasRootAccess(servers[i]));
            if (! ns.hasRootAccess(servers[i])) { //0.05GB
                if (crackServer(ns, servers[i])) {
                    ns.run("push.js", 1, servers[i]);
                }
            }
            else {
                servers.splice(i, 1); //remove the cracked server
                i--; //decrement i after splice
            }
        }
        await ns.sleep(10000);
    } while (!ns.args[0] && servers.length > 0); //only run once if there are any arguments
}