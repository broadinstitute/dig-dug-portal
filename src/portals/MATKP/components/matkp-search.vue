<template>
    <b-input-group size="sm">
        <gene-selectpicker ref="srch" style="width:100%" v-model="searchQuery" @onGeneChange="gene => searchGene(gene)"/>
        <b-button class="button-lock-right" @click="searchGene()">
            Search
        </b-button>
    </b-input-group>
</template>

<script>
import Vue from "vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";

export default Vue.component("matkp-search", {
    components: {
        GeneSelectPicker
    },
    props: [],
    data() {
        return {
            searchQuery: ''
        };
    },
    computed: {
    },
    created() {
    },
    methods: {
        searchGene(gene){
            //@onInputChange="input => searchQuery = input"
            if(gene) {
                this.searchQuery = gene;
            }else{
                const val = this.$refs.srch.$el.querySelector('input').value;
                console.log(val)
            }
            if (this.searchQuery.trim() != '') {
                window.location.href = `/gene.html?gene=${this.searchQuery.toUpperCase()}`;
            }
        }
    },
});

</script>

<style scoped>
.button-lock-right {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 3;
    border-radius: 0;
}
::v-deep .list-group{
    border-radius: 0;
}
::v-deep .list-group-item {
    position: relative;
    display: block;
    padding: 0.35rem .75rem;
    background-color: #eee;
    border: 0;
}
</style>