<template>
	<b-button class="field-delete" @click="$emit('deleteThis')">&times;</b-button>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("delete-button", {
	props: [],
	emits: ['deleteThis'],
	data() { return {}},
	modules: {},
	components: {},
	computed: {},
	methods: {},
	watch: {}
});
</script>
<style>

@import url("/css/configBuilder.css");
</style>


