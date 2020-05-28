<template>
    <div>
        <h3> Add Associations Track </h3>
        <label for='phenotype'>Phenotype</label><br>

        <input id='phenotype' v-model="$parent.trackPhenotype"/><br>
        <button v-on:click="$parent.addAssociationsTrack">Add Track</button>

        <igv ref="igv"
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end"
            :finishHandler="() => $store.dispatch('associations/tap', 'goodbye')"
        >

            <igv-associations-track
                :phenotype="'T2D'"
                :finishHandler="() => $store.dispatch('associations/tap', 'hello')">
            </igv-associations-track>

            <igv-associations-track
                :phenotype="'BMI'">
            </igv-associations-track>

        </igv>

    </div>
</template>
