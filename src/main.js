import { createApp } from 'vue'
import "./assets/styles/main.scss"
//import './style.css'
import App from './App.vue'
import router from './router'

// 1. Assign app to a variable
let app = createApp(App)

// 3. Use router and mount app
app.use(router)
    .mount('#app')
