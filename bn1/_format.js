export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0';

    const k = 1024; //offset by 1GB (this game's base unit)
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num, digits = 3) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: digits
    }).format(num).toLowerCase();
}

export function formatTime(time, digits = 3) {
    return Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: digits,
        hour12: false
    }).format(time)
}

/** @param {NS} ns **/
export async function main(ns) {

}