/** @param {NS} ns **/
export async function main(ns) {
    while (true) {
        var servers = ["home"];
        
        function probe(newNode) {
            //ns.tprint("node: " + newNode); //0GB
            var newNeighbors = ns.scan(newNode);  //0.2GB
            for (const neighbor of newNeighbors) {
                if (servers.indexOf(neighbor) === -1) {
                    servers.push(neighbor);
                    probe(neighbor);
                }
            }
        }
        probe("home");

        for (const server of servers) {
            if (! ns.hasRootAccess(server)) { //0.05GB
                //fileExists: 0.1GB
                //exploit: 0.05GB
                var exploitCount = 0;
                if (ns.fileExists("BruteSSH.exe", "home")) {ns.brutessh(server);exploitCount++;}
                if (ns.fileExists("FTPCrack.exe", "home")) {ns.ftpcrack(server);exploitCount++;}
                if (ns.fileExists("relaySMTP.exe", "home")) {ns.relaysmtp(server);exploitCount++;}
                if (ns.fileExists("HTTPWorm.exe", "home")) {ns.httpworm(server);exploitCount++;}
                if (ns.fileExists("SQLInject.exe", "home")) {ns.sqlinject(server);exploitCount++;}
                if (ns.getServerNumPortsRequired(server) <= exploitCount) {ns.nuke(server);} //0.1GB
                //skip if still no root
                if (ns.hasRootAccess(server)) { //0.05GB
                    ns.tprint(server);
                    ns.run("auto.js", 1, server); //1GB
                }
            }
        }
        await ns.sleep(30000);
    }
}