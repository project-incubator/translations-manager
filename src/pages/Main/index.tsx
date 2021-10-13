import { defineComponent } from 'vue'
import {
  useLockWindowMinSize,
  usePreferredWindowSize,
} from '@/hooks/useAppWindow'
import { EditTable } from '@/components/EditTable'

export const Main = defineComponent(() => {
  usePreferredWindowSize('common')
  useLockWindowMinSize({ width: 860, height: 640 })
  return () => (
    <div>
      <EditTable />
    </div>
  )
})
