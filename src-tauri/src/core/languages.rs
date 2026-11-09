//! Which audio and subtitle tracks a language list keeps.

/// Indexes of tracks whose language is listed. An empty list keeps every track.
/// A listed filter drops tracks with no language.
pub fn matching_indexes(languages: &[Option<String>], keep: &[String]) -> Vec<usize> {
    if keep.is_empty() {
        return (0..languages.len()).collect();
    }
    let wanted: Vec<String> = keep
        .iter()
        .map(|code| code.trim().to_ascii_lowercase())
        .filter(|code| !code.is_empty())
        .collect();
    if wanted.is_empty() {
        return (0..languages.len()).collect();
    }
    languages
        .iter()
        .enumerate()
        .filter_map(|(index, language)| {
            let code = language.as_deref().unwrap_or("").to_ascii_lowercase();
            if wanted.iter().any(|kept| kept == &code) {
                Some(index)
            } else {
                None
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::matching_indexes;

    #[test]
    fn empty_list_keeps_every_track() {
        let languages = [Some("eng".into()), None, Some("spa".into())];
        assert_eq!(matching_indexes(&languages, &[]), vec![0, 1, 2]);
    }

    #[test]
    fn keeps_only_named_languages() {
        let languages = [Some("eng".into()), Some("deu".into()), None];
        let keep = ["SPA".into(), "eng".into()];
        assert_eq!(matching_indexes(&languages, &keep), vec![0]);
    }
}
