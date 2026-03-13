# RSS Reader (RSSR)

A modern RSS/Atom Reader built with Rust, featuring both a command-line interface (CLI) and a beautiful web UI.

## Features

- 📰 **RSS/Atom Feed Management**: Add, update, and delete RSS and Atom feeds
- 🔄 **Automatic Format Detection**: Automatically detects and parses both RSS and Atom feed formats
- 📖 **Article Reading**: Browse articles from all your feeds
- ✅ **Read/Unread Status**: Mark articles as read or unread
- 🎨 **Modern Web UI**: Beautiful, responsive web interface
- 💻 **CLI Interface**: Full-featured command-line interface
- 💾 **SQLite Storage**: Local database for feeds and articles

## Installation

### Prerequisites

- Rust 1.70+ and Cargo
- SQLite (usually included with Rust toolchain)

### Build from Source

```bash
git clone <repository-url>
cd rssr
cargo build --release
```

The binary will be located at `target/release/rssr`.

## Usage

### CLI Commands

#### Add a Feed (RSS or Atom)
```bash
# RSS feed
rssr add https://example.com/feed.xml

# Atom feed
rssr add https://example.com/atom.xml
```

#### List All Feeds
```bash
rssr list
```

#### Read Articles
```bash
# Read all articles
rssr read

# Read articles from a specific feed
rssr read 1

# Read only unread articles
rssr read --unread
```

#### Update Feeds
```bash
# Update all feeds
rssr update

# Update a specific feed
rssr update 1
```

#### Mark Article as Read/Unread
```bash
# Mark as read (default)
rssr mark 5

# Mark as unread
rssr mark 5 --unread
```

#### Delete a Feed
```bash
rssr delete 1
```

#### Start Web UI Server
```bash
# Start on default port 8080
rssr serve

# Start on custom port
rssr serve --port 3000
```

Then open `http://localhost:8080` in your browser.

### Web UI

The web UI provides a modern, user-friendly interface for managing your RSS feeds:

1. **Add Feeds**: Enter a feed URL in the input box and click "Add Feed"
2. **View Feeds**: All your feeds are displayed in cards
3. **Select Feed**: Click on a feed card to view its articles
4. **Filter Articles**: Use "All" or "Unread Only" buttons to filter articles
5. **Mark as Read**: Click "Mark as Read/Unread" on any article
6. **Update Feeds**: Click "Update" on a feed card or "Update All" to refresh all feeds
7. **Delete Feeds**: Click "Delete" on a feed card to remove it

## Project Structure

```
rssr/
├── src/
│   ├── main.rs      # Entry point
│   ├── cli.rs       # CLI command handling
│   ├── web.rs       # Web server and API routes
│   ├── feed.rs      # RSS feed fetching and parsing
│   ├── storage.rs   # Database operations
│   └── models.rs    # Data models
├── static/
│   └── index.html   # Web UI frontend
├── Cargo.toml       # Dependencies
└── README.md        # This file
```

## Database

The application uses SQLite to store feeds and articles. The database file (`rssr.db`) is created automatically in the current directory when you first run the application.

## API Endpoints

The web server exposes the following REST API endpoints:

- `GET /api/feeds` - Get all feeds
- `POST /api/feeds` - Add a new feed
- `DELETE /api/feeds/:id` - Delete a feed
- `POST /api/feeds/:id/update` - Update a feed
- `GET /api/articles` - Get articles (supports `feed_id` and `unread_only` query params)
- `POST /api/articles/:id/read` - Mark article as read/unread (supports `read` query param)
- `GET /api/stats` - Get feed statistics

## Examples

### Example Workflow

```bash
# Add an RSS feed
rssr add https://www.rust-lang.org/feed.xml

# Add an Atom feed
rssr add https://github.com/rust-lang/rust/commits/main.atom

# List feeds to get the ID
rssr list

# Update the feed to fetch articles
rssr update 1

# Read articles from the feed
rssr read 1

# Start web UI to browse articles
rssr serve
```

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
