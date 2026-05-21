/**
 * Format a number to `d` decimal places, or return "—" for non-numbers.
 * @param {*}      n
 * @param {number} [d=2]
 */
export const fmt = (n, d = 2) =>
  typeof n === "number" ? n.toFixed(d) : "—";

/**
 * Format a number as a USD dollar amount with 4 decimal places.
 * @param {number} n
 */
export const fmtUSD = (n) => "$" + fmt(n, 2);

/**
 * Format a number as gigabytes with 3 decimal places.
 * @param {number} n
 */
export const fmtGB = (n) => fmt(n, 2) + " GB";
