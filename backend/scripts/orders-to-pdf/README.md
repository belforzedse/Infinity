# Orders to PDF

Export orders from **api.infinitycolor.co** (last 34 hours by default) into one PDF per order with full details in Persian.

## How to run

From the repo root:

- **Windows:** `backend\scripts\orders-to-pdf\run.bat`
- **Unix:** `./backend/scripts/orders-to-pdf/run.sh`

The first run creates a Python virtual environment (`.venv`) and installs dependencies. Then you are prompted for credentials and PDFs are written to the output directory.

## Credentials

You can either:

1. **API Token** – Enter your Strapi API token when prompted (or set `INFINITY_API_TOKEN`). The token must have permission to list orders (e.g. from Strapi Admin → Settings → API Tokens).
2. **Phone + password** – Leave API token empty and enter phone and password when prompted (or set `INFINITY_PHONE` and `INFINITY_PASSWORD`). The user must have permission to find orders (e.g. super-admin role).

Optional:

- `INFINITY_API_BASE_URL` – API base URL (default: `https://api.infinitycolor.co`).

## Arguments

Passed to the script after the entrypoint:

- `--hours N` – Export orders from the last N hours (default: 34).
- `--output DIR` – Output directory for PDFs (default: `orders`). Created if it does not exist.
- `--base-url URL` – Override API base URL.

Examples:

```bash
# Windows (default: last 34 hours, output in ./orders)
backend\scripts\orders-to-pdf\run.bat

# Last 48 hours, output to a custom folder
backend\scripts\orders-to-pdf\run.bat --hours 48 --output ./exports
```

## Output

One PDF per order in the output directory. Each file is named:

`order-{order_id}-{YYYY-MM-DD}-{customer_slug}.pdf`

Example: `order-155-2026-02-16-mahdieh-heidari.pdf`. Customer slug is derived from first and last name (ASCII-safe). Each PDF contains: order number, date, status, customer (name, phone), delivery address, shipping method, order items table, shipping cost, discount, total amount, payment gateway, and notes. All labels are in Persian with an RTL-friendly layout.
