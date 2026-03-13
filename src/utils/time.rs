use chrono::{DateTime, Utc, Local, Duration};

pub fn get_relative_time(dt: DateTime<Utc>) -> String {
    let now = Local::now();
    let dt_local: DateTime<Local> = DateTime::from(dt);
    let duration = now.signed_duration_since(dt_local);
    
    // 未来时间
    if duration < Duration::zero() {
        let future = -duration;
        return format_future_time(future);
    }
    
    // 过去时间
    format_past_time(duration)
}

fn format_past_time(duration: Duration) -> String {
    let minutes = duration.num_minutes();
    let hours = duration.num_hours();
    let days = duration.num_days();
    let weeks = days / 7;
    let months = days / 30;
    let years = days / 365;

    match (years, months, weeks, days, hours, minutes) {
        (y, _, _, _, _, _) if y >= 2 => format!("{} years ago", y),
        (1, _, _, _, _, _) => "1 year ago".to_string(),
        
        (_, m, _, _, _, _) if m >= 2 => format!("{} months ago", m),
        (_, 1, _, _, _, _) => "1 month ago".to_string(),
        
        (_, _, w, _, _, _) if w >= 2 => format!("{} weeks ago", w),
        (_, _, 1, _, _, _) => "1 week ago".to_string(),
        
        (_, _, _, d, _, _) if d >= 2 => format!("{} days ago", d),
        (_, _, _, 1, _, _) => "yesterday".to_string(),
        
        (_, _, _, _, h, _) if h >= 2 => format!("{} hours ago", h),
        (_, _, _, _, 1, _) => "1 hour ago".to_string(),
        
        (_, _, _, _, _, m) if m >= 2 => format!("{} minutes ago", m),
        (_, _, _, _, _, 1) => "1 minute ago".to_string(),
        
        _ => "just now".to_string(),
    }
}

fn format_future_time(duration: Duration) -> String {
    let minutes = duration.num_minutes();
    let hours = duration.num_hours();
    let days = duration.num_days();

    match (days, hours, minutes) {
        (d, _, _) if d >= 2 => format!("in {} days", d),
        (1, _, _) => "tomorrow".to_string(),
        (_, h, _) if h >= 2 => format!("in {} hours", h),
        (_, 1, _) => "in 1 hour".to_string(),
        (_, _, m) if m >= 2 => format!("in {} minutes", m),
        (_, _, 1) => "in 1 minute".to_string(),
        _ => "soon".to_string(),
    }
}
