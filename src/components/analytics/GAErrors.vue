<template></template>
<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";

/* HANDLER CALLBACKS */
// there are two of them because the argument structure is
// slightly different between Vue and the browser's own conventions

function vueErrorDescription(error, info) {
    // combine error info into a single description (excluding stracktrace)
    return [error.name + ": " + error.message, info].join(", ");
}

function logError(errorDescription) {
    // get if i'm hitting dev or prod
    const deploymentMode = process.env.NODE_ENV;

    // get current url (window.location.href) and query parameters
    const url = window.location.href;
    const query = window.location.search;

    // DONE: get git version of server code (on server)

    gaUtils.logErrorEvent(errorDescription, deploymentMode, url);
}

/* HANDLERS */
// window handlers
// https://stackoverflow.com/a/37724538
window.addEventListener(
    "error",
    errorEvent => {
        console.log("trigger window ERROR listener");
        console.error(errorEvent.message);
        logError(errorEvent.message);
    },
    true
); // see 'useCapture' under https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

// https://stackoverflow.com/a/49560222
window.addEventListener(
    "unhandledrejection",
    rejectionEvent => {
        console.log("trigger window UNHANDLED_REJECTION listener");
        logError(rejectionEvent.message);
    },
    true
);

Vue.config.warnHandler = (warning, _, info) => {
    console.log("trigger vue WARN listener");
    console.error(warning);
    logError(vueErrorDescription(warning, info));
};

Vue.config.errorHandler = (error, _, info) => {
    console.log("trigger vue ERROR listener");
    console.error(error);

    logError(vueErrorDescription(error, info));
};

export default Vue.component("ga-errors", {});
</script>
