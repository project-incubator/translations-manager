import { computed, defineComponent, ref } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { useFileDrop } from '@/hooks/useFileDrop'
import Button from 'primevue/button'
import styles from './index.module.less'
import { useHoldWindowSize, usePreferredWindowSize } from '@/hooks/useAppWindow'
import { useToast } from 'primevue/usetoast'
import { store } from '@/core/store'

export const Landing = defineComponent(() => {
  usePreferredWindowSize('small')
  useHoldWindowSize()

  const toast = useToast()

  const { handleOpen, isHovering, isLoading } = useFileSelector()

  const openButtonText = computed(() =>
    isHovering.value ? 'Release To Open' : 'Open File'
  )

  const handleNewFile = () =>
    toast.add({ severity: 'info', detail: 'Not Supported Yet', life: 1500 })

  return () => (
    <div class={styles.landing}>
      <p>
        <Button
          loading={isLoading.value}
          label={openButtonText.value}
          icon="pi pi-folder-open"
          onClick={handleOpen}
        />
      </p>
      <p>
        <Button
          disabled={isLoading.value}
          class="p-button-outlined p-button-secondary"
          label="New File"
          icon="pi pi-link"
          onClick={handleNewFile}
        />
      </p>
    </div>
  )
})

function useFileSelector() {
  const isLoading = ref(false)
  const isHovering = ref(false)

  const toast = useToast()

  const handleLoad = async (filepath: string) => {
    try {
      isLoading.value = true
      await store.load(filepath)
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: `Error when load pattern file`,
        detail: `${e}`,
        life: 2000,
      })
    } finally {
      isLoading.value = false
    }
  }

  const handleOpen = async () => {
    const filepath = await open({
      multiple: false,
      filters: [
        {
          name: 'pattern files',
          extensions: ['yaml', 'yml'],
        },
      ],
    })
    if (!filepath) return
    if (Array.isArray(filepath)) return
    await handleLoad(filepath)
  }

  useFileDrop({
    async onDrop(path) {
      if (path.length) await handleLoad(path[0])
    },
    onDropHover() {
      isHovering.value = true
    },
    onDropCancelled() {
      isHovering.value = false
    },
  })

  return { handleOpen, isHovering, isLoading }
}
