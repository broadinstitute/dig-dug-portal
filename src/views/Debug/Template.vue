<template>
    <!-- Header -->
    <div>

        <filter-group 
            :looseMatch="true" 
            v-model="$parent.filters"
            :filterMaker="id => id"
            :predicateMaker="id => id">
            <filter-pvalue-control :field="'pValue'"></filter-pvalue-control>
            <filter-effect-direction-control :field="'beta'"></filter-effect-direction-control>
        </filter-group>

        {{$parent.filters}}
        
    </div>
</template>