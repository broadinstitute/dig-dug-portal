import Vue from "vue";
import Vuex from "vuex";



Vue.use(Vuex);

export default new Vuex.Store({
    state:{
        msalConfig: {
            auth: {
                clientId: '4a13eb1d-7802-4d02-81ac-bba1e1d30499',
                authority: 'https://login.microsoftonline.com/b54d35ba-107b-42c5-bd3c-20380e971c06',
                redirectUri: 'https://aggregator.bchresearch.org/login', // Must be registered as a SPA redirectURI on your app registration
                //postLogoutRedirectUri: '/' // Must be registered as a SPA redirectURI on your app registration
            },
            cache: {
                cacheLocation: 'localStorage',
            },
        },
        accessToken: ''
    },
    mutations :{
        setAccessToken(state, token){
            state.accessToken = token;
        }
    }
});
