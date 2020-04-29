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
        }
    }
});

export const postAlert = function(type, message, params) {
    EventBus.$emit("ALERT", { type, message, params });
};
export const closeAlert = function(id) {
    EventBus.$emit("CLOSE_ALERT", id);
};
</script>
