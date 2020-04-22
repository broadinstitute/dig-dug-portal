<template>
	<div>
		<b-alert
			:show="show"
			fade
			variant="danger"
			:dismissible="dismissible"
			@dismiss-count-down="countDownChanged"
		>
			<strong>Error:</strong>
			{{error}}
			<span class="countDown" v-if="timeOut">{{dismissCountDown}}</span>
		</b-alert>
	</div>
</template>

<script>
import Vue from "vue";
export default Vue.component("error-message", {
	props: ["error", "dismissible", "timeOut"],
	data() {
		return {
			show: this.timeOut || true,
			dismissCountDown: 0
		};
	},
	methods: {
		countDownChanged(dismissCountDown) {
			this.dismissCountDown = dismissCountDown;
		}
	}
});
</script>
<style scoped>
.countDown {
	float: right;
	font-size: 1.5rem;
	font-weight: 700;
	color: rgb(255, 255, 255);
	line-height: 1;
}
</style>
