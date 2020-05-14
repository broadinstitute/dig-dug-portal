<template>
    <div v-model="content">{{content}}</div>
</template>

<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils";
export default Vue.component("documentation", {
    props: ["name", "group"],
    //fetch
    //if group is not defined --> get it from the store
    // name and group should be defined

    data: context => {
        return {
            content: null
        };
    },
    mounted() {
        // fetch the documentation data and resolve it in data
        let content = this.$store.dispatch("bioPortal/getDocumentation", name);
    },
    computed: {
        //render the content as it is if not markdown
        //if else markdown - implemented by Kenneth
        content() {
            return this.content;
        }
    }
});
</script>
