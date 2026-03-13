use crate::utils;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_storage_path")]
    pub storage_path: String,
    #[serde(default)]
    pub webui: WebUIConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebUIConfig {
    #[serde(default = "default_webui_host")]
    pub host: String,
    #[serde(default = "default_webui_port")]
    pub port: u16,
}

fn default_storage_path() -> String {
    let mut data_path = utils::get_home_dir();
    data_path.push(".config/rssr/data.db");
    data_path.display().to_string()
}

fn default_webui_host() -> String {
    "127.0.0.1".to_string()
}

fn default_webui_port() -> u16 {
    8080
}

// Default value
impl Default for AppConfig {
    fn default() -> Self {
        Self {
            storage_path: default_storage_path(),
            webui: WebUIConfig::default(),
        }
    }
}

impl Default for WebUIConfig {
    fn default() -> Self {
        Self {
            host: default_webui_host(),
            port: default_webui_port(),
        }
    }
}

impl AppConfig {
    pub fn load_or_create<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();

        if !path.exists() {
            let cfg: AppConfig = Self::default();
            cfg.save_to_file(path)?;
            return Ok(cfg);
        }

        let content = fs::read_to_string(path)?;
        let cfg: Self = toml::from_str(&content)?;
        Ok(cfg)
    }

    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let path = path.as_ref();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = toml::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
