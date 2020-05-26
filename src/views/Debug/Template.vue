<template>
    <div>
        <input type="number" v-model.number="$parent.nums"/>
        <igv :chr="8"
             :start="117912512"
             :end="118238953"
             @igvupdate="$store.dispatch('igvUpdate', $event)">
            <igv-track
                v-for="num in $parent.nums"
                :num="num"
                :key="num"

                :index="'associations'"
                :feature="'T2D'"
                :translator="$parent.associationsForIGV"
            >
            </igv-track>
        </igv>
    </div>
</template>
