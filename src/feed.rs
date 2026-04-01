use anyhow::{Context, Result};
use chrono:: Utc;
use atom_syndication::Feed as AtomFeed;
use rss::Channel;
use std::str::FromStr;
use url::Url;

use crate::models::Article;
use crate::storage::Storage;
use crate::utils;

/// Validates that a URL is safe for fetching RSS feeds.
/// Returns the validated URL string if valid, or an error otherwise.
fn validate_feed_url(url_str: &str) -> Result<String> {
    let url = Url::parse(url_str)
        .context("Invalid URL format")?;

    // Only allow http and https schemes
    match url.scheme() {
        "http" | "https" => {}
        scheme => anyhow::bail!("Unsupported URL scheme: {}", scheme),
    }

    // Validate there's a host (not just a path)
    if url.host().is_none() {
        anyhow::bail!("URL must have a valid host");
    }

    // Reject URLs with potentially dangerous schemes or data URLs
    if url.scheme() == "data" || url.scheme() == "javascript" || url.scheme() == "file" {
        anyhow::bail!("Unsafe URL scheme not allowed");
    }

    Ok(url_str.to_string())
}

#[derive(Clone)]
pub struct FeedManager {
    storage: Storage,
}

#[derive(Debug)]
enum FeedFormat {
    Rss,
    Atom,
}

struct FeedMetadata {
    title: String,
    description: Option<String>,
}

impl FeedManager {
    pub fn new(storage: Storage) -> Self {
        FeedManager { storage }
    }

    fn detect_feed_format(&self, content: &str) -> FeedFormat {
        // Check for Atom format (starts with <feed or contains xmlns="http://www.w3.org/2005/Atom")
        if content.trim_start().starts_with("<feed") 
            || content.contains("xmlns=\"http://www.w3.org/2005/Atom\"")
            || content.contains("xmlns='http://www.w3.org/2005/Atom'") {
            FeedFormat::Atom
        } else {
            // Default to RSS
            FeedFormat::Rss
        }
    }

    pub async fn fetch_feed_content(&self, url: &str) -> Result<String> {
        let validated_url = validate_feed_url(url)?;
        let response = reqwest::get(&validated_url)
            .await
            .context("Failed to fetch feed")?;

        let content = response
            .text()
            .await
            .context("Failed to read feed content")?;

        Ok(content)
    }

    async fn parse_feed_metadata(&self, content: &str, format: &FeedFormat) -> Result<FeedMetadata> {
        match format {
            FeedFormat::Rss => {
                let channel = Channel::from_str(content)
                    .context("Failed to parse RSS feed")?;
                Ok(FeedMetadata {
                    title: channel.title().to_string(),
                    description: Some(channel.description().to_string()),
                })
            }
            FeedFormat::Atom => {
                let feed = AtomFeed::from_str(content)
                    .context("Failed to parse Atom feed")?;
                Ok(FeedMetadata {
                    title: feed.title().value.clone(),
                    description: feed.subtitle().map(|s| s.value.clone()),
                })
            }
        }
    }

    async fn parse_feed_articles(&self, feed_id: i64, content: &str, format: &FeedFormat) -> Result<()> {
        match format {
            FeedFormat::Rss => {
                let channel = Channel::from_str(content)
                    .context("Failed to parse RSS feed")?;
                self.update_rss_articles(feed_id, &channel).await
            }
            FeedFormat::Atom => {
                let feed = AtomFeed::from_str(content)
                    .context("Failed to parse Atom feed")?;
                self.update_atom_articles(feed_id, &feed).await
            }
        }
    }

    async fn update_rss_articles(&self, feed_id: i64, channel: &Channel) -> Result<()> {
        for item in channel.items() {
            let title = item.title()
                .unwrap_or("Untitled")
                .to_string();
            
            let link = item.link()
                .unwrap_or("")
                .to_string();

            let description = item
                .description()
                .map(|s| utils::resolve_relative_urls(s, &link));
            let content = item
                .content()
                .map(|s| utils::resolve_relative_urls(s, &link));
            let author = item.author().map(|s| s.to_string());

            let published = item.pub_date()
                .and_then(|date| utils::time::parse_feed_time(date));

            let article = Article {
                id: 0,
                feed_id,
                title,
                link,
                description,
                content,
                author,
                published,
                read: false,
                created_at: Utc::now(),
            };

            self.storage().add_article(&article).await?;
        }

        Ok(())
    }

    async fn update_atom_articles(&self, feed_id: i64, feed: &AtomFeed) -> Result<()> {
        for entry in feed.entries() {
            let title = entry.title().value.clone();
            
            // Atom entries can have multiple links, prefer the "alternate" link
            let link = entry
                .links()
                .iter()
                .find(|l| l.rel() == "alternate" || l.rel() == "self")
                .or_else(|| entry.links().first())
                .map(|l| l.href().to_string())
                .unwrap_or_else(|| String::new());

            // Atom uses summary or content
            let description = entry
                .summary()
                .map(|s| utils::resolve_relative_urls(&s.value, &link))
                .or_else(|| {
                    entry.content().and_then(|c| {
                        c.value()
                            .map(|v| utils::resolve_relative_urls(v, &link))
                            .or_else(|| c.src().map(|s| utils::resolve_relative_urls(s, &link)))
                    })
                });

            let content = entry
                .content()
                .and_then(|c| {
                    c.value()
                        .map(|v| utils::resolve_relative_urls(v, &link))
                        .or_else(|| c.src().map(|s| utils::resolve_relative_urls(s, &link)))
                });

            // Atom authors are a vector
            let author = entry
                .authors()
                .first()
                .map(|a| {
                    if let Some(email) = a.email() {
                        format!("{} <{}>", a.name(), email)
                    } else {
                        a.name().to_string()
                    }
                })
                .or_else(|| {
                    feed.authors().first().map(|a| {
                        if let Some(email) = a.email() {
                            format!("{} <{}>", a.name(), email)
                        } else {
                            a.name().to_string()
                        }
                    })
                });

            // Atom uses published or updated
            let published = entry
                .published()
                .or_else(|| Some(entry.updated()))
                .map(|dt| dt.with_timezone(&Utc));

            let article = Article {
                id: 0,
                feed_id,
                title,
                link,
                description,
                content,
                author,
                published,
                read: false,
                created_at: Utc::now(),
            };

            self.storage().add_article(&article).await?;
        }

        Ok(())
    }

    pub async fn add_feed(&self, url: String, group_id: Option<i64>) -> Result<i64> {
        let content = self.fetch_feed_content(&url).await?;
        let format = self.detect_feed_format(&content);
        
        let metadata = self.parse_feed_metadata(&content, &format).await?;

        let feed_id = self.storage()
            .add_feed(metadata.title, url, metadata.description, group_id)
            .await?;

        self.parse_feed_articles(feed_id, &content, &format).await?;
        
        Ok(feed_id)
    }

    pub async fn update_feed(&self, feed_id: i64) -> Result<()> {
        let feed = self.storage()
            .get_feed(feed_id)
            .await?
            .context("Feed not found")?;

        let content = self.fetch_feed_content(&feed.url).await?;
        let format = self.detect_feed_format(&content);
        
        self.parse_feed_articles(feed_id, &content, &format).await?;
        self.storage().update_feed_last_fetched(feed_id).await?;

        Ok(())
    }

    pub async fn update_all_feeds(&self) -> Result<()> {
        let feeds = self.storage().get_feeds().await?;
        
        for feed in feeds {
            if let Err(e) = self.update_feed(feed.id).await {
                eprintln!("Failed to update feed {}: {}", feed.title, e);
            }
        }

        Ok(())
    }

    pub fn storage(&self) -> &Storage {
        &self.storage
    }
}
