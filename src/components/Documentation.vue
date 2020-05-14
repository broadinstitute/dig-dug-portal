<template>
    <div>
        {{documentationContent}}
    </div>
</template>

<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils"
export default Vue.component("documentation", {
    props: ["name","group"],
//fetch
//if group is not defined --> get it from the store
// name and group should be defined

    data: (context) => {
        return {
            module: camelKebab(context.moduleIndex),
        }
    },
    mounted(){
        //fetch call
        //get the content and resolve it in data

    },
    computed:{
        //render the content as it is if not markdown
        //if else markdown - implemented by Kenneth
    },

    

});
</script>
