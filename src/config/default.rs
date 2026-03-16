use crate::config::{AppConfig,WebUIConfig};
use crate::utils;


pub fn storage_path() -> String {
    let mut data_path = utils::get_home_dir();
    data_path.push(".config/rssr/data.db");
    data_path.display().to_string()
}

pub fn webui_host() -> String {
    "127.0.0.1".to_string()
}

pub fn webui_port() -> u16 {
    8080
}

// Default value
impl Default for AppConfig {
     fn default() -> Self {
        Self {
            storage_path: storage_path(),
            webui: WebUIConfig::default(),
        }
    }
}

impl Default for WebUIConfig {
    fn default() -> Self {
        Self {
            host: webui_host(),
            port: webui_port(),
        }
    }
}