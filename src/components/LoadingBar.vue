<template>
    <div>
        {{'hello'}}
        {{this.$store.getters[`${module}/percentComplete`]}}
    </div>
</template>

<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils"
// import and extend bioIndex store instance on page!
// use the store type to parameterize messages in the component?
export default Vue.component("loading-bar", {
    props: ["moduleIndex", "queryState"],
    data: (context) => {
        return {
            module: camelKebab(context.moduleIndex),
        }
    },
    created() {

    },
    methods: {
        cancel() {
            // // this.$store.commit(`${this.moduleId}/setLoading`, false);
            // this.$store.commit(`${this.moduleId}/togglePause`, false);
            // // TODO
            // this.$store.commit(`${this.moduleId}/setAbort`, true);
        },
        restart() {
            // TODO
            // this.$store.commit(`${this.moduleId}/clearIterableQuery`);
            // this.$store.commit(`${this.moduleId}/clearData`);
            // TODO
            // this.$store.dispatch(`${this.moduleId}/count`, this.queryState);
            // this.$store.dispatch(`${this.moduleId}/query`, this.queryState);
        },
        pause() {
            // this.$store.commit(`${this.moduleId}/setLoading`, false);
            // this.$store.commit(`${this.moduleId}/togglePause`, false);
        },
        resume() {
            // this.$store.commit(`${this.moduleId}/setLoading`, true);
            // this.$store.commit(`${this.moduleId}/togglePause`, true);
            // TODO
            // this.$store.dispatch(`${this.moduleId}/query`, this.queryState);
        }
    }
});
</script>

<style scoped>
.lb-container-all {
    margin: 0.5%;
}
.lb-container-row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
}
.lb-container-progress {
    flex-grow: 3;
    height: 200%; /* equivalent to a bootstrap button height? */
}
.lb-container-buttons {
    display: flex;
    flex-direction: row;
}
.lb-container-buttons > * {
    margin-left: 5%;
}
.lb-container-count {
    font-size: 0.8rem;
}
</style>
