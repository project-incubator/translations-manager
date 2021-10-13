import { shallowReactive } from 'vue'
import {
  editTranslationFile,
  NormalizedNode,
  serializeTranslationFile,
  TranslationFile,
  Tree,
} from '@/core/tree'

export type EditHistory = EditAction & { oldValue: string }

export type EditAction = {
  node: NormalizedNode & { type: 'entry' }
  lang: string
  newValue: string
}

export class EditHistoryManager {
  constructor(
    private tree: Tree,
    private historyStack: EditHistory[] = shallowReactive([]),
    private redoStack: EditHistory[] = shallowReactive([]),
    private maxStackSize = 30,
    private editedFiles: Set<TranslationFile> = new Set()
  ) {}

  get undoSize() {
    return this.historyStack.length
  }

  get redoSize() {
    return this.redoStack.length
  }

  pushEditAction({ node, lang, newValue }: EditAction) {
    this.historyStack.push({
      node,
      lang,
      newValue,
      oldValue: node.entry.values?.[lang] || '',
    })
    if (this.historyStack.length > this.maxStackSize)
      this.historyStack.splice(0, this.historyStack.length - this.maxStackSize)
    this.redoStack.splice(0)
    this.editEntry({ node, lang, newValue })
  }

  // returns boolean to dedicate whether edit successfully
  private editEntry({ node, lang, newValue }: EditAction) {
    if (!node.entry.values) return
    // edit on normalized tree to display new value
    node.entry.values[lang] = newValue
    // edit on resource tree to sync changes
    const resourceNode = this.tree.getResourceNodeOfNode(node)!
    const file = resourceNode.translations.find((node) => node.lang === lang)!
    editTranslationFile(file, node.entry.keyPath, newValue)
    this.editedFiles.add(file)
  }

  undo() {
    const op = transferTop(this.historyStack, this.redoStack)
    if (!op) return
    const { node, lang, oldValue } = op
    this.editEntry({
      node,
      lang,
      newValue: oldValue,
    })
    return op
  }

  redo() {
    const op = transferTop(this.redoStack, this.historyStack)
    if (!op) return
    const { node, lang, newValue } = op
    this.editEntry({
      node,
      lang,
      newValue,
    })
    return op
  }

  async saveChanges(): Promise<{
    total: number
  }> {
    const tasks: Promise<any>[] = []
    this.editedFiles.forEach((file) =>
      tasks.push(serializeTranslationFile(file))
    )
    await Promise.all(tasks)
    this.editedFiles.clear()
    return {
      total: tasks.length,
    }
  }
}

function transferTop<T>(from: T[], to: T[]) {
  if (!from.length) return
  const op = from.pop()
  if (!op) return
  to.push(op)
  return op
}
