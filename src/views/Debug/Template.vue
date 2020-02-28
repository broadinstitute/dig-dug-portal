<template>
    <div>
        <loading-bar v-bind:data-type="'associations'"
                     v-bind:module ="$store.state.associations"
                     v-bind:query-state="{ q: 'slc30a8' }">
        </loading-bar>
    </div>
</template>

<script>

</script>
