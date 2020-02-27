<template>
    <div>
        Hello <br>
        Loading: {{$store.state.associations.loading}} <br>
        Aborted: {{$store.state.associations.aborted}} <br>

        <b-progress class="mt-5"
                    :max="$store.state.associations.count + 2500"
                    :precision="2"
                    show-progress
                    variant='info'
                    v-bind:animated='!$store.state.associations.aborted'>
            <b-progress-bar :value="$store.state.associations.data.length + 2500"
                            :label="`${((($store.state.associations.data.length) / ($store.state.associations.count)) * 100).toFixed(2)}%`">
            </b-progress-bar><br>
        </b-progress>

        <br>
        Completeness: {{ $store.state.associations.data.length }} / {{ $store.state.associations.count }} <br>
        <div>
            <div v-if="!$store.state.associations.aborted">
                <button @click="$store.dispatch('associations/CANCEL')">
                    Cancel
                </button>
            </div>
            <div v-else-if="$store.state.associations.aborted">
                <button @click="$store.dispatch('associations/RESTART', { q: 'slc30a8' })">
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
                <button @click="$store.dispatch('associations/CONTINUE', { q: 'slc30a8' })">Continue</button>
            </div>
            <div v-else-if="$store.state.associations.loading">
                <button @click="$store.dispatch('associations/PAUSE')">
                    Pause
                </button>
            </div>
        </div>

    </div>
</template>
