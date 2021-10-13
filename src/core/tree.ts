import { arrayMapToObject, objectMap } from '@/utils/object'
import { dump } from 'js-yaml'
import { writeFile } from '@tauri-apps/api/fs'

export type TreePath = string[]

export type RecursiveObject<F, K = string> =
  | { [key: string]: RecursiveObject<F, K> }
  | F

export type TranslationEntry = RecursiveObject<string>

export type TranslationFileContent = Record<string, TranslationEntry>

export type TranslationFile = {
  lang: string
  filepath: string
  content: TranslationFileContent
}

export function editTranslationFile(
  file: TranslationFile,
  keyPath: string[],
  newValue: string
) {
  const length = keyPath.length
  let curLayer = file.content
  for (let i = 0; i < length - 1; i++) {
    curLayer =
      curLayer[keyPath[i]] || (curLayer[keyPath[i]] = Object.create(null))
  }
  curLayer[keyPath[length - 1]] = newValue
}

const dumpOptions = { indent: 2 }

export function serializeTranslationFile(file: TranslationFile) {
  return writeFile({
    contents: dump(file.content, dumpOptions),
    path: file.filepath,
  })
}

export type ResourceNode = {
  id: string
  path: TreePath
  translations: TranslationFile[]
  children: ResourceNode[]
}

export function createResourceNode(id: string): ResourceNode {
  return {
    id,
    path: id.split('/'),
    translations: [],
    children: [],
  }
}

export type NormalizedNode = {
  key: string
  path: TreePath
  parent?: NormalizedNode
  children: NormalizedNode[]
} & (
  | {
      type: 'directory'
      name: string
    }
  | {
      type: 'directory-with-translations'
      name: string
      files: { [lang: string]: string }
    }
  | {
      type: 'entry'
      entry: {
        key: string
        keyPath: TreePath
        values?: { [lang: string]: string }
      }
    }
)

export function findParent(node: NormalizedNode, type: NormalizedNode['type']) {
  let parent = node.parent
  while (parent) {
    if (parent.type === type) return parent
    parent = parent.parent
  }
  return
}

export function linkNode(parent: NormalizedNode, child: NormalizedNode) {
  child.parent = parent
  parent.children.push(child)
}

function normalizeResourceTree(resourceTree: ResourceNode) {
  return normalizeResourceNode(resourceTree)
}

function normalizeResourceNode(node: ResourceNode) {
  return node.translations.length
    ? normalizeDirWithTranslationNode(node)
    : normalizeDirNode(node)
}

function normalizeDirNode(node: ResourceNode) {
  const normalizedNode: NormalizedNode = {
    key: node.id,
    path: node.path,
    children: [],
    type: 'directory',
    name: node.path[node.path.length - 1],
  }
  node.children.forEach((child) => {
    linkNode(normalizedNode, normalizeResourceNode(child))
  })
  return normalizedNode
}

function normalizeDirWithTranslationNode(
  node: ResourceNode & {
    translations: Exclude<ResourceNode['translations'], undefined>
  }
) {
  const normalizedNode: NormalizedNode = {
    key: node.id,
    path: node.path,
    children: [],
    type: 'directory-with-translations',
    files: arrayMapToObject(node.translations, ({ lang, filepath }) => ({
      key: lang,
      value: filepath,
    })),
    name: node.path[node.path.length - 1],
  }

  createEntryNodes(
    normalizedNode,
    node.translations.map(({ lang, content }) => ({ lang, entry: content }))
  )

  node.children.forEach((child) => {
    linkNode(normalizedNode, normalizeResourceNode(child))
  })

  return normalizedNode
}

function createEntryNodes(
  parent: NormalizedNode,
  values: { lang: string; entry?: Exclude<TranslationEntry, string> }[]
) {
  const allSubKeys = Array.from(
    new Set(values.flatMap((v) => (v.entry ? Object.keys(v.entry) : [])))
  )
  allSubKeys.forEach((key) => {
    const isLeaf = values.find((item) => typeof item.entry?.[key] === 'string')
    if (isLeaf) {
      createLeafEntryNode(
        parent,
        key,
        arrayMapToObject(values, ({ lang, entry }) => ({
          key: lang,
          value: entry?.[key] || '',
        }))
      )
    } else {
      createEntryNode(
        parent,
        key,
        values.map(({ lang, entry }) => ({
          lang,
          entry: entry?.[key] as Exclude<TranslationEntry, string>,
        }))
      )
    }
  })
}

function createEntryNode(
  parent: NormalizedNode,
  key: string,
  values: { lang: string; entry?: Exclude<TranslationEntry, string> }[]
) {
  const node: NormalizedNode = {
    key: `${parent.key}.${key}`,
    path: [...parent.path, key],
    children: [],
    type: 'entry',
    entry: {
      key,
      keyPath: parent.type === 'entry' ? [...parent.entry.keyPath, key] : [key],
    },
  }
  linkNode(parent, node)
  createEntryNodes(node, values)

  return node
}

function createLeafEntryNode(
  parent: NormalizedNode,
  key: string,
  values: { [lang: string]: string }
) {
  const node: NormalizedNode = {
    key: `${parent.key}.${key}`,
    path: [...parent.path, key],
    children: [],
    type: 'entry',
    entry: {
      key,
      keyPath: parent.type === 'entry' ? [...parent.entry.keyPath, key] : [key],
      values,
    },
  }
  linkNode(parent, node)
  return node
}

function traverse<T extends { children: T[] }>(
  roots: T[],
  fn: (node: T) => unknown
) {
  roots.forEach((root) => _traverse(root))
  function _traverse(node: T) {
    fn(node)
    node.children.forEach((child) => _traverse(child))
  }
}

export class Tree {
  private readonly roots: NormalizedNode[]
  private readonly nodeMap: { [key: string]: NormalizedNode } =
    Object.create(null)
  private readonly resourceMap: { [id: string]: ResourceNode } =
    Object.create(null)

  constructor(private resourceTrees: ResourceNode[]) {
    this.roots = resourceTrees.map(normalizeResourceTree)
    traverse(this.roots, (node) => (this.nodeMap[node.key] = node))
    traverse(resourceTrees, (node) => (this.resourceMap[node.id] = node))
  }

  get data() {
    return this.roots
  }

  getNodeByKey(key: string): NormalizedNode | undefined {
    return this.nodeMap[key]
  }

  findNodeByRegex(_filter: Record<string, string>) {
    const filter = objectMap(_filter, (key, value) => ({
      key,
      value: value ? new RegExp(String.raw({ raw: value }), 'i') : undefined,
    }))
    const searchName = filter['name']
    const filterKeys = Object.keys(filter).filter(
      (k) => k !== 'name' && !!filter[k]
    )
    if (!searchName && !filterKeys.length) return []

    const result: NormalizedNode[] = []
    this.roots.forEach(find)
    return result

    function find(node: NormalizedNode) {
      if (node.type === 'entry') {
        if (
          (!searchName || searchName.test(node.entry.key)) &&
          (!filterKeys.length ||
            filterKeys.every((key) => {
              const v = node.entry.values?.[key]
              return v && filter[key]?.test(v)
            }))
        )
          result.push(node)
      } else if (searchName && searchName.test(node.name)) {
        result.push(node)
      }
      node.children.forEach((child) => find(child))
    }
  }

  findAllParents(nodes: NormalizedNode[]) {
    const result = new Set<NormalizedNode>()
    let current = new Set(
      nodes
        .map((node) => node.parent)
        .filter((node): node is NormalizedNode => !!node)
    )
    const next = new Set<NormalizedNode>()
    while (current.size) {
      current.forEach((node) => {
        result.add(node)
        node.parent && next.add(node.parent)
      })
      current = new Set(next)
      next.clear()
    }
    return Array.from(result)
  }

  findParent(node: NormalizedNode, type: NormalizedNode['type']) {
    let parent = node.parent
    while (parent) {
      if (parent.type === type) return parent
      parent = parent.parent
    }
  }

  getResourceNode(id: string): ResourceNode | undefined {
    return this.resourceMap[id]
  }

  getResourceNodeOfNode(node: NormalizedNode) {
    const parent = this.findParent(node, 'directory-with-translations')
    if (!parent) return
    return this.getResourceNode(parent.key)
  }
}
