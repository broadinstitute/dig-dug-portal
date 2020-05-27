<template>
    <div>
        <h3> Add Associations Track </h3>
        <label for='phenotype'>Phenotype</label><br>
        <input id='phenotype' v-model="$parent.newTrackPhenotype"/><br>
        <button v-on:click="$parent.addIGVTrack">Add Track</button>

        <!-- <input type="number" v-model.number="$parent.nums"/> -->

        <igv ref="igv"
            :chr="8"
            :start="117912512"
            :end="118238953">
             <!-- NOTE: I actually don't want to use v-for here! the component list *itself* should be authoritative -->
             <!-- This means that we avoid situations where e.g. IGV removes a track, then I remove a component, but I have to decide whether I'm updating a duplicate representation
                  or I'm just using the component tree itself for being "the list" -->
            <igv-associations-track
                :phenotype="'T2D'">
            </igv-associations-track>
            <igv-associations-track
                :phenotype="'BMI'">
            </igv-associations-track>
        </igv>
    </div>
</template>
