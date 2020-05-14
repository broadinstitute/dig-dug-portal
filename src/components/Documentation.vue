<template>
    <div>{{documentation}}</div>
</template>

<script>
import Vue from "vue";
import { camelKebab } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import queryString from "query-string";

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
        let defaultDiseaseGroup = this.$store.getters["bioPortal/diseaseGroup"]
            .name;
        let docGroup = this.group || defaultDiseaseGroup;
        let qs = queryString.stringify({
            q: this.name,
            group: docGroup
        }); //get this from state
        let json = fetch(`${BIO_INDEX_HOST}/api/portal/documentation?${qs}`)
            .then(resp => resp.json())
            .then(json => {
                if (json.data.length > 0) {
                    this.content = json.data[0].content;
                } else {
                    console.error(
                        "No content returned for given name " +
                            this.name +
                            "and group " +
                            docGroup
                    );
                }
            });
    },
    computed: {
        //render the content as it is if not markdown
        //if else markdown - implemented by Kenneth
        documentation() {
            return this.content;
        }
    }
});
</script>
