<template>
	<div>
		<b-alert show fade variant="danger" :dismissible="dismissible">
			<strong>Error:</strong>
			{{error}}
		</b-alert>
	</div>
</template>

<script>
import Vue from "vue";
export default Vue.component("error-message", {
	props: ["error", "dismissible"],
	data() {
		return {
			dismissible: false
		};
	}
});
</script>
