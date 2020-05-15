<template></template>
<script>
    import Vue from "vue";
    import gaUtils from "@/utils/gaUtils";
    window.addEventListener("error", errorEvent => {
        console.log("catching error");
        // get if i'm hitting dev or prod
        const devOrProd = process.env.NODE_ENV;

        // get current url (window.location.href) and query parameters
        const url = window.location.href;
        const query = window.location.search;

        // get error
        const { message, filename, lineno, colno, error } = errorEvent;

        // get version of portal code (on portal)
        // DONE: get version of server code (on server)

        gaUtils.logErrorEvent(
            "error",
            JSON.stringify({ url, query, devOrProd, msg, vm, trace }),
        );
    });

    // window.addEventListener("unhandledrejection", rejectionEvent => {
    //     // get if i'm hitting dev or prod
    //     // get current url (window.location.href) and query parameters
    //     // get error

        // get version of portal code (on portal)
        // DONE: get version of server code (on server)

    //     gaUtils.logErrorEvent(context, message);
    // });

    Vue.config.warnHandler = ({ msg, vm, trace }) => {
        console.log('warn handler');

        // get if i'm hitting dev or prod
        const devOrProd = process.env.NODE_ENV;

        // get current url (window.location.href) and query parameters
        const url = window.location.href;
        const query = window.location.search;

        // get version of portal code (on portal)
        // DONE: get version of server code (on server)

        // get error
        gaUtils.logErrorEvent(
            "error",
            JSON.stringify({ url, query, devOrProd, msg, vm, trace }),
        );
    };

    Vue.config.errorHandler = ({ msg, vm, trace })  => {
        console.log('vue error handler');
        console.log(process.env)

        // get if i'm hitting dev or prod
        const devOrProd = process.env.NODE_ENV;

        // get current url (window.location.href) and query parameters
        const url = window.location.href;
        const query = window.location.search;

        // get version of portal code (on portal)
        // DONE: get version of server code (on server)

        // get error
        gaUtils.logErrorEvent(
            "error",
            JSON.stringify({ url, query, devOrProd, msg, vm, trace }),
        );

    };

    export default Vue.component('ga-errors', {

    })

</script>
