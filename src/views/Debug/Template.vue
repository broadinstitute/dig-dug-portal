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
            :finishHandler="response => $store.dispatch('associations/tap', 'global tap')"
            :popupHandler="(_, popupData) => {
                const varIds = popupData
                    .filter(popupDatum => popupDatum.name === 'name')
                    .map(popupName => popupName.value)
                    .filter(varId => !$parent.variantSelections.includes(varId));
                $parent.variantSelections.push(...varIds)
            }">

            <igv-associations-track
                v-for="phenotype in $parent.phenotypes"
                :key="phenotype"
                :phenotype="phenotype"
                :visualization="'gwas'"
                :finishHandler="response => $store.commit('associations/setResponse', response)">
            </igv-associations-track>

            <igv-intervals-track
                :tissue="'liver'">
            </igv-intervals-track>

        </igv>

        Reactions:<br>
        Data length of {{JSON.stringify($store.state.associations.data.length) }}

        <br><br>

        Chosen Variants:<br>
        <ul>
            <li
                v-for="selectedVariant in $parent.variantSelections"
                :key="selectedVariant">
                {{ selectedVariant }} <button @click="() => $parent.removeVariant(selectedVariant)">x</button>
            </li>
        </ul>


    </div>
</template>
