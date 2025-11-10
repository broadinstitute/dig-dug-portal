import Vue from "vue";

Vue.prototype.$access = "";


export const SignIn = async function(user, pass) { 
  const myData = {
    username: user,
    password: pass,
    group: "radiant"
  };
  console.log(myData);
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

export const ChangePass = async function(user, pass, npass) { 
  /*const myData = {
    username: user,
    password: pass,
    group: "radiant"
  };
  postData('https://users.kpndataregistry.org/api/users/', myData)
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
  });*/
  const access = localStorage.getItem('authToken');
  console.log("authToken:"+access);
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
      const id = data.user.id;
      const username = data.user.username;
      if (username.toLowerCase() == user.toLowerCase()) {
        const access1 = localStorage.getItem('authToken');
        console.log("authToken:"+access1);
        const userURL = "https://users.kpndataregistry.org/api/users/"+id+"/";
        const newdata = {
          "username": username,
          "email": data.user.email,
          "first_name": data.user.first_name,
          "last_name": data.user.last_name,
          "password": npass
        };
        console.log(newdata);
        const response1 = await fetch(userURL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Accept': 'application/json',
            "Authorization": `Bearer ${access1}`
          },
          body:JSON.stringify(newdata)
        });

        if (!response1.ok) { // Check if the response was successful
          throw new Error(`HTTP error! status: ${response1.status}`);
        }

        location.href = "login.html";
    
        //const responseData1 = await response1.json(); // Parse the JSON response
        //return responseData1;

      } else {
        console.log("Cannot change password.");
      }
  } catch (error) {
      console.error("Error verifying auth:", error);
      location.href = 'login.html';
  }
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
    location.href = 'login.html';
  }
  
  
};


