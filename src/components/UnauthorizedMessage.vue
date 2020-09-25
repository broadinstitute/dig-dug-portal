<template>
    <div class="no-access">
        <b-alert v-if="restricted" show variant="warning">
            <span v-if="count">
                <b-icon icon="exclamation-triangle"></b-icon>
                There were
                <strong>{{ count }}</strong> records hidden because you do not
                have required permission to view them.
            </span>
            <span v-else>
                <b-icon icon="exclamation-triangle"></b-icon>
                There was hidden data because you do not have required
                permission to view them.
            </span>

            <!-- ask user to login -->
            <span v-if="!!user">
                Please contact us if you believe you should've given access.
            </span>
            <span v-else>
                Please
                <a href="/login" @click.prevent="loginUser">log in</a> with an
                authorized Google account to see them.
            </span>
        </b-alert>

        <b-alert v-else-if="!!failed" show variant="danger">
            <b-icon icon="exclamation-triangle"></b-icon>
            There was an error loading the data: {{ failed }}
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
        restricted: { required: false, default: false },
        failed: { required: false, default: false },
    },
    computed: {
        count() {
            if (typeof this.restricted === "number") {
                return this.restricted;
            }
            return null;
        },
    },
});
</script>

<style>
</style>
