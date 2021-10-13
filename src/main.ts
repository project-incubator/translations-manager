import { createApp } from 'vue'
import { App } from './App'
import 'primevue/resources/primevue.min.css'
import 'primevue/resources/themes/tailwind-light/theme.css'
import 'primeicons/primeicons.css'
import './global.less'

import ToastService from 'primevue/toastservice'
import ConfigService from 'primevue/config'
import Tooltip from 'primevue/tooltip'

createApp(App)
  .use(ConfigService)
  .use(ToastService)
  .directive('tooltip', Tooltip)
  .mount('#app')
