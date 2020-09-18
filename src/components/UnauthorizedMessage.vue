<template>
    <div>
        <b-alert v-if="unauthorized && !user" show variant="warning">
            >
            There were {{count}} records hidden, because you do not have permission to view them. Please
            <a
                href="/login"
            >Login</a> with an authorized Google account to view them.
        </b-alert>
        <b-alert v-else-if="unauthorized && !!user" show variant="warning">
            >
            There were {{count}} records hidden, because you do not have permission to view them.
            Please contact us if you believe you should've given access.
        </b-alert>
        <b-alert v-else-if="failed" show variant="warning">
            >
            Some records were failed to load. Please try again later.
            If problems still persist, please contact us.
        </b-alert>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("unauthorized-message", {
    data() {
        return {
            user: "",
        };
    },
    props: {
        unauthorized: { type: Boolean, required: false, default: false },
        failed: { type: Boolean, required: false, default: false },
        count: { type: Number, required: false },
    },
    created() {
        this.user = $parent.user;
    },
});
</script>

<style>
</style>
