<template>
	<div class="llm-options">	
		<div v-for="item in subSectionData" v-if="!subSectionData.error">
			<h4 v-html="item.direction"> </h4>
			<div>
				<ul>
					<li  v-for="prompt in item.prompts" v-html="prompt">

					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("research-llm-options-section", {
	props: ["subSectionData"],
	components: {
	},
	data() {
		return {
			currentData:null,
		};
	},
	modules: {
	},
	created() {
		this.currentData = this.subSectionData;

	},
	mounted() {
		
	},
	computed: {
		
	},
	watch: {
		
	},
	methods: {},
});

$(function () { });
</script>
<style scoped>
.llm-options {
	border-radius: 5px;
	background-color: #eeeeee;
	text-align: left;
	margin-left: 20px;
	width: calc( 100% - 20px);
	padding: 25px;
}
</style>
