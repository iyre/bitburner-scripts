import {getServerListHostname} from "./_util.js";

/** @param {NS} ns **/
export async function main(ns) {
    let network = getServerListHostname(ns);

    async function copyAllTextFiles() {
        for (var i = 0; i < network.length; i++) {
            let files = ns.ls(network[i]);
            for (var j = 0; j < files.length; j++) {
                ns.tprint(network[i], "/", files[j]);
                if (files[j].match(/(.lit)|(.txt)/i)) await ns.scp(files[j], network[i], "home");
            }
        }
    }

    function findContracts() {
        for (var i = 0; i < network.length; i++) {
            let files = ns.ls(network[i], ".cct"); //use grep string to find contract files
            for (var j = 0; j < files.length; j++) {
                ns.tprint(network[i], "/", files[j]);
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