<template>
    <div>
        
        <filter-widget v-model="$parent.inputs" :associations="[]" :phenotypes="[]">
            <filter-widget-control></filter-widget-control>
        </filter-widget>

        <!-- Does filter-provider consume a function, or a function spec? -->
        <filter-context v-model="$parent.inputs">
            <filter-user></filter-user>
        </filter-context>


    </div>
</template>