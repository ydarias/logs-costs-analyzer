import Papa from "papaparse";

/**
 * Normalise a CSV header to snake_case for fuzzy matching.
 * @param {string} h
 * @returns {string}
 */
function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/[\s_\-]+/g, "_");
}

/**
 * Find the first header that matches one of the candidate names.
 * Matching is done on normalised (snake_case) versions of both sides.
 *
 * @param {string[]} headers   - Raw headers from the CSV
 * @param {string[]} candidates - Normalised names to try, in priority order
 * @returns {string|null}
 */
function detectColumn(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(c);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Parse a Data Usage CSV exported from IBM Cloud Logs
 * (Settings → Data Usage → Export as CSV).
 *
 * The function is tolerant of column-name variations produced by different
 * UI versions and Coralogix back-end exports.
 *
 * @param {string} text - Raw CSV text
 * @returns {Array<{
 *   application: string,
 *   subsystem:   string,
 *   gb:          number,
 *   units:       number,
 *   priority:    string,
 *   date:        string|null
 * }>}
 */
export function parseUsageCSV(text) {
  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (!result.data.length) return [];

  const headers = Object.keys(result.data[0]);

  const appCol   = detectColumn(headers, ["application", "application_name", "applicationname", "app"]);
  const subCol   = detectColumn(headers, ["subsystem", "subsystem_name", "subsystemname"]);
  const gbCol    = detectColumn(headers, ["gb", "gb_sent", "data_gb", "sent_gb", "bytes_gb", "gigabytes"]);
  const unitCol  = detectColumn(headers, ["units", "units_used", "unit"]);
  const prioCol  = detectColumn(headers, ["priority", "tier", "tco_priority", "priority_class"]);
  const dateCol  = detectColumn(headers, ["date", "day", "timestamp", "period"]);

  return result.data.map((row) => ({
    application: (appCol ? row[appCol] : "Unknown") ?? "Unknown",
    subsystem:   (subCol ? row[subCol] : "")        ?? "",
    gb:          parseFloat(gbCol   ? row[gbCol]   : 0) || 0,
    units:       parseFloat(unitCol ? row[unitCol] : 0) || 0,
    priority:    ((prioCol ? row[prioCol] : "HIGH") ?? "HIGH").toString().toUpperCase(),
    date:        dateCol ? row[dateCol] : null,
  }));
}
