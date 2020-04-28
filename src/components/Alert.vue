<template>
</template>

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
        EventBus.$on("ALERT", this.postAlert );
    },
    methods: {
        postAlert(alert) {
            const title = {"info": "Information", "success": "Sucesss", "warning": "Warning", "danger": "Error"};
            this.$bvToast.toast(alert.message, {
                variant: alert.type,
                title: title[alert.type],
                solid: true,
                toaster: 'b-toaster-bottom-right',
                autoHideDelay: 10000,
                appendToast: true
            });
        }
    }
});

export const postAlert = function(type, message) {
    EventBus.$emit("ALERT", {type:type, message: message});
};
</script>
