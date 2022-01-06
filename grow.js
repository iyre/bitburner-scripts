/** @param {NS} ns **/
export async function main(ns) {
    const [target, method, time, instance, debug] = ns.args;

    if (debug > 1) ns.tprintf(`INFO    ${target} ${(""+instance).padStart(3, " ")} ${method.padEnd(7, " ")} ${parseInt(time)} ${parseInt(Date.now())}`);

    if (time) await ns.sleep(time - Date.now());

    if (debug > 0) ns.tprintf(`SUCCESS ${target} ${(""+instance).padStart(3, " ")} ${method.padEnd(7, " ")} ${parseInt(time)} ${parseInt(Date.now())}`);

    await ns.grow(target);

    if (debug >= 0) ns.tprintf(`WARN    ${target} ${(""+instance).padStart(3, " ")} ${method.padEnd(7, " ")} ${parseInt(time)} ${parseInt(Date.now())}`);
}