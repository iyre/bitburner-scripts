import {mapNetwork} from "./_util.js";

/** @param {NS} ns **/
export async function main(ns) {
    let network = mapNetwork(ns);

    async function copyAllTextFiles() {
        for (var i = 0; i < network.length; i++) {
            let files = ns.ls(network[i].name);
            ns.tprint(network[i].name, " ", files.length);
            for (var j = 0; j < files.length; j++) {
                ns.tprint(files[j]);
                if (files[j].match(/(.lit)|(.txt)/i)) await ns.scp(files[j], network[i].name, "home");
            }
        }
    }

    function findContracts() {
        for (var i = 0; i < network.length; i++) {
            let files = ns.ls(network[i].name, ".cct"); //use grep string to find contract files
            for (var j = 0; j < files.length; j++) {
                ns.tprint(network[i].name, " ", files[j]);
            }
        }
    }

    switch (ns.args[0]) {
        case "contract":
            findContracts();
            break;
        case "lore":
            await copyAllTextFiles();
            break
        default:
            break
    }
}