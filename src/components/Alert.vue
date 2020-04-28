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
    },
    methods: {
        showAlert(alert) {
            const title = {
                info: "Information",
                success: "Sucesss",
                warning: "Warning",
                danger: "Error"
            };
            this.$bvToast.toast(alert.message, {
                variant: alert.type,
                title: title[alert.type],
                solid: true,
                toaster: "b-toaster-bottom-right",
                autoHideDelay: 10000,
                noAutoHide: alert.fixed,
                appendToast: true
            });
        }
    }
});

export const postAlert = function(type, message, fixed = false) {
    EventBus.$emit("ALERT", { type, message, fixed });
};
</script>
