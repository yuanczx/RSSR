use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::str::FromStr;

use crate::models::{Article, Feed, Group};

#[derive(Clone)]
pub struct Storage {
    pool: SqlitePool,
}

impl Storage {
    pub async fn new(database_url: &str) -> Result<Self> {
        let options = SqliteConnectOptions::from_str(database_url)?.create_if_missing(true);

        let pool = SqlitePoolOptions::new().connect_with(options).await?;

        let storage = Storage { pool };
        storage.init_db().await?;
        Ok(storage)
    }

    async fn init_db(&self) -> Result<()> {
        // Create groups table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_media BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Migration: add is_media column if it doesn't exist
        match sqlx::query(
            r#"
            ALTER TABLE groups ADD COLUMN is_media INTEGER NOT NULL DEFAULT 0
            "#,
        )
        .execute(&self.pool)
        .await
        {
            Ok(_) | Err(sqlx::Error::Database(_)) => {}
            Err(e) => return Err(e.into()),
        }

        // Create feeds table (with migration for group_id)
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                description TEXT,
                group_id INTEGER,
                last_fetched DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Add group_id column if it doesn't exist (migration)
        // let _ = sqlx::query(
        //     r#"
        //     ALTER TABLE feeds ADD COLUMN group_id INTEGER
        //     "#,
        // )
        // .execute(&self.pool)
        // .await;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feed_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                link TEXT NOT NULL,
                description TEXT,
                content TEXT,
                author TEXT,
                published DATETIME,
                read BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (feed_id) REFERENCES feeds(id),
                UNIQUE(feed_id, link)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn add_feed(
        &self,
        title: String,
        url: String,
        description: Option<String>,
        group_id: Option<i64>,
    ) -> Result<i64> {
        let id = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO feeds (title, url, description, group_id)
            VALUES (?1, ?2, ?3, ?4)
            RETURNING id
            "#,
        )
        .bind(title)
        .bind(url)
        .bind(description)
        .bind(group_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn get_feeds(&self) -> Result<Vec<Feed>> {
        let feeds = sqlx::query_as::<_, Feed>(
            r#"
            SELECT id, title, url, description, group_id, last_fetched, created_at
            FROM feeds
            ORDER BY CASE WHEN group_id IS NULL THEN 1 ELSE 0 END, group_id, created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(feeds)
    }

    pub async fn get_feed(&self, id: i64) -> Result<Option<Feed>> {
        let feed = sqlx::query_as::<_, Feed>(
            r#"
            SELECT id, title, url, description, group_id, last_fetched, created_at
            FROM feeds
            WHERE id = ?1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(feed)
    }

    pub async fn update_feed_group(&self, feed_id: i64, group_id: Option<i64>) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE feeds
            SET group_id = ?1
            WHERE id = ?2
            "#,
        )
        .bind(group_id)
        .bind(feed_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_feed_last_fetched(&self, id: i64) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE feeds
            SET last_fetched = CURRENT_TIMESTAMP
            WHERE id = ?1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_feed(&self, id: i64) -> Result<()> {
        // Delete all articles for this feed first
        sqlx::query("DELETE FROM articles WHERE feed_id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        // Then delete the feed
        sqlx::query("DELETE FROM feeds WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn add_article(&self, article: &Article) -> Result<i64> {
        let id = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT OR IGNORE INTO articles 
            (feed_id, title, link, description, content, author, published, read)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            RETURNING id
            "#,
        )
        .bind(article.feed_id)
        .bind(&article.title)
        .bind(&article.link)
        .bind(&article.description)
        .bind(&article.content)
        .bind(&article.author)
        .bind(article.published)
        .bind(article.read)
        .fetch_optional(&self.pool)
        .await?;

        Ok(id.unwrap_or(0))
    }

    pub async fn get_articles(
        &self,
        feed_id: Option<i64>,
        unread_only: bool,
    ) -> Result<Vec<Article>> {
        let query_str = if feed_id.is_some() {
            if unread_only {
                "SELECT id, feed_id, title, link, description, content, author, published, read, created_at
                 FROM articles
                 WHERE feed_id = ?1 AND read = 0
                 ORDER BY published DESC, created_at DESC"
            } else {
                "SELECT id, feed_id, title, link, description, content, author, published, read, created_at
                 FROM articles
                 WHERE feed_id = ?1
                 ORDER BY published DESC, created_at DESC"
            }
        } else {
            if unread_only {
                "SELECT id, feed_id, title, link, description, content, author, published, read, created_at
                 FROM articles
                 WHERE read = 0
                 ORDER BY published DESC, created_at DESC"
            } else {
                "SELECT id, feed_id, title, link, description, content, author, published, read, created_at
                 FROM articles
                 ORDER BY published DESC, created_at DESC"
            }
        };

        let mut query_builder = sqlx::query_as::<_, Article>(query_str);
        if let Some(fid) = feed_id {
            query_builder = query_builder.bind(fid);
        }

        let articles = query_builder.fetch_all(&self.pool).await?;
        Ok(articles)
    }

    pub async fn mark_all(&self, read: bool) -> Result<()> {
        sqlx::query("UPDATE articles SET read = ?1")
            .bind(read)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn mark_articles_read(
        &self,
        feed_id: Option<i64>,
        article_id: Option<i64>,
        read: bool,
    ) -> Result<()> {
        if let Some(article_id) = article_id {
            // Mark article as read by article_id
            sqlx::query("UPDATE articles SET read = ?1 WHERE id = ?2")
                .bind(read)
                .bind(article_id)
                .execute(&self.pool)
                .await?;
        } else if let Some(feed_id) = feed_id {
            // Mark all articles in a specific feed
            sqlx::query("UPDATE articles SET read = ?1 WHERE feed_id = ?2")
                .bind(read)
                .bind(feed_id)
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    pub async fn get_feed_stats(&self) -> Result<Vec<crate::models::FeedInfo>> {
        let stats = sqlx::query_as::<_, crate::models::FeedInfo>(
            r#"
            SELECT 
                f.id,
                f.title,
                f.url,
                f.description,
                COUNT(a.id) as article_count,
                SUM(CASE WHEN a.read = 0 THEN 1 ELSE 0 END) as unread_count
            FROM feeds f
            LEFT JOIN articles a ON f.id = a.feed_id
            GROUP BY f.id, f.title, f.url, f.description
            ORDER BY f.created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(stats)
    }

    // Group operations
    pub async fn create_group(&self, name: String) -> Result<i64> {
        let id = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO groups (name, is_media)
            VALUES (?1, 0)
            RETURNING id
            "#,
        )
        .bind(name)
        .fetch_one(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn update_group_media(&self, id: i64, is_media: bool) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE groups
            SET is_media = ?1
            WHERE id = ?2
            "#,
        )
        .bind(is_media)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_groups(&self) -> Result<Vec<Group>> {
        let groups = sqlx::query_as::<_, Group>(
            r#"
            SELECT id, name, is_media, created_at
            FROM groups
            ORDER BY name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(groups)
    }

    pub async fn delete_group(&self, id: i64) -> Result<()> {
        // First, set all feeds in this group to NULL
        sqlx::query(
            r#"
            UPDATE feeds
            SET group_id = NULL
            WHERE group_id = ?1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        // Then delete the group
        sqlx::query("DELETE FROM groups WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn update_group_name(&self, id: i64, name: String) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE groups
            SET name = ?1
            WHERE id = ?2
            "#,
        )
        .bind(name)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
