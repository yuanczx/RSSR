use anyhow::{Ok, Result};
use clap::{Parser, Subcommand};

use crate::feed::FeedManager;
use crate::storage::Storage;

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
        #[arg(short, long)]
        all: bool,
        /// Mark as read (default) or unread
        #[arg(short, long)]
        read: bool,
    },
    /// Delete a feed
    Delete {
        /// Feed ID
        feed_id: i64,
    },
    /// Start web UI server
    Serve {
        /// Port to listen on
        #[arg(short, long, default_value = "8080")]
        port: u16,
    },
}

pub async fn run_cli(storage: Storage) -> Result<()> {
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
                let read_status = if article.read { "[READ]" } else { "[UNREAD]" };
                println!("\n{} {}", read_status, article.title);
                if let Some(desc) = &article.description {
                    let preview = if desc.len() > 100 { &desc[..100] } else { desc };
                    println!("  {}", preview);
                }
                println!("  Link: {}", article.link);
                if let Some(published) = article.published {
                    println!("  Published: {}", published.format("%Y-%m-%d %H:%M"));
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
            read,
            feed_id,
            all,
        } => {
            if all {
                feed_manager.storage().mark_all(read).await?;
                return Ok(());
            }
            feed_manager
                .storage()
                .mark_articles_read(feed_id, article_id, read)
                .await?;
            let status = if read { "read" } else { "unread" };
            println!("Marked as {}", status);
        }
        Commands::Delete { feed_id } => {
            feed_manager.storage().delete_feed(feed_id).await?;
            println!("Deleted feed {}", feed_id);
        }
        Commands::Serve { port } => {
            println!("Starting web server on port {}...", port);
            println!("Open http://localhost:{} in your browser", port);
            crate::web::serve(feed_manager.storage().clone(), port).await?;
        }
    }

    Ok(())
}
