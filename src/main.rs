mod cli;
mod feed;
mod models;
mod storage;
mod web;

use anyhow::Result;
use storage::Storage;

#[tokio::main]
async fn main() -> Result<()> {
    let database_url = "sqlite:rssr.db";
    let storage = Storage::new(database_url).await?;
    cli::run_cli(storage).await
}
