# Live Import Dashboard

A beautiful, real-time web interface for monitoring and managing WooCommerce data imports to Strapi.

## Features

✨ **Live Dashboard**
- Real-time import progress tracking
- Live log streaming with color-coded messages
- Beautiful dark mode UI (responsive)

🎮 **Full Import Control**
- Start/Stop/Pause imports from the UI
- Configure import settings (limit, page, categories, keywords)
- Dry-run mode preview
- Multiple import types: Categories, Products, Variations, Orders, Users

📊 **Monitoring & Analytics**
- Real-time progress bars
- Import statistics (total, success, failed, skipped)
- Current item being processed display
- Estimated time remaining

📋 **Historical Records**
- View all past imports
- Compare import statistics
- Re-run previous imports
- Export import reports

## Installation

### 1. Install Dependencies

```bash
cd infinity-backend
npm install
```

### 2. First Time Setup

The dashboard is included, just make sure you have:
- Node.js 18+ installed
- npm 6+ installed
- Port 3001 available (or set `DASHBOARD_PORT` env var)

## Usage

### Start the Live Dashboard

```bash
npm run import:dashboard
```

This will:
1. Start the Express server on `http://localhost:3001`
2. Automatically open your browser
3. Show the CLI menu for import configuration

### Command Line Menu

Once running, you'll see a menu:

```
📋 WooCommerce Importer - Main Menu

1️⃣  Import Categories
2️⃣  Import Products
3️⃣  Import Variations
4️⃣  Import Orders
5️⃣  Import Users
9️⃣  Exit
```

Select an option and configure your import:

```
🔧 Configure PRODUCTS Import

Number of items to import (default: 50): 100
Starting page (default: 1): 1
Dry run mode? (y/n, default: y): n
Filter by category IDs? (comma-separated, or leave blank): 5,12,18
Filter by name keywords? (comma-separated, e.g. "کیف,کفش", or leave blank): کیف,کفش,کتونی
```

### Dashboard Features

#### Main Dashboard Tab
- **Stats Cards**: Total, Success, Failed, Skipped counts
- **Progress Bar**: Visual progress indicator
- **Configuration Form**: Adjust settings and start new imports
- **Live Log**: Color-coded log stream (auto-scrolls)

#### History Tab
- View all past imports
- See import statistics
- Compare performance across runs
- Quick view of duration and counts

## Configuration

### Environment Variables

```bash
# Default port is 3001, override with:
DASHBOARD_PORT=4000
```

### Customize Dashboard

Edit `public/index.html` to modify:
- Colors and styling (Tailwind CSS)
- Dashboard features
- UI layout

## API Endpoints

The dashboard server exposes these endpoints:

```
GET  /api/health              # Health check
GET  /api/events              # SSE stream for real-time updates
GET  /api/history             # Get import history
GET  /api/info                # Server info
POST /api/import/start        # Start an import
POST /api/import/stop         # Stop current import
GET  /                        # Dashboard UI
```

## Event Streaming

Real-time updates use Server-Sent Events (SSE). The client connects to `/api/events` and receives:

```javascript
{
  type: "progress",
  stats: { total: 42, success: 40, failed: 1, skipped: 1 },
  processing: "Product name here",
  current: 42,
  total: 100,
  timestamp: "2025-10-30T09:45:50.053Z"
}
```

## Troubleshooting

### Dashboard doesn't open in browser
Manually visit: `http://localhost:3001`

### Port already in use
```bash
DASHBOARD_PORT=4000 npm run import:dashboard
```

### Logs not appearing in real-time
- Check browser console (F12) for connection errors
- Verify no firewall is blocking localhost:3001

### Import not starting
- Check browser console for errors
- Verify Strapi and WooCommerce APIs are accessible
- Check the terminal output for detailed error messages

## Development

### Architecture

```
dashboard/
├── server.js                      # Express server + SSE
├── event-wrapper.js               # Logger wrapper for events
├── interactive-with-dashboard.js  # CLI entry point
├── public/
│   └── index.html                # Full UI (single HTML file)
└── README.md                      # This file
```

### No Build Step Required!

The dashboard uses:
- **Vanilla JavaScript** (no npm build)
- **Tailwind CSS** (CDN)
- **Server-Sent Events** (native browser API)

This means:
- ✅ No npm run build needed
- ✅ Changes to `public/index.html` are instant
- ✅ No webpack/babel/complex tooling

## Performance

The dashboard is optimized for:
- Low latency (SSE vs WebSocket)
- Large log streams (500+ entries, auto-cleaned)
- Responsive UI (60fps animations)
- Minimal CPU usage (zero polling, event-driven)

## Security Notes

⚠️ **Important**: The dashboard server should only be used locally during development.

For production:
- Don't expose port 3001 to the internet
- Use in development/staging environments only
- Consider adding authentication if needed

## Future Enhancements

Possible additions:
- [ ] Product mapping viewer
- [ ] Error retry UI
- [ ] Download reports as CSV/JSON
- [ ] Webhook integrations
- [ ] Email notifications on completion
- [ ] Dark/Light theme toggle
- [ ] Mobile app support

## Support

For issues, check:
1. Browser console (F12) for errors
2. Terminal output for detailed logs
3. Port availability (`lsof -i :3001` on Mac/Linux)
4. Node.js version (requires 18+)

---

**Built with ❤️ for smooth imports**
