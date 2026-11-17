<template></template>
<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";


function vueErrorDescription(error, info) {
    return [error.name + ": " + error.message, info].join(", ");
}

function logError(errorDescription) {
    const deploymentMode = process.env.NODE_ENV;

    const url = window.location.href;
    const query = window.location.search;


    gaUtils.logErrorEvent(errorDescription, deploymentMode, url);
}

window.addEventListener(
    "error",
    errorEvent => {
        console.error(errorEvent.message);
        logError(errorEvent.message);
    },
    true
);

window.addEventListener(
    "unhandledrejection",
    rejectionEvent => {
        console.error(rejectionEvent.message);
        logError(rejectionEvent.message);
    },
    true
);

Vue.config.warnHandler = (warning, _, info) => {
    console.error(warning);
    logError(vueErrorDescription(warning, info));
};

Vue.config.errorHandler = (error, _, info) => {
    console.error(error);
    logError(vueErrorDescription(error, info));
};

export default Vue.component("ga-errors", {});
</script>
