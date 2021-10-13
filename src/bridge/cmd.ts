import { invoke } from '@tauri-apps/api/tauri'
import { unixPath } from '@/utils/path'

export async function loadFilesByGlob(pattern: string): Promise<string[]> {
  const result = await invoke('load_files_by_glob', {
    pattern,
  })
  if (Array.isArray(result)) return result.map((r) => unixPath(r))
  throw new Error(`fail to load files: ${result}`)
}
