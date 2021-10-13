import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { onUnmounted } from 'vue'

export interface UseFileDropOptions {
  onDropHover?: (filepath: string[]) => unknown
  onDrop?: (filepath: string[]) => unknown
  onDropCancelled?: () => unknown
}

export function useFileDrop({
  onDrop,
  onDropCancelled,
  onDropHover,
}: UseFileDropOptions) {
  const discardListeners: Promise<UnlistenFn>[] = []
  if (onDropHover)
    discardListeners.push(
      listen<string[]>('tauri://file-drop-hover', (e) => {
        onDropHover(e.payload)
      })
    )
  if (onDrop)
    discardListeners.push(
      listen<string[]>('tauri://file-drop', (e) => {
        onDrop(e.payload)
      })
    )
  if (onDropCancelled)
    discardListeners.push(
      listen('tauri://file-drop-cancelled', () => {
        onDropCancelled()
      })
    )

  onUnmounted(async () => {
    for (const discard of discardListeners) (await discard)()
  })
}
