<template>
	<div>
		<div v-for="key in Object.keys(phenotypes)">
			<p>{{key}}</p>
			<div v-for="item in phenotypes[key]">{{item.description}} - {{item.pValue}}</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";

export default Vue.component("phenotype-signal", {
	props: ["phenotypes"],

	data() {
		return {};
	}
});
</script>
