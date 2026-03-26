import { createApp } from 'vue'
import OrderKeyboardTestApp from './OrderKeyboardTestApp.vue'

createApp(OrderKeyboardTestApp)
  .provide('$VUE_APP_CONTEXT', (window?.qti3PlayerContext || null))
  .mount('#app')
