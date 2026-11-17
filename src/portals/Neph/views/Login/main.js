import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import cookie from 'vue-cookies';
import Template from "./Template.vue";
import store from "./store.js";


Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import { msalConfig, PublicClientApplication } from '@azure/msal-browser';
//import logincomponent from "@/portals/Neph/components/LoginComponent.vue";

new Vue ({
  store,
  name: 'HeaderBar',
  data() {
    return {
      account: undefined,
      //github: 'https://github.com/cmatskas',
      //twitter: 'https://twitter.com/christosmatskas',
      //signin: 'https://microsoft.com',
    };
  },
  async created() {
    this.$msalInstance = new PublicClientApplication(
      this.$store.state.msalConfig,
    );
    //alert("before sign in");
    this.SignIn();
    //alert("after sign in");
  },
  mounted() {
    const accounts = this.$msalInstance.getAllAccounts();
    if (accounts.length == 0) {
      return;
    }
    this.account = accounts[0];
    this.$emitter.emit('login', this.account);
  },
  methods: {
    async SignIn() {
      await this.$msalInstance
        //.loginPopup({})
        .loginRedirect({})
        .then(() => {
          const myAccounts = this.$msalInstance.getAllAccounts();
          this.account = myAccounts[0];
          this.$emitter.emit('login', this.account);
        })
        .catch(error => {
          console.error(`error during authentication: ${error}`);
        });
    },
    async SignOut() {
      await this.$msalInstance
        .logout({})
        .then(() => {
          this.$emitter.emit('logout', 'logging out');
        })
        .catch(error => {
          console.error(error);
        });
    },
  },
}).$mount("#app");