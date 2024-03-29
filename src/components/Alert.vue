<template></template>

<script>
import Vue from "vue";
import Counter from "@/utils/idCounter";
import EventBus from "@/utils/eventBus";
import logErrorEvent from "@/utils/gaUtils";

export default Vue.component("alert", {
    data() {
        return {
            message: null,
        };
    },
    mounted() {
        EventBus.$on("ALERT", this.pushAlert);
        EventBus.$on("CLOSE_ALERT", this.popAlert);
        EventBus.$on("UPDATE_ALERT", this.processAlertQueue);
    },

    methods: {
        showAlert(alert) {
            const title = {
                info: "Information",
                success: "Success",
                warning: "Warning",
                danger: "Error!",
                primary: "Notice",
                secondary: "Status",
            };

            this.$bvToast.toast(alert.message, {
                id: alert.params ? alert.params.id : null,
                variant: alert.type,
                title: `${title[alert.type]}`,
                solid: true,
                toaster: "b-toaster-bottom-right",
                autoHideDelay: 10000,
                noAutoHide: alert.params ? alert.params.noHide : false,
                appendToast: true,
                noCloseButton: alert.params ? alert.params.noClose : false,
            });
        },
        closeAlert(id) {
            /* This is using a setTimeout because it's possible to post
             * the alert and close faster than the toast can be added
             * to the DOM. If that happens, the toast will stay up and
             * never close. By waiting 100 ms, the DOM has enough time
             * to add it, and then we can close it.
             */
            let that = this;
            setTimeout(() => that.$bvToast.hide(id), 200);
        },
        pushAlert(alert) {
            alertQueue.push(() => this.showAlert(alert));
        },
        popAlert(id) {
            alertQueue.push(() => this.closeAlert(id));
        },
        processAlertQueue() {
            alertQueue.forEach((f) => f());
            alertQueue = [];
        },
    },
});

let alertQueue = [];
// https://stackoverflow.com/a/5927432
// http://www.javascriptkit.com/javatutors/requestanimationframe.shtml (cf "Slowing down or cancelling requestAnimationFrame")
const fps = 60;
function animateAlert() {
    updateAlert();
    setTimeout(function () {
        //throttle requestAnimationFrame to 45fps
        requestAnimationFrame(animateAlert);
    }, 1000 / fps);
}
requestAnimationFrame(animateAlert);

const postAlert = function (type, message, params) {
    EventBus.$emit("ALERT", { type, message, params });
};

/**
 * Post an application "Error" alert.
 * Note: 'context' could be more explicit than simply "danger"?
 *
 * @param {string} [message]
 * @param {string} [context]
 * @return {string} unique numeric identifier of the alert
 * @public
 */
const postAlertError = function (message, context) {
    const id = Counter.getUniqueId("alert");
    context = context ? context : "danger";
    EventBus.$emit("ALERT", {
        type: context, //"danger",
        message: message,
        params: { noHide: true, id: id },
    });

    // Logging this alert to Google Analytics
    logErrorEvent(context, message);

    return id;
};
const postAlertNotice = function (message) {
    const id = Counter.getUniqueId("alert");
    //console.log(`Requesting creation of toast #${id}`);
    EventBus.$emit("ALERT", {
        type: "secondary",
        message: message,
        params: { noHide: true, noClose: true, id: id },
    });
    return id;
};
const closeAlert = function (id) {
    //console.log(`Requesting close of toast #${id}`);
    EventBus.$emit("CLOSE_ALERT", id);
};

const updateAlert = function () {
    EventBus.$emit("UPDATE_ALERT");
};

export { postAlert, postAlertError, postAlertNotice, closeAlert };
</script>
