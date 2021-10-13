declare module 'primevue/scrollpanel' {
  import { VNode } from 'vue'
  interface ScrollPanelProps {
    style?: string
  }

  class ScrollPanel {
    $props: ScrollPanelProps
    $slots: {
      '': VNode[]
    }
  }

  export default ScrollPanel
}
