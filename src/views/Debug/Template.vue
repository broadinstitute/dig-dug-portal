<template>
        <criterion-list-group>
            <filter-enumeration-control
                ref="dataset"
                :field="'dataset'"
                :options="$parent.someDatasets"
                @input-change="$parent.inputChange = $event"
                ><div class="label">
                    Dataset
                </div></filter-enumeration-control>
                <template slot=filtered>
                    {{$parent.someDatasets}}
                </template>
        </criterion-list-group>
</template>