# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please send an email to the maintainer or open a GitHub issue with the label `security`. We appreciate responsible disclosure and will work to address issues promptly.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Considerations

### Data Storage

- **SQLite Database**: All feed and article data is stored locally in a SQLite database. Ensure the database file has appropriate file permissions to prevent unauthorized access.
- **No Encryption**: The database stores feed URLs and article content in plain text. Do not run this application on shared systems without additional encryption layers.

### Network Security

- **HTTP/HTTPS**: The application fetches RSS/Atom feeds over HTTP/HTTPS. When possible, use HTTPS endpoints to prevent man-in-the-middle attacks on feed content.
- **No Certificate Validation**: The Rust `reqwest` client is configured to validate SSL certificates by default. Do not disable this setting.
- **External Network Requests**: The application makes outbound HTTP requests to external servers to fetch RSS/Atom feeds. Be aware that:
  - Feed URLs are exposed in network requests
  - Feed content (titles, descriptions, article text) is fetched and stored
  - Server IP addresses may be logged by remote servers

### API Security

- **No Authentication**: The web API (`/api/*`) currently has no authentication. Do not expose the server to untrusted networks without adding authentication.
- **CORS**: The application uses `tower-http` CORS middleware. Review CORS settings in production deployments.
- **Localhost Only**: By default, the server binds to `127.0.0.1`. Ensure this remains the default for development.

### Input Validation

- **Feed URLs**: Feed URLs are validated using the `url` crate. However, exercise caution when adding feeds from untrusted sources.
- **RSS/Atom Parsing**: The application uses `rss` and `atom_syndication` crates for parsing. While these are well-maintained, treat parsed content as untrusted (e.g., avoid rendering HTML without sanitization).

### Frontend Security

- **React**: The frontend uses React 19. Keep dependencies up to date.
- **No User Content**: The application displays feed content but does not allow users to create content that other users will see (except adding feeds to their own instance).
- **XSS Prevention**: When rendering feed content, ensure HTML is properly sanitized to prevent XSS attacks.

## Dependencies

### Rust Dependencies

We depend on the following key crates and recommend monitoring their security advisories:

- `axum` - Web framework
- `tokio` - Async runtime
- `reqwest` - HTTP client
- `sqlx` - Database access
- `serde` - Serialization

### JavaScript Dependencies

The frontend uses standard Vite + React dependencies. Keep dependencies updated:

```bash
cd frontend
bun audit
```

## Best Practices for Deployment

1. **Run locally**: The default configuration binds to `127.0.0.1:8080`. Keep it this way if possible.
2. **Firewall**: If exposing the API externally, configure a firewall to limit access.
3. **Database permissions**: Set restrictive file permissions on the SQLite database file.
4. **HTTPS**: If deploying with HTTPS, configure TLS properly (reverse proxy like nginx or Caddy).
5. **Updates**: Regularly update dependencies to receive security patches.

## Vulnerability Disclosure Timeline

- Initial response: Within 7 days
- Status update: Every 14 days until resolved
- Public disclosure: After patch release

