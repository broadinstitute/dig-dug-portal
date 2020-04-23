<template>
	<div v-if="errors">
		{{errors}}
		<button @click="errorNew(Math.random())">new error</button>
		<b-alert
			v-model="show"
			fade
			variant="danger"
			:dismissible="dismissible"
			@dismissed="errorClear"
			@dismiss-count-down="countDownChanged"
		>
			<strong>We've encountered the following {{errorWord}}:</strong>
			<span class="countDown" v-if="timeout">{{dismissCountDown}}</span>
			<ul>
				<li v-for="(error, i) in errors" :key="i">{{error}}</li>
			</ul>
		</b-alert>
	</div>
</template>

<script>
import Vue from "vue";
import pluralize from "pluralize";

export default Vue.component("error-message", {
	props: ["dismissible", "timeout"],
	data() {
		return {
			show: false,
			dismissCountDown: 0,
			errors: []
			//errors: ["error1", "error2"]
		};
	},
	methods: {
		countDownChanged(dismissCountDown) {
			this.dismissCountDown = dismissCountDown;
		},
		errorNew(error) {
			this.errors.push(error);
			this.show = this.timeout || true;
		},
		errorClear() {
			this.errors = [];
		}
	},
	computed: {
		errorWord() {
			return pluralize("error", this.errors.length);
		}
	}
});
</script>
<style scoped>
.countDown {
	float: right;
	font-size: 1.5rem;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1;
}
</style>
