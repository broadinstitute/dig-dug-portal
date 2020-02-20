<template>
    <div>
        <div>{{ $parent.percentComplete }}</div>
        <input type="button" @click="$store.commit('bioIndexAssociations/setAbort', true)" value="Abort">
    </div>
</template>
