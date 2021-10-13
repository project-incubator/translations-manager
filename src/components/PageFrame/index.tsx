import { defineComponent } from 'vue'
import Toast from 'primevue/toast'
import { TitleBar } from '@/components/TitleBar'
import styles from './index.module.less'

export const PageFrame = defineComponent({
  render() {
    return (
      <div class={styles.pageFrame}>
        <TitleBar />
        <Toast position="bottom-right" />
        <div class={styles.pageBody}>{this.$slots.default?.()}</div>
      </div>
    )
  },
})
