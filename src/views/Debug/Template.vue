<template>
    <div>

        <input v-model="$parent.addPhenotype"/>
        <button @click="$parent.addAPhenotype">Add Phenotype</button>

        <input v-model="$parent.removePhenotype"/>
        <button @click="$parent.removeAPhenotype">Remove Phenotype</button>

        <locuszoom
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end">

            <lz-associations-panel
                v-for="phenotype in $parent.phenotypes"
                :key="phenotype"
                :phenotype="phenotype">
            </lz-associations-panel>

        </locuszoom>
    </div>
</template>
