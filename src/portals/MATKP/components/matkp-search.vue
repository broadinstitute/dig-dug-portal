<template>
    <b-input-group size="sm">
        <input type="text" placeholder="Search gene" v-model="searchQuery" @keyup.enter="searchGene()"/>
        <b-button class="button-lock-right" @click="searchGene()">
            Search
        </b-button>
    </b-input-group>
</template>

<script>
import Vue from "vue";

export default Vue.component("matkp-search", {
    components: {
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
        searchGene(){
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
    z-index: 1;
    border-radius: 0;
}
</style>