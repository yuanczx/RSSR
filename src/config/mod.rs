mod default;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default = "default::storage_path")]
    pub storage_path: String,
    #[serde(default)]
    pub webui: WebUIConfig,
    #[serde(default = "default::time_zone")]
    pub time_zone: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebUIConfig {
    #[serde(default = "default::webui_host")]
    pub host: String,
    #[serde(default = "default::webui_port")]
    pub port: u16,
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
