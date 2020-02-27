<template>

    <div class="lb-container-all">
        <div class="lb-container-row">
            <!-- The magic numbers here are fudge factors to get the percentage display to initialize with information -->
            <!-- If they weren't here the loading bar would look empty on first render, which looks unresponsive -->
            <b-progress class="lb-container-progress"
                        :max="$store.state.associations.count + 2500"
                        :precision="2"
                        show-progress
                        v-bind:variant='$store.state.associations.loading || !$store.state.associations.aborted ? !$store.state.associations.loading ? "warning" : "success" : "primary" '
                        v-bind:animated='!$store.state.associations.aborted'>
                <b-progress-bar :value="$store.state.associations.data.length + 2500"
                                :label="`${((($store.state.associations.data.length) / ($store.state.associations.count + 1)) * 100).toFixed(2)}%`">
                </b-progress-bar>
            </b-progress>

            <div class="lb-container-buttons">

                <div class="lb-button-group-pause-continue">
                    <div title="Done receiving" v-if="$store.state.associations.aborted">
                        <b-button pill variant="outline-secondary" size="sm" disabled>
                            <b-icon-pause></b-icon-pause>
                        </b-button>
                    </div>

                    <div title="Continue receiving data" v-else-if="!$store.state.associations.loading && !$store.state.associations.aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="$store.dispatch('associations/CONTINUE', { q: 'slc30a8' })">
                            <b-icon-chevron-right></b-icon-chevron-right>
                        </b-button>
                    </div>

                    <div title="Pause receiving data" v-else-if="$store.state.associations.loading">
                        <b-button pill variant="outline-secondary" size="sm" @click="$store.dispatch('associations/PAUSE')">
                            <b-icon-pause-fill></b-icon-pause-fill>
                        </b-button>
                    </div>
                </div>

                <div class="lb-button-group-cancel-restart">
                    <div title="Cancel receiving data" v-if="!$store.state.associations.aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="$store.dispatch('associations/CANCEL')">
                            <b-icon-circle-slash></b-icon-circle-slash>
                        </b-button>
                    </div>

                    <div title="Restart query for data" v-else-if="$store.state.associations.aborted">
                        <b-button pill variant="outline-secondary" size="sm" @click="$store.dispatch('associations/RESTART', { q: 'slc30a8' })">
                            <b-icon-arrow-repeat></b-icon-arrow-repeat>
                        </b-button>
                    </div>
                </div>

            </div>
        </div>
        <div class="lb-container-count" v-if="$store.state.associations.count > 0">
            {{ $store.state.associations.data.length }} / {{ $store.state.associations.count }} associations loaded
        </div>
    </div>
</template>

<script>

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

    /*!* using this to force a new line within the flexbox *!*/
    /*!* can't do multiple root components within a <template> tag*!*/
    /*.flex-break {*/
    /*    flex-grow: 1;*/
    /*    height: 0;*/
    /*}*/

    .lb-container-count {
        font-size: 0.80rem;
    }
</style>
