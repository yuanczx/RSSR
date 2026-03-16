use anyhow::{Ok, Result};
use clap::{Parser, Subcommand};

use crate::config::AppConfig;
use crate::feed::FeedManager;
use crate::storage::Storage;
use crate::utils;

#[derive(Parser)]
#[command(name = "rssr")]
#[command(about = "A RSS/Atom Reader with CLI and WebUI")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Add a new RSS or Atom feed
    Add {
        /// RSS or Atom feed URL
        url: String,
    },
    /// List all feeds
    List,
    /// Show articles from a feed
    Read {
        /// Feed ID (optional, shows all if not specified)
        feed_id: Option<i64>,
        /// Show only unread articles
        #[arg(short, long)]
        unread: bool,
    },
    /// Update all feeds
    Update {
        /// Feed ID (optional, updates all if not specified)
        feed_id: Option<i64>,
    },
    /// Mark article as read/unread
    Mark {
        /// Feed ID
        #[arg(short, long)]
        feed_id: Option<i64>,
        /// Article ID
        #[arg(short, long)]
        article_id: Option<i64>,
        /// Mark all article as read (default) or unread
        #[arg(long)]
        all: bool,
        /// Mark as read (default) or unread
        #[arg(short, long)]
        unread: bool,
    },
    /// Delete a feed
    Delete {
        /// Feed ID
        feed_id: i64,
    },
    /// Start web UI server
    Serve {
        /// Host to listen on
        #[arg(short, long)]
        host: Option<String>,
        /// Port to listen on
        #[arg(short, long)]
        port: Option<u16>,
    },
}

pub async fn run_cli(storage: Storage, app_config: AppConfig) -> Result<()> {
    let cli = Cli::parse();
    let feed_manager = FeedManager::new(storage);

    match cli.command {
        Commands::Add { url } => {
            let feed_id = feed_manager.add_feed(url, None).await?;
            println!("Added feed with ID: {}", feed_id);
        }
        Commands::List => {
            let feeds = feed_manager.storage().get_feeds().await?;
            if feeds.is_empty() {
                println!("No feeds found.");
            } else {
                println!("Feeds:");
                for feed in feeds {
                    println!("  [{}] {} - {}", feed.id, feed.title, feed.url);
                }
            }
        }
        Commands::Read { feed_id, unread } => {
            let articles = feed_manager.storage().get_articles(feed_id, unread).await?;
            if articles.is_empty() {
                println!("No articles found.");
                return Ok(());
            }
            for article in articles {
                let status_symbol = if article.read { "✓" } else { "◉" };
                let feed_title = feed_manager
                    .storage()
                    .get_feed(article.feed_id)
                    .await?
                    .map(|f| f.title)
                    .ok_or(anyhow::anyhow!("Feed not found"))?;
                println!(
                    "\n{status_symbol} [{:3}] {} | {}",
                    article.id, article.title, feed_title
                );
                // Clear HTML tags
                if let Some(desc) = &article.description {
                    let clean_text = utils::strip_html_tags(desc);
                    let preview: String = clean_text.chars().take(80).collect();
                    if !preview.is_empty() {
                        println!("  └─ {}", preview);
                    }
                }
                // meta info
                println!("  Link: {}", article.link);
                let time_zone = utils::time::parse_timezone(&app_config.time_zone);
                if let Some(published) = article.published {
                    let published_local = published.with_timezone(&time_zone);
                    let relative = utils::time::relative_time(published,&app_config.time_zone);
                    println!(
                        "  Published: {} ({})",
                        published_local.format("%Y-%m-%d %H:%M"),
                        relative
                    );
                }
            }
        }
        Commands::Update { feed_id } => {
            if let Some(id) = feed_id {
                feed_manager.update_feed(id).await?;
                println!("Updated feed {}", id);
            } else {
                feed_manager.update_all_feeds().await?;
                println!("Updated all feeds");
            }
        }
        Commands::Mark {
            article_id,
            unread,
            feed_id,
            all,
        } => {
            if all {
                feed_manager.storage().mark_all(!unread).await?;
                return Ok(());
            }
            feed_manager
                .storage()
                .mark_articles_read(feed_id, article_id, !unread)
                .await?;
            let status = if unread { "unread" } else { "read" };
            println!("Marked as {}", status);
        }
        Commands::Delete { feed_id } => {
            feed_manager.storage().delete_feed(feed_id).await?;
            println!("Deleted feed {}", feed_id);
        }
        Commands::Serve { host, port } => {
            let host = host.unwrap_or(app_config.webui.host);
            let port = port.unwrap_or(app_config.webui.port);
            crate::web::serve(feed_manager.storage().clone(), &host, port).await?;
        }
    }

    Ok(())
}
