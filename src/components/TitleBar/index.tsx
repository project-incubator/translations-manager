import styles from './index.module.less'
import { defineComponent } from 'vue'
import { useAppWindow } from '@/hooks/useAppWindow'

const SvgIcon = (d: string) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
  >
    <path d={d} fill="currentColor" />
  </svg>
)

export const TitleBar = defineComponent(() => {
  const { state, minimize, maximize, close } = useAppWindow()

  return () => (
    <div data-tauri-drag-region class={styles.titleBar} onDblclick={maximize}>
      <div onClick={minimize}>{SvgIcon('M20 14H4v-4h16')}</div>
      <div
        class={!state.allowToggleMaximize && styles.disabled}
        onClick={maximize}
      >
        {SvgIcon('M4 4h16v16H4V4m2 4v10h12V8H6z')}
      </div>
      <div onClick={close}>
        {SvgIcon(
          'M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z'
        )}
      </div>
    </div>
  )
})
