import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app
  .provide('$VUE_APP_CONTEXT', (window?.qti3PlayerContext || null))
  .mount('#app')