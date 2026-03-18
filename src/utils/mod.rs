pub mod time;
use regex::Regex;
use std::env;
use std::path::PathBuf;
use url::Url;

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

pub fn resolve_relative_urls(html: &str, base_url: &str) -> String {
    let Ok(base) = Url::parse(base_url) else {
        return html.to_string();
    };

    let mut result = html.to_string();

    for attr in &["href=\"", "src=\""] {
        let mut output = String::with_capacity(result.len());
        let mut remaining = result.as_str();

        while let Some(pos) = remaining.find(attr) {
            output.push_str(&remaining[..pos + attr.len()]);
            remaining = &remaining[pos + attr.len()..];

            if let Some(end) = remaining.find('"') {
                let raw_url = &remaining[..end];

                // 跳过已经是绝对路径、锚点、或 javascript: 的情况
                let resolved = if raw_url.starts_with("http://")
                    || raw_url.starts_with("https://")
                    || raw_url.starts_with("//")
                    || raw_url.starts_with('#')
                    || raw_url.starts_with("javascript:")
                    || raw_url.starts_with("mailto:")
                    || raw_url.is_empty()
                {
                    raw_url.to_string()
                } else {
                    base.join(raw_url)
                        .map(|u| u.to_string())
                        .unwrap_or_else(|_| raw_url.to_string())
                };

                output.push_str(&resolved);
                remaining = &remaining[end..]; // 保留结尾的 "
            }
        }
        output.push_str(remaining);
        result = output;
    }

    result
}
