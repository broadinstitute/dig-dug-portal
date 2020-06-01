<template>
    <div>
        <h3> Add Track </h3>

        <label for='phenotype'>Phenotype</label><br>
        <input id='phenotype' v-model="$parent.trackPhenotype"/><br>
        <button v-on:click="$parent.addAssociationsTrack">Add Association Track</button><br>

        <br>

        <label for='tissue'>Tissue</label><br>
        <input id='tissue' v-model="$parent.trackTissueDescription"/><br>
        <button v-on:click="$parent.addIntervalsTrack">Add Interval Track</button><br>

        <igv ref="igv"
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end"
            :finishHandler="response => $store.dispatch('associations/tap', 'global tap')">

            <igv-associations-track
                :phenotype="'T2D'"
                :visualization="'annotation'"
                :finishHandler="response => $store.commit('associations/setResponse', response)">
            </igv-associations-track>

            <igv-associations-track
                :phenotype="'BMI'"
                :visualization="'gwas'">
            </igv-associations-track>

            <igv-intervals-track
                :tissue="'liver'">
            </igv-intervals-track>

        </igv>

        Reaction:
        Data length of {{JSON.stringify($store.state.associations.data.length) }}

    </div>
</template>
