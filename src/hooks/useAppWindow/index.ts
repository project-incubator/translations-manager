import { appWindow, LogicalSize } from '@tauri-apps/api/window'
import { onUnmounted, reactive, toRef } from 'vue'

const state = reactive({
  allowToggleMaximize: true,
  title: 'Translations Manager',
})

export function disableToggleMaximize() {
  state.allowToggleMaximize = false
  appWindow.setResizable(false)
}

export function enableToggleMaximize() {
  state.allowToggleMaximize = true
  appWindow.setResizable(true)
}

export function useHoldWindowSize() {
  disableToggleMaximize()
  onUnmounted(enableToggleMaximize)
}

export function useAppWindow() {
  return {
    state,
    minimize: () => appWindow.minimize(),
    maximize: () => state.allowToggleMaximize && appWindow.toggleMaximize(),
    close: () => appWindow.close(),
  }
}

export async function useSetWindowSize(size: {
  width: number
  height: number
}) {
  await appWindow.setSize(new LogicalSize(size.width, size.height))
  await appWindow.center()
}

export function useLockWindowMinSize(size: { width: number; height: number }) {
  appWindow.setMinSize(new LogicalSize(size.width, size.height))
  onUnmounted(() => {
    appWindow.setMinSize(undefined)
  })
}

const preferredSize = {
  small: {
    height: 450,
    width: 420,
  },
  common: {
    height: 720,
    width: 1280,
  },
}

export function usePreferredWindowSize(size: 'common' | 'small') {
  switch (size) {
    case 'common':
      useSetWindowSize(preferredSize.common)
      break
    case 'small':
      useSetWindowSize(preferredSize.small)
      break
  }
}

export function useWindowTitle(title?: string) {
  if (title) state.title = title
  return toRef(state, 'title')
}
