# IBM Cloud Logs — Cost Correlator

React + Vite SPA that correlates IBM Cloud Logs data-usage CSV exports with monthly invoice costs. No backend. All logic runs in the browser.

## Key conventions

- **State lives only in App.jsx.** Components receive data as props; hooks receive raw state.
- **Cost input is `type="text"` with `inputMode="decimal"`**, not `type="number"`. This avoids a browser bug where `onChange` silently swallows events for partial numeric strings (e.g. `"1."`), which breaks controlled React state.
- **`useMemo` deps use `totalCost` (the string), not the derived `cost` number.** `Number("100.") === Number("100")`, so using the derived number as a dep would skip recomputes on partial input.
- **PRIORITY_COLORS is keyed by `p.name`**, not `p.priority`. Grouped objects carry a `name` field; there is no `priority` field on them.
- **Cost allocation formula:** `app_cost = (app_units / total_units) × invoice_cost`. Uses units, not raw GB, because IBM Cloud Logs charges by TCO-weighted units.

## TCO unit weights (do not change without verifying against IBM docs)

| Priority | Units/GB |
|----------|----------|
| HIGH     | 0.75     |
| MEDIUM   | 0.32     |
| LOW      | 0.12     |
| BLOCK    | 0.065    |
| METRICS  | 1/30     |

## CSV format

The parser (`src/lib/csvParser.js`) is tolerant of column-name variations. It normalises headers to `snake_case` and tries multiple candidate names per field. When adding new candidate names, add them to the `detectColumn` call arrays in `parseUsageCSV`, not as special cases in the map loop.

## Adding a new tab

1. Add the tab component to `src/components/Tabs.jsx`.
2. Add the tab key to the `TABS` array in `App.jsx`.
3. Add the `{tab === "your_tab" && <YourTab ... />}` block in the tab-content section of `App.jsx`.
4. If it needs new derived data, add a hook to `src/hooks/useSummary.js` and import it in `App.jsx`.

## What to avoid

- Do not introduce a backend or any network calls — the whole value proposition is local processing.
- Do not add `type="number"` inputs for cost or any numeric field (see key conventions above).
- Do not put business logic in components — keep it in hooks or lib files.
- Do not change `UNIT_WEIGHTS` values without a reference to updated IBM Cloud Logs pricing documentation.

## Dashboard tabs

| Tab      | What it shows                                                    |
|----------|------------------------------------------------------------------|
| Overview | GB bar chart, priority pie chart, full cost-allocation table     |
| By App   | Per-application (or subsystem) cards with priority breakdowns    |
| Priority | GB and units by tier, unit-multiplier detail table               |
| Timeline | Daily GB and units trend lines *(only shown when CSV has dates)* |
