<template>
        <criterion-list-group>
            <filter-enumeration-control
                ref="dataset"
                :field="'dataset'"
                :options="$parent.allDatasets"
                @input-change="$parent.inputChangeTap"
                ><div class="label">
                    Dataset
                </div></filter-enumeration-control>
        </criterion-list-group>
</template>