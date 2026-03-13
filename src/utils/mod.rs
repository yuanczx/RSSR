pub mod time;
use regex::Regex;
use std::env;
use std::path::PathBuf;

pub fn strip_html_tags(input: &str) -> String {
    let re = Regex::new(r"<[^>]*>").unwrap();
    re.replace_all(input, "").to_string()
}

pub fn get_home_dir() -> PathBuf {
    // Linux / macOS
    if let Ok(home) = env::var("HOME") {
        return PathBuf::from(home);
    }

    // Windows
    if let Ok(userprofile) = env::var("USERPROFILE") {
        return PathBuf::from(userprofile);
    }

    panic!("Error: Can not get home dir");
}

