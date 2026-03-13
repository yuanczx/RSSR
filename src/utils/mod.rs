pub mod time;
use regex::Regex;

pub fn strip_html_tags(input: &str) -> String {
    let re = Regex::new(r"<[^>]*>").unwrap();
    re.replace_all(input, "").to_string()
}