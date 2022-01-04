/** @param {NS} ns 
 * @returns {[]}
**/
export function listServers(ns, type) {
    let playerHackingSkill = ns.getHackingLevel();
    let result = [];
    let visited = {"home": true};
    let queue = ["home"];
    let current;
    while (current = queue.pop()) {
        ns.scan(current).forEach(neighbor => {
            if (!visited[neighbor]) {
                queue.push(neighbor);
                visited[neighbor] = true;
                result.push(ns.getServer(neighbor));
            }
        });
    }

    switch (type) {
        case "money":
            result = result.filter(s => s.requiredHackingSkill <= playerHackingSkill);
            result = result.filter(s => !s.purchasedByPlayer);
            result = result.filter(s => s.hackDifficulty > 0); //faction servers
            result = result.filter(s => !["darkweb"].includes(s.hostname)); //special servers
            break;
        case "slave":
            result = result.filter(s => s.hasAdminRights && s.maxRam >= 8);
            break;
        case "faction":
            result = result.filter(s => s.hackDifficulty == 0); //faction servers
            break;
        default:
            break;
    }

    return result;
}

/** @param {NS} ns 
 * @returns {[]}
**/
export function mapNetwork(ns) {
    let asObj = (name = "home", depth = 0, parent = "") => ({ name: name, depth: depth, parent: parent });
    let result = [asObj()];
    let visited = {"home": 0};
    let queue = ["home"];
    let name;
    while (name = queue.pop()) {
        let depth = visited[name] + 1;
        ns.scan(name).forEach(res => {
            if (!visited.hasOwnProperty(res)) {
                queue.push(res);
                visited[res] = depth;
                result.push(asObj(res, depth, name));
            }
        });
    }
    return result;
}

/** @param {NS} ns **/
export async function main(ns) {

}