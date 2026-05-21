<script>
import LigerProgramBrowser from "./LigerProgramBrowser.vue";

export default {
    name: "Liger2Template",

    components: {
        LigerProgramBrowser
    }
};
</script>

<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>

        <div class="pkb-body">
            <LigerProgramBrowser :api-config="$parent.ligerApiOverrides" />
        </div>

        <pkb-footer></pkb-footer>
    </div>
</template>
