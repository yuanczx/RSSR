use anyhow::Result;
use axum::{
    extract::{Path, Query},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower_http::services::ServeDir;

use crate::feed::FeedManager;
use crate::models::{Article, Feed, Group};
use crate::storage::Storage;

#[derive(Deserialize)]
struct AddFeedRequest {
    url: String,
    group_id: Option<i64>,
}

#[derive(Deserialize)]
struct CreateGroupRequest {
    name: String,
}

#[derive(Deserialize)]
struct UpdateGroupRequest {
    name: String,
}

#[derive(Deserialize)]
struct UpdateFeedGroupRequest {
    group_id: Option<i64>,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

pub async fn serve(storage: Storage, host: &str, port: u16) -> Result<()> {
    let feed_manager = FeedManager::new(storage);

    use axum::http::Method;
    use tower_http::cors::{Any, CorsLayer};

    let cors = CorsLayer::new()
        .allow_origin(Any) //NOTE Dev Env
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/feeds", get(get_feeds_api))
        .route("/api/feeds", post(add_feed_api))
        .route("/api/feeds/{id}", axum::routing::delete(delete_feed_api))
        .route("/api/feeds/{id}/update", post(update_feed_api))
        .route("/api/feeds/{id}/group", post(update_feed_group_api))
        .route("/api/groups", get(get_groups_api))
        .route("/api/groups", post(create_group_api))
        .route("/api/groups/{id}", axum::routing::delete(delete_group_api))
        .route("/api/groups/{id}", post(update_group_api))
        .route("/api/articles", get(get_articles_api))
        .route("/api/articles/{id}/{action}", post(mark_article_read_api))
        .route("/api/feeds/{id}/{action}", post(mark_feed_read_api))
        .route("/api/stats", get(get_stats_api))
        .layer(cors)
        .with_state(feed_manager)
        .fallback_service(ServeDir::new("frontend/dist"));

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port)).await?;
    println!("Server running on http://{}:{}", host, port);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn get_feeds_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
) -> Json<ApiResponse<Vec<Feed>>> {
    match feed_manager.storage().get_feeds().await {
        Ok(feeds) => Json(ApiResponse {
            success: true,
            data: Some(feeds),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn add_feed_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Json(req): Json<AddFeedRequest>,
) -> Json<ApiResponse<i64>> {
    match feed_manager.add_feed(req.url, req.group_id).await {
        Ok(id) => Json(ApiResponse {
            success: true,
            data: Some(id),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn delete_feed_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path(id): Path<i64>,
) -> Json<ApiResponse<()>> {
    match feed_manager.storage().delete_feed(id).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn update_feed_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path(id): Path<i64>,
) -> Json<ApiResponse<()>> {
    match feed_manager.update_feed(id).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn get_articles_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Query(params): Query<HashMap<String, String>>,
) -> Json<ApiResponse<Vec<Article>>> {
    let feed_id = params.get("feed_id").and_then(|s| s.parse().ok());
    let unread_only = params.get("unread_only") == Some(&"true".to_string());

    match feed_manager
        .storage()
        .get_articles(feed_id, unread_only)
        .await
    {
        Ok(articles) => Json(ApiResponse {
            success: true,
            data: Some(articles),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn mark_article_read_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path((id, action)): Path<(i64, String)>,
) -> Json<ApiResponse<()>> {
    let read = action == "read";

    match feed_manager
        .storage()
        .mark_articles_read(None, Some(id), read)
        .await
    {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn mark_feed_read_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path((id, action)): Path<(i64, String)>,
) -> Json<ApiResponse<()>> {
    let read = action == "read";

    match feed_manager
        .storage()
        .mark_articles_read(Some(id), None, read)
        .await
    {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn get_stats_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
) -> Json<ApiResponse<Vec<crate::models::FeedInfo>>> {
    match feed_manager.storage().get_feed_stats().await {
        Ok(stats) => Json(ApiResponse {
            success: true,
            data: Some(stats),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn get_groups_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
) -> Json<ApiResponse<Vec<Group>>> {
    match feed_manager.storage().get_groups().await {
        Ok(groups) => Json(ApiResponse {
            success: true,
            data: Some(groups),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn create_group_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Json(req): Json<CreateGroupRequest>,
) -> Json<ApiResponse<i64>> {
    match feed_manager.storage().create_group(req.name).await {
        Ok(id) => Json(ApiResponse {
            success: true,
            data: Some(id),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn delete_group_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path(id): Path<i64>,
) -> Json<ApiResponse<()>> {
    match feed_manager.storage().delete_group(id).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn update_group_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateGroupRequest>,
) -> Json<ApiResponse<()>> {
    match feed_manager.storage().update_group_name(id, req.name).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn update_feed_group_api(
    axum::extract::State(feed_manager): axum::extract::State<FeedManager>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateFeedGroupRequest>,
) -> Json<ApiResponse<()>> {
    match feed_manager
        .storage()
        .update_feed_group(id, req.group_id)
        .await
    {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}
