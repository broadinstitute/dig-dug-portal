<template>
    <div>
        <div v-if="unauthorized && !user">
            There were {{count}} records hidden, because you do not have permission to view them. Please
            <a
                href="/login"
            >Login</a> with an authorized Google account to view them.
        </div>
        <div v-else-if="unauthorized && !!user">
            There were {{count}} records hidden, because you do not have permission to view them.
            Please contact us if you believe you should've given access.
        </div>
        <div v-else-if="failed">
            Some records were failed to load. Please try again later.
            If problems still persist, please contact us.
        </div>
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
