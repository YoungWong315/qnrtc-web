import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import service from '@/service/service'
import 'normalize.css'

import * as QNRTC from 'pili-rtc-web'

import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)

Vue.config.productionTip = false

Vue.prototype.$service = service
Vue.prototype.$QNRTC = QNRTC

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
