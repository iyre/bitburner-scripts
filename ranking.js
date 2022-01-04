/** @param {NS} ns **/
export async function main(ns) {
    //calculate timing/scheduling of hack/grow operations
    let h = ns.formulas.hacking;
    let server = ns.getServer("rothman-uni");
    let player = ns.getPlayer();

    ns.tprint(h.weakenTime(server, player));
    server.moneyAvailable = server.moneyMax;
    server.hackDifficulty = server.minDifficulty;
    ns.tprint(h.weakenTime(server, player));


    function calculateProfitability() {
        //money per second per thread
    }
}