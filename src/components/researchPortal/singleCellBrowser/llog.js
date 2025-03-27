/*
    creates custom 'llog()' method
    to replace console.log()

    which can be enabled or disabled via querystring params
    log=1               (enabled)
    log=0 or missing    (disabled)      *default
*/

const params = new URLSearchParams(window.location.search);
const isLoggingEnabled = params.get("log") === "1";

if(!isLoggingEnabled){
    console.log('single-cell logging disabled, add log=1 to url to enable');
}

export function llog(...args) {
  if (isLoggingEnabled) {
    console.log(...args);
  }
}