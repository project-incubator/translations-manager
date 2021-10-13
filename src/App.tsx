import { defineComponent } from 'vue'
import { Landing } from '@/pages/Landing'
import { PageFrame } from '@/components/PageFrame'
import { Main } from '@/pages/Main'
import { store } from '@/core/store'

export const App = defineComponent(() => {
  return () => <PageFrame>{store.tree ? <Main /> : <Landing />}</PageFrame>
})
