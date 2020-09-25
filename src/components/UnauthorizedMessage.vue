<template>
    <div class="no-access">
        <b-alert v-if="unauthorized && !user" show variant="warning">
            <b-icon icon="exclamation-triangle"></b-icon>There were
            <strong>{{ count }}</strong> records hidden because you do not have
            required permission to view them. Please
            <a href="/login" @click.prevent="loginUser">log in</a> with an
            authorized Google account to see them.
        </b-alert>
        <b-alert v-else-if="unauthorized && !!user" show variant="warning">
            <b-icon icon="exclamation-triangle"></b-icon>There were
            <strong>{{ count }}</strong> records hidden because you do not have
            required permission to view them. Please contact us if you believe
            you should've given access.
        </b-alert>
        <b-alert v-else-if="failed" show variant="danger">
            <b-icon icon="exclamation-triangle"></b-icon>There are no records to
            show. Please contact us if you believe this is an error.
        </b-alert>
    </div>
</template>

<script>
import Vue from "vue";
import { userMixin } from "@/mixins/userMixin";
export default Vue.component("unauthorized-message", {
    mixins: [userMixin],
    data() {
        return {};
    },
    props: {
        unauthorized: { type: Boolean, required: false, default: false },
        failed: { type: Boolean, required: false, default: false },
        count: { type: Number, required: false },
    },
});
</script>

<style>
</style>
