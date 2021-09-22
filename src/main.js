/* eslint-disable */
import Vue from 'vue'
import App from './App'
import vuetify from './plugins/vuetify'
import underscore from './plugins/ic-underscore.js';
import VueLuxon from "vue-luxon";
import VueAxios from "vue-axios";
import axios from "axios";
import router from "./router";
import store from "./store";
import VueClipboard from 'vue-clipboard2'
import './registerServiceWorker'

Vue.use(VueClipboard)

const { DateTime } = require("luxon");

Vue.use(VueLuxon, {
  templates: {},
  input: {
    zone: "utc",
    format: "seconds"
  },
  output: {
    zone: "local",
    format: "LLL d HH:mm",
    locale: null,
    relative: {
      round: true,
      unit: null
    }
  }
});

Vue.use(VueAxios, axios);
Vue.use(require('vue-resource'))
Vue.use(underscore)

Vue.filter("appleDate", function (value) {
  if (!value) return "";

  var tmp = DateTime.fromSeconds(value / 1000000000 + 978223302, {
    zone: "UTC"
  });

  if (tmp.toLocal() >= DateTime.today) {
    return tmp.toLocal().toFormat('h:mm')
  }

  return tmp.toLocal().toFormat('LLL d, yyyy h:mm')
});

const vm = new Vue({
  el: '#app',
  vuetify,
  router,
  store,
  render: h => h(App)
})

window.vm = vm
