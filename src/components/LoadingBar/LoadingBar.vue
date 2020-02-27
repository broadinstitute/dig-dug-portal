<template>

    <div class="lb-container-all">
        <div class="lb-container-row">
            <!-- The magic numbers here are fudge factors to get the percentage display to initialize with information -->
            <!-- If they weren't here the loading bar would look empty on first render, which looks unresponsive -->
            <b-progress class="lb-container-progress"
                        :max="$store.state[dataType].count + 2500"
                        :precision="2"
                        show-progress
                        v-bind:variant='
                            $store.state[dataType].loading && !$store.state[dataType].aborted ?
                                "success" :
                            !$store.state[dataType].loading && !$store.state[dataType].aborted ?
                                "warning" :
                            $store.state[dataType].aborted ?
                                "primary" : "success"
                        '
                        v-bind:animated='!$store.state[dataType].aborted'>
                <b-progress-bar :value="$store.state[dataType].data.length + 2500"
                                :label="`${((($store.state[dataType].data.length) / ($store.state[dataType].count + 1)) * 100).toFixed(2)}%`">
                </b-progress-bar>
            </b-progress>

            <div class="lb-container-buttons">

                <div class="lb-button-group-pause-continue">
                    <div title="Done receiving" v-if="$store.state[dataType].aborted">
                        <b-button pill variant="outline-secondary" size="sm" disabled>
                            <b-icon-pause></b-icon-pause>
                        </b-button>
                    </div>

                    <div v-bind:title="`Continue receiving ${dataType}`" v-else-if="!$store.state[dataType].loading && !$store.state[dataType].aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="CONTINUE">
                            <b-icon-chevron-right></b-icon-chevron-right>
                        </b-button>
                    </div>

                    <div v-bind:title="`Pause receiving ${dataType}`" v-else-if="$store.state[dataType].loading">
                        <b-button pill variant="outline-secondary" size="sm" @click="PAUSE">
                            <b-icon-pause-fill></b-icon-pause-fill>
                        </b-button>
                    </div>
                </div>

                <div class="lb-button-group-cancel-restart">
                    <div v-bind:title="`Cancel receiving ${dataType}`" v-if="!$store.state[dataType].aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="CANCEL">
                            <b-icon-circle-slash></b-icon-circle-slash>
                        </b-button>
                    </div>

                    <div v-bind:title="`Restart ${dataType} query`" v-else-if="$store.state[dataType].aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="RESTART">
                            <b-icon-arrow-repeat></b-icon-arrow-repeat>
                        </b-button>
                    </div>
                </div>

            </div>
        </div>
        <div class="lb-container-count" v-if="$store.state[dataType].count > 0">
            {{ $store.state[dataType].data.length }} / {{ $store.state[dataType].count }} {{dataType}} loaded
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { mapMutations, mapActions } from "vuex";

// import and extend bioIndex store instance on page!
// use the store type to parameterize messages in the component?
export default Vue.component("loading-bar", {
    props: ["dataType", "queryState"],
    created() {
      console.log(this.dataType);
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
        canContinue() {
            // is currently not loading but neither is it aborted => continuable from the point of being paused
            return !this.$store.state[this.dataType].loading && !this.$store.state[this.dataType].aborted
        },
        canPause() {
            // is currently loading and thus not aborted
                // !!! NOTE: <loading = true && aborted = true> should be an impossible state.
            return this.$store.state[this.dataType].loading
        },
        canCancel() {
            // is started or restarted => not or no longer aborted
            return !this.$store.state[this.dataType].aborted
        },
        canRestart() {
            // is aborted or completed => can start at the beginning
            return this.$store.state[this.dataType].aborted
        },
    },
    methods: {
        // TODO: is there a way to decouple this even further from the store without bloating the component's interface?
        CANCEL() {
            this.$store.commit(`${this.dataType}/setLoading`, false);
            this.$store.commit(`${this.dataType}/setAbort`, true);
        },
        RESTART() {
            this.$store.commit(`${this.dataType}/clearTIterableQuery`);
            this.$store.commit(`${this.dataType}/clearData`);
            this.$store.dispatch(`${this.dataType}/count`, this.queryState);
            this.$store.dispatch(`${this.dataType}/query`, this.queryState);
        },
        PAUSE() {
            this.$store.commit(`${this.dataType}/setLoading`, false);
        },
        CONTINUE() {
            this.$store.commit(`${this.dataType}/setLoading`, true);
            // TODO: case where queryState changes but previous iterableQuery not done?
                // TODO: need a way of binding *->this.queryState to the creation of a new iterableQuery!
            this.$store.dispatch(`${this.dataType}/query`, this.queryState);
        },
    }
})
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
        height: 200%;  /* equivalent to a bootstrap button height? */
    }
    .lb-container-buttons {
        display: flex;
        flex-direction: row;
    }
    .lb-container-buttons > * {
        margin-left: 5%;
    }
    .lb-container-count {
        font-size: 0.80rem;
    }
</style>
