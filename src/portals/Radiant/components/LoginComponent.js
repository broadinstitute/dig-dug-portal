import Vue from "vue";

Vue.prototype.$access = "";


export const SignIn = async function(user, pass) { 
  const myData = {
    username: user,
    password: pass,
    group: "radiant"
  };
  postData('https://users.kpndataregistry.org/api/auth/login/', myData)
  .then(data => {
    //console.log('Success:', data);
    console.log("success:", data.access);
    //Vue.prototype.$access = data.access;
    localStorage.setItem('authToken', data.access);
    //console.log("forward", Vue.prototype.$access);
    location.href = 'index.html';
    
  })
  .catch(error => {
    console.error('Failed to post data:', error);
  });
};


async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST', // Specify the HTTP method as POST
      headers: {
        'Content-Type': 'application/json', // Indicate the content type of the body
        'Accept': 'application/json' // Indicate the accepted response type
      },
      body: JSON.stringify(data) // Convert the data object to a JSON string
    });

    if (!response.ok) { // Check if the response was successful
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json(); // Parse the JSON response
    return responseData;
  } catch (error) {
    console.error('Error during POST request:', error);
    throw error; // Re-throw the error for further handling
  }
}


export const SignOut = async function() {
  /*await msalInstance
    .logout({})
    .then(() => {
      this.$emitter.emit('logout', 'logging out');
    })
    .catch(error => {
      console.error(error);
    });*/
};

export const CheckSignInStatus = async function(){  
  /*
  curl "https://users.kpndataregistry.org/api/auth/verify/?group=sgc" -H "Content-Type: application/json" \
    -H "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU5MzMxMDk0LCJpYXQiOjE3NTkyNDQ2OTQsImp0aSI6IjU3NDM1NDdlYTQ4ZDRiMjZiMTQyNzBiODVlZTRhM2Y2IiwidXNlcl9pZCI6MjcsInBlcm1pc3Npb25zIjpbInNnYy11cGxvYWQtZGF0YSJdLCJncm91cCI6InNnYyIsImdyb3VwX2lkIjozLCJ1c2VybmFtZSI6InNnYy11cGxvYWRlciJ9.Dij-mBqir6rJwRS6sGrSrqHt2cfaDaiRTxA7f-Uaxz4"
    */
  //console.log(Vue.prototype);
  //console.log('checkSignInStatus', Vue.prototype.$access);
  const access = localStorage.getItem('authToken');
  const url = "https://users.kpndataregistry.org/api/auth/verify/?group=radiant";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Verification result:", data);
  } catch (error) {
    console.error("Error verifying auth:", error);
    location_href = 'login.html';
  }
  /*const accounts = msalInstance.getAllAccounts();
  //alert(accounts.length);
  if(accounts.length === 0){
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
  }
  //Vue.prototype.$useremail = 'test@childrens.harvard.edu';
  //Vue.prototype.$sampleIDaccess = [];
  Vue.prototype.$sampleIDaccess = ['han.zhang@childrens.harvard.edu', 'courtney.french@childrens.harvard.edu']; */
  
  
};


