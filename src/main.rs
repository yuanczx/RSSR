mod cli;
mod config;
mod feed;
mod models;
mod storage;
mod utils;
mod web;

use anyhow::Result;
use config::AppConfig;
use storage::Storage;
use utils::get_home_dir;

#[tokio::main]
async fn main() -> Result<()> {
    const CONFIG_PATH: &str = ".config/rssr/config.toml";
    let mut config_path = get_home_dir();
    config_path.push(CONFIG_PATH);
    let app_config = AppConfig::load_or_create(&config_path)?;
    let storage: Storage = Storage::new(&app_config.storage_path).await?;
    cli::run_cli(storage, app_config).await
}
