import {mapNetwork} from "./_util.js"

/* faction servers
    CSEC			cybersec
    avmnite-02h		nitesec
    I.I.I.I			the black hand
    .				the dark army
    run4theh111z	bitrunners
    The-Cave		daedalus
    w0r1d_d43m0n
*/

/** @param {NS} ns **/
export async function main(ns, t) {
    let network = mapNetwork(ns);

    network.forEach(node => {
        let next = node.parent;
        let path = next + "/" + node.name;
        for (var d = node.depth; d > 0; d--) {
            next = network.find( ({ name }) => name === next).parent;
            path = next + '/' + path;
        }
        node["path"] = path;
        // ns.tprint(node.name);
        // ns.tprint("  " + path);
    });

    network.sort(function(a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
    });

    if (ns.args.length > 0) {
        let c = ns.args[0] || t;
        ns.tprint(network.find( ({ name }) => name === c).path);
    }
    else {
        network.forEach(node => {
            ns.tprint(node.name);
            ns.tprint("  " + node.path);
        });
    }
}

export function autocomplete(data, args) {
    return [...data.servers];
}