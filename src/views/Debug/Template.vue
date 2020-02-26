<template>
    <div>
        Hello <br>
        Loading: {{$store.state.associations.loading}} <br>
        Aborted: {{$store.state.associations.aborted}} <br>

        <b-progress class="mt-2"
                    :max="$store.state.associations.count + 2500"
                    :precision="2"
                    show-progress
                    v-bind:animated='!$store.state.associations.aborted'>
            <b-progress-bar :value="$store.state.associations.data.length + 2500"
                            :label="`${((($store.state.associations.data.length) / ($store.state.associations.count)) * 100).toFixed(2)}%`">
            </b-progress-bar><br>
        </b-progress>

        <br>
        Completeness: {{ $store.state.associations.data.length }} / {{ $store.state.associations.count }} <br>

<!--        [show/can]Cancel, wasStarted or wasRestarted: !$store.state.associations.aborted-->
<!--        [show/can]Restarted, wasCanceled, isDone: $store.state.associations.aborted-->
<!--        [show/can]Done, isDone: $store.state.associations.aborted-->
<!--        [show/can]Continue, isPaused: !$store.state.associations.aborted && !$store.state.associations.loading-->
<!--        [show/can]Pause, wasStarted or wasContinued: $store.state.associations.loading-->

        <div>
            <div v-if="!$store.state.associations.aborted">
                <button @click="() => {
                    $store.commit('associations/setAbort', true);
                    $store.commit('associations/clearTIterableQuery');
                }">
                    Cancel
                </button>
            </div>
            <div v-else-if="$store.state.associations.aborted">
                <button @click="() => {
                    $store.commit('associations/clearData');
                    $store.dispatch('associations/count', { q: 'slc30a8' });
                    $store.dispatch('associations/queryGen', { q: 'slc30a8' });
                }">
                    Restart
                </button>
            </div>
        </div>
        <div>
            <div v-if="$store.state.associations.aborted">
                <button disabled>
                    Done
                </button>
            </div>
            <div v-else-if="!$store.state.associations.loading && !$store.state.associations.aborted">
                <button @click="() => {
                    $store.commit('associations/setLoading', true);
                    $store.dispatch('associations/queryGen', { q: 'slc30a8' });
                }">Continue</button>
            </div>
            <div v-else-if="$store.state.associations.loading">
                <button @click="$store.commit('associations/setLoading', false)">
                    Pause
                </button>
            </div>
        </div>

    </div>
</template>
