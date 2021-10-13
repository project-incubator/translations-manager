import { getRegexp } from '@/hooks/useRegexp'
import { readTextFile } from '@tauri-apps/api/fs'
import { unixPath } from '@/utils/path'
import { load } from 'js-yaml'

export type PatternFile = {
  patterns: {
    // glob literal, to find resources
    glob: string
    // regexp literal, to get node path from full path
    path: string
    // regexp literal, to get lang from full path
    lang: string
  }[]
  languages: string[] | Record<string, string>
}

export type Pattern = {
  glob: string
  path: RegExp
  lang: RegExp
}

export type PatternContainer = {
  patterns: Pattern[]
  languages: Record<string, string>
}

export async function createPatternContainer(
  rawPatternFilePath: string
): Promise<PatternContainer> {
  const patternFilePath = unixPath(rawPatternFilePath)
  const file = load(await readTextFile(patternFilePath), {
    filename: patternFilePath,
  }) as PatternFile
  const patterns = file.patterns.map((p) => ({
    glob: p.glob,
    path: getRegexp(p.path),
    lang: getRegexp(p.lang),
  }))

  const languages = Array.isArray(file.languages)
    ? arrayToSymmetricalRecord(file.languages)
    : file.languages

  return {
    patterns,
    languages,
  }
}

function arrayToSymmetricalRecord(arr: string[]): Record<string, string> {
  const result = Object.create(null)
  arr.forEach((v) => (result[v] = v))
  return result
}
