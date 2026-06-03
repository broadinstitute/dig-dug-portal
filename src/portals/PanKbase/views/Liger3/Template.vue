<script>
import LigerBrowser from "./LigerBrowser.vue";

export default {
    components: {
        LigerBrowser
    }
};
</script>

<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>

        <div class="pkb-body">
            <LigerBrowser :config="null" />
        </div>

        <pkb-footer></pkb-footer>
    </div>
</template>

<style>

</style>