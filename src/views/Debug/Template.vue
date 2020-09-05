<template>
    <div>
        
        <filter-widget v-model="$parent.inputs" :associations="[]" :phenotypes="[]">
            <filter-widget-control
                :field="'pValue'"
                :op="'=='"
                :threshold="'3'">
                <!-- e.g. Documentation component can be used here to control and standardize labels -->
            </filter-widget-control>
        </filter-widget>

        <!-- Does filter-provider consume a function, or a function spec? -->
        <filter-context v-model="$parent.inputs">
            <filter-user></filter-user>
        </filter-context>


    </div>
</template>