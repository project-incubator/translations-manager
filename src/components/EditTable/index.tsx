import {
  computed,
  defineComponent,
  reactive,
  Ref,
  ref,
  shallowRef,
  toRef,
  watch,
} from 'vue'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import styles from './index.module.less'
import { arrayMapToObject } from '@/utils/object'
import { useDebounce } from '@/hooks/useDebounce'
import { NormalizedNode } from '@/core/tree'
import { store } from '@/core/store'
import { ComponentPublicInstance } from '@vue/runtime-core'
import { useToast } from 'primevue/usetoast'

export const EditTable = defineComponent(() => {
  const { filter, expandedKeys } = useFilter()

  const toast = useToast()
  const handleUndo = () => {
    const op = store.histories.undo()
    if (!op) return
    const { newValue, oldValue } = op
    toast.add({
      severity: 'info',
      summary: 'Undo Successfully',
      detail: `${JSON.stringify(newValue)}\n🡳\n${JSON.stringify(oldValue)}`,
      life: 2000,
    })
  }
  const handleRedo = () => {
    const op = store.histories.redo()
    if (!op) return
    const { newValue, oldValue } = op
    toast.add({
      severity: 'info',
      summary: 'Redo Successfully',
      detail: `${JSON.stringify(oldValue)}\n🡳\n${JSON.stringify(newValue)}`,
      life: 2000,
    })
  }
  const handleSaveChanges = async () => {
    try {
      const { total } = await store.histories.saveChanges()
      toast.add({
        severity: 'success',
        summary: 'Successful Saved',
        detail: `Total changed files: ${total}.`,
        life: 2000,
      })
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `${e}`,
        life: 5000,
      })
    }
  }

  const header = () => (
    <div class={styles.toolbar}>
      <span v-tooltip={'Undo'}>
        <Button
          class="p-button-rounded p-button-text p-button-plain p-button-sm"
          icon="pi pi-undo"
          disabled={store.histories.undoSize === 0}
          onClick={handleUndo}
        />
      </span>
      <span v-tooltip={'Redo'}>
        <Button
          class="p-button-rounded p-button-text p-button-plain p-button-sm"
          icon="pi pi-refresh"
          disabled={store.histories.redoSize === 0}
          onClick={handleRedo}
        />
      </span>
      <Button
        class="p-button-rounded p-button-text p-button-plain p-button-sm"
        icon="pi pi-save"
        v-tooltip={'Save All Changes'}
        onClick={handleSaveChanges}
      />
    </div>
  )

  const nameColumnSlots = {
    body: ({ node }: { node: NormalizedNode }) => {
      return (
        <span>
          <i
            class={`pi ${node.type === 'entry' ? 'pi-key' : 'pi-folder'} ${
              styles.icons
            }`}
          />
          {node.type === 'entry' ? node.entry.key : node.name}
        </span>
      )
    },
    filter: () => getFilterSearchInput(toRef(filter, 'name')),
  }

  const {
    inputRef,
    currentInput,
    currentEditing,
    handleClick,
    handleDbClick,
    handleKeyDown,
  } = useEditable()

  const languageColumns = computed(() =>
    store.languages.map((lang) => (
      <Column
        columnKey={lang}
        header={store.languagesMap[lang]}
        v-slots={{
          body: ({ node }: { node: NormalizedNode }) =>
            node.type === 'entry' && node.entry.values ? (
              currentEditing.value?.node === node &&
              currentEditing.value?.lang === lang ? (
                <InputText
                  type="text"
                  v-model={[currentInput.value]}
                  class={`p-inputtext-sm ${styles.editInput}`}
                  data-node-key={node.key}
                  data-lang={lang}
                  ref={inputRef}
                  onKeydown={handleKeyDown}
                />
              ) : (
                <span
                  data-node-key={node.key}
                  data-lang={lang}
                  class={styles.cell}
                >
                  {node.entry.values[lang]}
                </span>
              )
            ) : (
              <span />
            ),
          filter: () => getFilterSearchInput(toRef(filter, lang)),
        }}
      />
    ))
  )

  return () => (
    <div>
      <div class={styles.table}>
        <TreeTable
          value={store.tree.data}
          expandedKeys={expandedKeys.value}
          v-slots={{ header }}
          scrollable={true}
          scrollHeight="calc(100vh - 92px)"
          onDblclick={handleDbClick}
          onClick={handleClick}
        >
          <Column
            columnKey="name"
            header="Name"
            expander={true}
            v-slots={nameColumnSlots}
          />
          {...languageColumns.value}
        </TreeTable>
      </div>
    </div>
  )
})

function useFilter() {
  const expandedKeys = shallowRef<Record<string, boolean>>(Object.create(null))
  const filter = reactive<Record<string, string>>(Object.create(null))
  const highlights = ref<NormalizedNode[]>([])
  const debounce = useDebounce(200)

  const handleFilter = () => {
    const matched = store.tree.findNodeByRegex(filter)
    highlights.value.forEach((node) => ((node as any).styleClass = undefined))
    highlights.value = matched.map((node) => {
      ;(node as any).styleClass = styles.highlight
      return node
    })
    if (matched.length) {
      expandedKeys.value = arrayMapToObject(
        store.tree.findAllParents(matched),
        ({ key }) => ({
          key,
          value: true,
        })
      )
    }
  }

  watch(filter, () => debounce(handleFilter), {
    deep: true,
  })

  return {
    expandedKeys,
    filter,
  }
}

function getFilterSearchInput(model: Ref<string>) {
  return (
    <InputText
      type="text"
      v-model={[model.value]}
      class="p-column-filter p-inputtext-sm"
    />
  )
}

type Editing = {
  node: NormalizedNode & { type: 'entry' }
  lang: string
}

type NodeDataset = {
  nodeKey?: string
  lang?: string
}

function editingEqualsDataset(editing: Editing, dataset: NodeDataset) {
  return editing.node.key === dataset.nodeKey && editing.lang === dataset.lang
}

function useEditable() {
  const currentEditing = ref<Editing | undefined>()
  const currentInput = ref<string | undefined>()
  const startEdit = ({ nodeKey, lang }: NodeDataset) => {
    if (!nodeKey || !lang) return
    const node = store.tree.getNodeByKey(nodeKey)
    if (!node || node.type !== 'entry' || !node.entry.values) return
    currentEditing.value = { node, lang }
    currentInput.value = node.entry.values[lang] || ''
  }
  const finishEdit = () => {
    if (!currentEditing.value) return
    const { node, lang } = currentEditing.value
    if (node.entry.values?.[lang] !== currentInput.value) {
      // push action
      store.histories.pushEditAction({
        node,
        lang,
        newValue: currentInput.value || '',
      })
    }
    // save state
    resetEditState()
  }
  const resetEditState = () => {
    currentEditing.value = undefined
    currentInput.value = undefined
  }

  const startEditSibling = (
    current: Editing,
    direction: 'forward' | 'backward'
  ) => {
    const languages = store.languages
    const currentLangIndex = languages.indexOf(current.lang)
    const nextLangIndex =
      direction === 'forward' ? currentLangIndex + 1 : currentLangIndex - 1
    if (nextLangIndex < 0 || nextLangIndex >= languages.length) return
    startEdit({
      lang: languages[nextLangIndex],
      nodeKey: current.node.key,
    })
  }

  const handleClick = (ev: MouseEvent) => {
    const data = (ev.target as HTMLElement).dataset as NodeDataset
    if (currentEditing.value) {
      if (editingEqualsDataset(currentEditing.value, data)) return
      resetEditState()
    }
    return
  }

  const handleDbClick = (ev: MouseEvent) => {
    const data = (ev.target as HTMLElement).dataset as NodeDataset
    if (currentEditing.value) {
      // double clicking on other elements cancels edit
      if (!data.nodeKey) {
        resetEditState()
      } else if (!editingEqualsDataset(currentEditing.value, data)) {
        // double clicking on other editable cells,
        // first finish current edit and then start new one
        finishEdit()
        startEdit(data)
      }
      return
    }
    startEdit(data)
  }

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (currentEditing.value) {
      switch (ev.key) {
        case 'Enter':
          finishEdit()
          break
        case 'Escape':
          resetEditState()
          break
        case 'Tab': {
          const current = currentEditing.value
          finishEdit()
          startEditSibling(current, ev.shiftKey ? 'backward' : 'forward')
          ev.stopPropagation()
          ev.preventDefault()
          break
        }
      }
    }
  }

  const inputRef = ref<ComponentPublicInstance | null>(null)

  watch(
    inputRef,
    () => {
      const input = inputRef.value?.$el as HTMLInputElement | undefined
      if (input) {
        input.select()
        input.setSelectionRange(0, 0)
      }
    },
    {
      flush: 'post',
    }
  )

  return {
    inputRef,
    handleClick,
    handleDbClick,
    handleKeyDown,
    currentEditing,
    currentInput,
  }
}
