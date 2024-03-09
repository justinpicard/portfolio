import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import "./assets/styles/main.scss"
import "./assets/scripts/script.js"

// 1. Assign app to a variable
let app = createApp(App)

// 3. Use router and mount app
app.use(router)
app.mount('#app')