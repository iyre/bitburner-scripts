export function formatBytes(bytes, digits = 2) {
    if (bytes === 0) return '';

    const k = 1024; //offset by 1GB (this game's base unit)
    const sizes = ['GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(digits)) + ' ' + sizes[i];
}

export function formatNumber(num, maxDigits = 2, minDigits = 0) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits
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

export function formatDuration(millis, digits = 0) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(digits);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

/** @param {NS} ns **/
export async function main(ns) {

}