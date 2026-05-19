# IBM Cloud Logs — Cost Correlator

A browser-based dashboard that correlates **IBM Cloud Logs data-usage CSV exports** with your monthly IBM Cloud invoice, giving you a per-application and per-subsystem cost breakdown with no backend required.

---

## Why this exists

IBM Cloud Logs bills at the account level (one line item on the invoice). The service's built-in Data Usage Analyzer shows ingestion by application and subsystem, but doesn't attach dollar amounts. This tool bridges the gap: upload your CSV exports, enter the invoice total, and instantly see which teams or services are driving the bill.

---

## How it works

IBM Cloud Logs (powered by the Coralogix engine) charges by **billing units**, not raw GB. Each TCO priority tier carries a different unit multiplier:

| Priority | Units per GB | Use case              |
|----------|--------------|-----------------------|
| HIGH     | 0.75         | Frequent search       |
| MEDIUM   | 0.32         | Monitoring            |
| LOW      | 0.12         | Compliance / archive  |
| BLOCK    | 0.065        | Blocked / dropped     |
| METRICS  | ~0.033       | Metrics pipeline      |

Cost is prorated by billing units:

```
app_cost = (app_units / total_units) × invoice_cost
```

This matches the weighting the platform applies internally, so the allocation is as accurate as possible without direct API access to invoice line items.

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (or pnpm / yarn)

### Install and run

```bash
git clone https://github.com/your-org/ibm-logs-cost-correlator.git
cd ibm-logs-cost-correlator
npm install
npm run dev          # opens http://localhost:3000
```

### Build for production

```bash
npm run build        # output in dist/
npm run preview      # serve the production build locally
```

---

## Exporting the CSV from IBM Cloud Logs

1. Open your IBM Cloud Logs instance.
2. Go to **Settings → Data Usage**.
3. Click **Export as CSV**.
4. Select report type: **Detailed Data Usage Report**.
5. Choose a time range (Current Month / Last 30 days / Last 90 days).
6. Click **Export**.

You can export multiple months and drop all files at once — the app merges them automatically.

### Expected CSV columns

The parser is tolerant of column-name variations. It looks for these fields (in order of preference):

| Field       | Accepted column names                                  |
|-------------|--------------------------------------------------------|
| Application | `application`, `application_name`, `applicationname`, `app` |
| Subsystem   | `subsystem`, `subsystem_name`, `subsystemname`         |
| GB sent     | `gb`, `gb_sent`, `data_gb`, `sent_gb`, `bytes_gb`, `gigabytes` |
| Units       | `units`, `units_used`, `unit`                          |
| Priority    | `priority`, `tier`, `tco_priority`, `priority_class`   |
| Date        | `date`, `day`, `timestamp`, `period` *(optional)*      |

A sample CSV is available at [`data/samples/april-2025-usage.csv`](data/samples/april-2025-usage.csv).

---

## Project structure

```
ibm-logs-cost-correlator/
├── src/
│   ├── App.jsx                  # Root component — layout and state
│   ├── main.jsx                 # React entry point
│   ├── components/
│   │   ├── DropZone.jsx         # CSV drag-and-drop / file picker
│   │   ├── Primitives.jsx       # Card, Pill, Stat, ChartTip
│   │   └── Tabs.jsx             # OverviewTab, ByAppTab, PriorityTab, TimelineTab
│   ├── hooks/
│   │   └── useSummary.js        # useSummary, usePriorityBreakdown, useTimeSeries
│   └── lib/
│       ├── csvParser.js         # CSV parsing and column detection
│       ├── format.js            # fmt, fmtUSD, fmtGB helpers
│       └── theme.js             # THEME tokens, PRIORITY_COLORS, UNIT_WEIGHTS
├── data/
│   └── samples/                 # Example CSVs for testing (real exports go here)
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
├── CLAUDE.md                    # Claude Code instructions
└── README.md
```

---

## Dashboard tabs

| Tab      | What it shows                                                    |
|----------|------------------------------------------------------------------|
| Overview | GB bar chart, priority pie chart, full cost-allocation table     |
| By App   | Per-application (or subsystem) cards with priority breakdowns    |
| Priority | GB and units by tier, unit-multiplier detail table               |
| Timeline | Daily GB and units trend lines *(only shown when CSV has dates)* |

---

## All data stays in your browser

No data is uploaded to any server. CSV parsing and all calculations run entirely in the browser via [PapaParse](https://www.papaparse.com/) and React.

---

## Tech stack

| Library    | Purpose                        |
|------------|--------------------------------|
| React 18   | UI framework                   |
| Vite 5     | Dev server and bundler         |
| Recharts   | Bar, pie, and line charts      |
| PapaParse  | CSV parsing                    |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Run `npm run lint` and `npm run format` before committing.
3. Open a pull request describing the change and the problem it solves.

---

## License

MIT
