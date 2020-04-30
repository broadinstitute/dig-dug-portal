<template></template>

<script>
import Vue from "vue";
import EventBus from "@/utils/eventBus";

export default Vue.component("alert", {
    data() {
        return {
            message: null
        };
    },
    mounted() {
        EventBus.$on("ALERT", this.showAlert);
        EventBus.$on("CLOSE_ALERT", this.closeAlert);
        EventBus.$on("UPDATE_ALERT", this.updateAlert);
    },
    methods: {
        showAlert(alert) {
            const title = {
                info: "Information",
                success: "Sucesss",
                warning: "Warning",
                danger: "Error!",
                primary: "Notice",
                secondary: "System Notice"
            };
            this.$bvToast.toast(alert.message, {
                id: alert.params ? alert.params.id : null,
                variant: alert.type,
                title: title[alert.type],
                solid: true,
                toaster: "b-toaster-bottom-right",
                autoHideDelay: 10000,
                noAutoHide: alert.params ? alert.params.noHide : false,
                appendToast: true,
                noCloseButton: alert.params ? alert.params.noClose : false
            });
        },
        closeAlert(id) {
            this.$bvToast.hide(id);
        },
        updateAlert(id, message) {}
    }
});

const postAlert = function(type, message, params) {
    EventBus.$emit("ALERT", { type, message, params });
};
const postAlertError = function(message) {
    const id = "alert_" + ~~(Math.random() * 1001);
    EventBus.$emit("ALERT", {
        type: "danger",
        message: message,
        params: { noHide: true, id: id }
    });
    return id;
};
const postAlertNotice = function(message) {
    const id = "alert_" + ~~(Math.random() * 1001);
    EventBus.$emit("ALERT", {
        type: "secondary",
        message: message,
        params: { noHide: true, noClose: true, id: id }
    });
    return id;
};
const closeAlert = function(id) {
    EventBus.$emit("CLOSE_ALERT", id);
};
const updateAlert = function(id, message) {
    EventBus.$emit("UPDATE_ALERT", { id, message });
};

export { postAlert, postAlertError, postAlertNotice, closeAlert, updateAlert };
</script>
