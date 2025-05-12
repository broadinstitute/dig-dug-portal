/*
    creates custom 'llog()' method
    to replace console.log()

    which can be enabled or disabled via querystring params
    log=1               (enabled)
    log=0 or missing    (disabled)      *default
*/

const params = new URLSearchParams(window.location.search);
const isLoggingEnabled = params.get("dev") === "1";

if(!isLoggingEnabled){
    console.log('single-cell logging disabled, add dev=1 to url to enable');
}

export function llog(...args) {
  if (isLoggingEnabled) {
    //this always shows llog:XX in the console, so we dont know the orignal called
    ///console.log(...args);

    //include the stack strace 
    //so we can see where the original console.log call is coming from
    console.groupCollapsed(...args);
    console.trace();
    console.groupEnd();
  }
}