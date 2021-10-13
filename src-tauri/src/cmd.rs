use glob::{glob_with, MatchOptions};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum GlobResult {
  Error(String),
  Result(Vec<String>)
}

#[tauri::command]
pub fn load_files_by_glob(pattern: String) -> GlobResult {
  let options = MatchOptions {
    case_sensitive: false,
    require_literal_separator: false,
    require_literal_leading_dot: false,
  };
  match glob_with(&pattern, options) {
    Ok(result) => {
      let mut dirs: Vec<String> = vec![];
      result.for_each(|entry| {
        if let Ok(path) = entry {
          dirs.push(path.display().to_string());
        }
      });
      GlobResult::Result(dirs)
    },
    Err(e) => GlobResult::Error(e.to_string())
  }
}