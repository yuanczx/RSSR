use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Feed {
    pub id: i64,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub group_id: Option<i64>,
    pub last_fetched: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Group {
    pub id: i64,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Article {
    pub id: i64,
    pub feed_id: i64,
    pub title: String,
    pub link: String,
    pub description: Option<String>,
    pub content: Option<String>,
    pub author: Option<String>,
    pub published: Option<DateTime<Utc>>,
    pub read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FeedInfo {
    pub id: i64,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub article_count: i64,
    pub unread_count: i64,
}
