use chrono::{DateTime, FixedOffset, Utc, NaiveDateTime};

pub fn relative_time(dt: DateTime<Utc>, timezone: &str) -> String {
    let offset = parse_timezone(timezone);

    let now = Utc::now().with_timezone(&offset);
    let dt = dt.with_timezone(&offset);

    let duration = now.signed_duration_since(dt);

    let seconds = duration.num_seconds();
    let minutes = duration.num_minutes();
    let hours = duration.num_hours();
    let days = duration.num_days();

    if seconds < 60 {
        "just now".to_string()
    } else if minutes < 60 {
        format!("{} minute{} ago", minutes, plural(minutes))
    } else if hours < 24 {
        format!("{} hour{} ago", hours, plural(hours))
    } else if days < 7 {
        format!("{} day{} ago", days, plural(days))
    } else if days < 30 {
        format!("{} week{} ago", days / 7, plural(days / 7))
    } else if days < 365 {
        format!("{} month{} ago", days / 30, plural(days / 30))
    } else {
        dt.format("%Y-%m-%d").to_string()
    }
}

pub fn parse_timezone(s: &str) -> FixedOffset {
    let hours: i32 = s.trim_start_matches("UTC").parse().unwrap_or(0);
    FixedOffset::east_opt(hours * 3600).unwrap()
}

fn plural(n: i64) -> &'static str {
    if n == 1 {
        ""
    } else {
        "s"
    }
}

pub fn parse_feed_time(date: &str) -> Option<DateTime<Utc>> {
    // RFC2822 (RSS)
    if let Ok(dt) = DateTime::parse_from_rfc2822(date) {
        return Some(dt.with_timezone(&Utc));
    }

    // RFC3339 (Atom / modern RSS)
    if let Ok(dt) = DateTime::parse_from_rfc3339(date) {
        return Some(dt.with_timezone(&Utc));
    }

    if let Ok(dt) = DateTime::parse_from_str(date, "%Y-%m-%d %H:%M:%S %z") {
        return Some(dt.with_timezone(&Utc));
    }

    if let Ok(dt) = NaiveDateTime::parse_from_str(date, "%Y-%m-%d %H:%M:%S") {
        return Some(DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc));
    }

    None
}
