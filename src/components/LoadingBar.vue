<template>
    <div class="lb-container-all">
        <div class="lb-container-row">
            <b-progress
                class="lb-container-progress"
                :max="$store.state[moduleId].count"
                show-progress
                v-bind:variant="
                            $store.state[moduleId].loading && !$store.state[moduleId].aborted ?
                                'success' :
                            !$store.state[moduleId].loading && !$store.state[moduleId].aborted ?
                                'warning' :
                            $store.state[moduleId].aborted ?
                                'primary' : 'success'
                        "
                v-bind:animated="!$store.state[moduleId].aborted"
            >
                <b-progress-bar
                    :value="$store.state[moduleId].data.length"
                    :label="`${ $store.state[moduleId].data.length > 0 ? ((($store.state[moduleId].data.length) / ($store.state[moduleId].count + 1)) * 100).toFixed(2).toString()+'%' : '' }`"
                ></b-progress-bar>
            </b-progress>

            <div class="lb-container-buttons">
                <div class="lb-button-group-pause-continue">
                    <div title="Done receiving" v-if="$store.state[moduleId].aborted">
                        <b-button pill variant="outline-secondary" size="sm" disabled>
                            <b-icon-pause></b-icon-pause>
                        </b-button>
                    </div>

                    <div
                        v-bind:title="`Continue receiving ${moduleId}`"
                        v-else-if="!$store.state[moduleId].loading && !$store.state[moduleId].aborted"
                    >
                        <b-button pill variant="outline-secondary" size="sm" @click="resume">
                            <b-icon-chevron-right></b-icon-chevron-right>
                        </b-button>
                    </div>

                    <div
                        v-bind:title="`Pause receiving ${moduleId}`"
                        v-else-if="$store.state[moduleId].loading"
                    >
                        <b-button pill variant="outline-secondary" size="sm" @click="pause">
                            <b-icon-pause-fill></b-icon-pause-fill>
                        </b-button>
                    </div>
                </div>

                <div class="lb-button-group-cancel-restart">
                    <div
                        v-bind:title="`Cancel receiving ${moduleId}`"
                        v-if="!$store.state[moduleId].aborted"
                    >
                        <b-button pill variant="outline-secondary" size="sm" @click="cancel">
                            <b-icon-circle-slash></b-icon-circle-slash>
                        </b-button>
                    </div>

                    <div
                        v-bind:title="`Restart ${moduleId} query`"
                        v-else-if="$store.state[moduleId].aborted"
                    >
                        <b-button pill variant="outline-secondary" size="sm" @click="restart">
                            <b-icon-arrow-repeat></b-icon-arrow-repeat>
                        </b-button>
                    </div>
                </div>
            </div>
        </div>
        <div
            class="lb-container-count"
            v-if="$store.state[moduleId].count > 0"
        >{{ $store.state[moduleId].data.length }} / {{ $store.state[moduleId].count }} {{moduleId}} loaded</div>
    </div>
</template>

<script>
import Vue from "vue";
import { mapMutations, mapActions } from "vuex";

// import and extend bioIndex store instance on page!
// use the store type to parameterize messages in the component?
export default Vue.component("loading-bar", {
    props: ["module", "queryState"],
    data() {
        return {
            // to take advantage of caching
            moduleId: this.module.id
        };
    },
    created() {
        // console.log(this.data.moduleId);
    },
    computed: {
        // TODO: using computed properties results in noticeable interface lag, these are not necessary but are kept here for reference
        // loadBarColorVariant() {
        //     if (this.canPause() || this.canCancel()) {
        //         // is working
        //         return 'success'
        //     } else if (this.canContinue()) {
        //         // is paused
        //         return 'warning'
        //     } else if (this.canRestart()) {
        //         // is done or canceled ~~~ "completed"
        //         return 'primary'
        //     }
        // },
        // canContinue() {
        //     // is currently not loading but neither is it aborted => continuable from the point of being paused
        //     return !this.$store.state[this.dataType].loading && !this.$store.state[this.dataType].aborted
        // },
        // canPause() {
        //     // is currently loading and thus not aborted
        //         // !!! NOTE: <loading = true && aborted = true> should be an impossible state.
        //     return this.$store.state[this.dataType].loading
        // },
        // canCancel() {
        //     // is started or restarted => not or no longer aborted
        //     return !this.$store.state[this.dataType].aborted
        // },
        // canRestart() {
        //     // is aborted or completed => can start at the beginning
        //     return this.$store.state[this.dataType].aborted
        // },
    },
    methods: {
        // TODO: is there a way to decouple this even further from the store without bloating the component's interface?
        cancel() {
            this.$store.commit(`${this.moduleId}/setLoading`, false);
            this.$store.commit(`${this.moduleId}/setAbort`, true);
        },
        restart() {
            this.$store.commit(`${this.moduleId}/clearIterableQuery`);
            this.$store.commit(`${this.moduleId}/clearData`);
            this.$store.dispatch(`${this.moduleId}/count`, this.queryState);
            this.$store.dispatch(`${this.moduleId}/query`, this.queryState);
        },
        pause() {
            this.$store.commit(`${this.moduleId}/setLoading`, false);
        },
        resume() {
            this.$store.commit(`${this.moduleId}/setLoading`, true);
            // TODO: case where queryState changes but previous iterableQuery not done?
            // TODO: need a way of binding *->this.queryState to the creation of a new iterableQuery!
            this.$store.dispatch(`${this.moduleId}/query`, this.queryState);
        }
    }
});
</script>

<style scoped>
.lb-container-all {
    margin: 0.5%;
}
.lb-container-row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
}
.lb-container-progress {
    flex-grow: 3;
    height: 200%; /* equivalent to a bootstrap button height? */
}
.lb-container-buttons {
    display: flex;
    flex-direction: row;
}
.lb-container-buttons > * {
    margin-left: 5%;
}
.lb-container-count {
    font-size: 0.8rem;
}
</style>
