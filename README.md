# RSSR - Modern RSS/Atom Reader

A fast, modern RSS and Atom feed reader built with Rust, featuring both a command-line interface and a responsive web UI.

![Web UI](docs/readme/webui.png)

## Tech Stack

- **Backend**: Rust with Axum web framework
- **Frontend**: React 19 with TypeScript and Vite
- **Database**: SQLite for local storage
- **CLI**: Clap for command-line interface
- **RSS/Atom Parsing**: `rss` and `atom_syndication` crates

## Features

- **Dual Interfaces**: Use via CLI or modern web UI
- **Feed Management**: Add, list, update, and delete RSS/Atom feeds
- **Article Reading**: Read articles with read/unread tracking
- **Grouping**: Organize feeds into custom groups
- **Media Support**: View images and media content from articles
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: All data stored locally in SQLite
- **Internationalization**: Multi-language support

## Installation

### Prerequisites

- Rust 1.70+ and Cargo
- Bun (for frontend development)
- SQLite (included with most systems)

### Build from Source

```bash
git clone <repository-url>
cd rssr
cargo build --release
```

The binary will be at `target/release/rssr`.

## Usage

### CLI Commands

#### Add a Feed

```bash
# Add RSS or Atom feed
rssr add https://example.com/feed.xml
```

#### List Feeds

```bash
# List all feeds
rssr list
```

#### Read Articles

```bash
# Read all articles
rssr read

# Read from specific feed
rssr read 1

# Read only unread
rssr read --unread
```

#### Update Feeds

```bash
# Update all feeds
rssr update

# Update specific feed
rssr update 1
```

#### Mark Articles

```bash
# Mark as read (default)
rssr mark 5

# Mark as unread
rssr mark 5 --unread
```

#### Delete Feed

```bash
rssr delete 1
```

#### Start Web Server

```bash
# Default port 8080
rssr serve

# Custom port
rssr serve --port 3000
```

Then open `http://localhost:8080` in your browser.

### Web UI

The web interface provides:

- **Sidebar**: Browse feeds by group or individually
- **Article List**: View articles with title, date, and preview
- **Reader View**: Read full article content with media support
- **Media Panel**: View images and media in a dedicated panel
- **Settings**: Configure refresh intervals and preferences

## Configuration

Configuration is stored at `~/.config/rssr/config.toml`:

```toml
[server]
host = "127.0.0.1"
port = 8080

[storage]
path = "~/.local/share/rssr/rssr.db"

[refresh]
interval_minutes = 30
```

## API Endpoints

| Method | Endpoint                      | Description                                      |
| ------ | ----------------------------- | ------------------------------------------------ |
| GET    | `/api/feeds`                  | List all feeds                                   |
| POST   | `/api/feeds`                  | Add new feed                                     |
| DELETE | `/api/feeds/{id}`             | Delete feed                                      |
| POST   | `/api/feeds/{id}/update`      | Refresh feed                                     |
| POST   | `/api/feeds/{id}/group`       | Update feed's group                              |
| POST   | `/api/feeds/{id}/{action}`    | Mark feed read/unread                            |
| GET    | `/api/articles`               | Get articles (supports `feed_id`, `unread_only`) |
| POST   | `/api/articles/{id}/{action}` | Mark article read/unread                         |
| GET    | `/api/groups`                 | List all groups                                  |
| POST   | `/api/groups`                 | Create new group                                 |
| DELETE | `/api/groups/{id}`            | Delete group                                     |
| POST   | `/api/groups/{id}`            | Update group (name or is_media)                 |
| GET    | `/api/stats`                  | Get statistics                                   |

### Request/Response Examples

#### Add Feed
```json
POST /api/feeds
{ "url": "https://example.com/feed.xml", "group_id": 1 }
```

#### Get Articles
```
GET /api/articles?feed_id=1&unread_only=true
```

## Security

- All data stored locally in SQLite
- SSL certificate validation enabled by default
- URL safety validation for feed fetching
- See [SECURITY.md](SECURITY.md) for details

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
