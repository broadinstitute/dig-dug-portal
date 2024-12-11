<template>
    <div class="pkb-footer">Footer.</div>
</template>

<script>
import Vue from "vue";

export default Vue.component("PkbFooter", {
    components: {},
    props: {},
    data() {
        return {};
    },
    computed: {},
    created() {},
    methods: {},
});
</script>

<style scoped>
.pkb-footer {
    width: 100%;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 20px 0 15px;
    border-top: 3px solid var(--pkb-primary-green);
    box-shadow: 0px 2px 10px var(--pkb-primary-green);
    min-height: 70px;
    margin-top: auto;
}
</style>
