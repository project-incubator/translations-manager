import { defineComponent } from 'vue'
import Toast from 'primevue/toast'

export const PageFrame = defineComponent((_, { slots }) => {
  return () => (
    <>
      <Toast position="bottom-right" group="br" />
      {slots.default}
    </>
  )
})
