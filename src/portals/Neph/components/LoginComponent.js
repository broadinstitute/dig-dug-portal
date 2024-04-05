import Vue from "vue";
/*import { PublicClientApplication ,AuthenticationParameters,Configuration,} from '@azure/msal-browser';

function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// Config object to be passed to Msal on creation
export const msalConfig = {
    auth: {
        clientId: "1f14c4d1-1c96-4ab9-9076-c7b3d1ec1549",
        authority: "https://custauthdev.childrens.harvard.edu/adfs", 
        knownAuthorities: ["https://custauthdev.childrens.harvard.edu/adfs"], 
        redirectUri: "https://aggregator.bchresearch.org"
    },
    cache: {
        //cacheLocation: 'localStorage'
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false,
    },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
  scopes: ['User.Read'],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

export const SignIn = async function() {
    await msalInstance
      .loginRedirect(loginRequest)
      .then(() => {
        alert("after login");
        const myAccounts = msalInstance.getAllAccounts();
        if (myAccounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }
        this.account = myAccounts[0];
        this.$emitter.emit('login', this.account);
      })
      .catch(error => {
        alert("login error");
        console.error(`error during authentication: ${error}`);
      });
};

export const SignOut = async function() {
  await msalInstance
    .logout({})
    .then(() => {
      this.$emitter.emit('logout', 'logging out');
    })
    .catch(error => {
      console.error(error);
    });
}*/;

export const CheckSignInStatus = async function(){  
  //await msalInstance.handleRedirectPromise();
  //const accounts = msalInstance.getAllAccounts();
  //alert(accounts.length);
  /*if(accounts.length === 0){
      SignIn();
  } else {
    msalInstance.setActiveAccount(accounts[0]);
    await msalInstance.acquireTokenSilent(loginRequest)
      .then(function (accessTokenResponse) {
        // Acquire token silent success
        let accessToken = accessTokenResponse.accessToken;
        // Call your API with token
        let token = parseJwt(accessToken);
        //console.log("token: "+token.sub);
        Vue.prototype.$useremail = token.sub;
        if (token.group != "AggregatorGroupMember"){
          location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSdNGINQBLhcSb77_X89Af-Tl6E9t609bFTiKOvw0UXmKyiWPw/viewform';
        }
      })
      .catch(function (error) {
        //Acquire token silent failure, and send an interactive request
        alert("error: "+error);
      });
  }*/
  Vue.prototype.$useremail = '';
  //Vue.prototype.$sampleIDaccess = [];
  Vue.prototype.$sampleIDaccess = ['han.zhang@childrens.harvard.edu', 'courtney.french@childrens.harvard.edu']; 
  
  
};


