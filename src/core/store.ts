import { computed, ComputedRef, ref, Ref, shallowRef } from 'vue'
import {
  createResourceNode,
  ResourceNode,
  TranslationFileContent,
  Tree,
} from '@/core/tree'
import { EditHistoryManager } from '@/core/history'
import { dir, join, removeTrailingSlash, unixPath } from '@/utils/path'
import { createPatternContainer, Pattern } from '@/core/pattern'
import { readTextFile } from '@tauri-apps/api/fs'
import { loadFilesByGlob } from '@/bridge/cmd'
import { timeout } from '@/utils/promise'
import { load } from 'js-yaml'

class Repository {
  private lastLoadedFile: string | undefined

  #tree: Ref<Tree | undefined> = ref()
  #languages: Ref<Record<string, string>> = shallowRef(Object.create(null))
  #sortedLanguages: ComputedRef<string[]> = computed(() =>
    Object.keys(this.#languages.value).sort()
  )
  #histories: Ref<EditHistoryManager> = shallowRef() as any

  get tree(): Tree {
    return this.#tree.value!
  }

  get languagesMap(): Record<string, string> {
    return this.#languages.value
  }

  get languages(): string[] {
    return this.#sortedLanguages.value
  }

  get histories(): EditHistoryManager {
    return this.#histories.value
  }

  async load(filePath: string) {
    await this.loadFile((this.lastLoadedFile = unixPath(filePath)))
  }

  async reload() {
    if (this.lastLoadedFile) await this.loadFile(this.lastLoadedFile)
  }

  private async loadFile(filepath: string) {
    const currentDir = dir(filepath)
    const pattern = await createPatternContainer(filepath)
    this.#languages.value = pattern.languages
    const files: Record<string, ResourceNode> = Object.create(null)
    // root
    files[''] = createResourceNode('')

    const processFile = async (f: string, p: Pattern) => {
      // normalize
      f = removeTrailingSlash(f)

      const name = f.match(p.path)?.[1]
      if (!name) return
      // create parent/cur nodes
      name.split('/').reduce((parentName, path) => {
        const cur = parentName ? join(parentName, path) : path
        if (!files[cur]) {
          files[cur] = createResourceNode(cur)
          files[parentName].children.push(files[cur])
        }
        return cur
      }, '')

      const node = files[name]

      const lang = f.match(p.lang)?.[1]
      if (!lang) return
      if (!pattern.languages[lang]) return
      const translations =
        node.translations || (node.translations = Object.create(null))
      translations.push({
        lang,
        filepath: f,
        content: load(await readTextFile(f), {
          filename: f,
        }) as TranslationFileContent,
      })
    }

    await Promise.all(
      pattern.patterns.map(async (p) => {
        const fileList = await loadFilesByGlob(join(currentDir, p.glob))
        await Promise.all(fileList.map((f) => processFile(f, p)))
      })
    )
    // make smooth :)
    await timeout(() => {
      this.#tree.value = new Tree(files[''].children)
      this.#histories.value = new EditHistoryManager(this.#tree.value)
    }, 1000)
  }
}

export const store = new Repository()
