<template>
	<div>
		<div class="search-underlay" @click="unFocus"></div>
		<div class="byor-single-search-wrapper">
			<div class="search-underlay-close-note" @click="unFocus">
				close search <b-icon icon="x-circle-fill"></b-icon>
			</div>

			<input
				class="form-control byor-single-search"
				type="text"
				id="byor_single_search"
				v-model="singleSearchParam"
				:placeholder="placeholder"
				autocomplete="off"
				@keyup.enter="onSearch"
				@focus="onFocus"
			/>
			<span
				v-if="!!singleSearchParam"
				class="btn btn-default reset-search"
				@click="resetSearch"
			>
				Clear search <b-icon icon="x-circle-fill"></b-icon>
			</span>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import EventBus from "@/utils/eventBus";

export default Vue.component("cfde-single-search", {
	props: ["singleSearchConfig", "phenotypes", "utils", "fromNav"],

	data() {
		return {
			singleSearchParam: null,
			hasFocus: false,
		};
	},

	computed: {
		placeholder() {
			if (this.singleSearchConfig && this.singleSearchConfig["search instruction"]) {
				return this.singleSearchConfig["search instruction"];
			}
			return "Search gene, variant, region, phenotype, or tissue";
		},
	},

	mounted() {
		EventBus.$on("activate-search", this.onFocus);
	},

	beforeDestroy() {
		EventBus.$off("activate-search", this.onFocus);
	},

	methods: {
		onSearch() {},
		resetSearch() {
			this.singleSearchParam = null;
		},
		onFocus() {
			const underlay = this.$el.querySelector(".search-underlay");
			const wrapper = this.$el.querySelector(".byor-single-search-wrapper");
			if (underlay) underlay.classList.add("focus");
			if (wrapper) {
				wrapper.classList.add("focus");
				if (this.fromNav) wrapper.classList.remove("hidden");
			}
			this.hasFocus = true;
		},
		unFocus() {
			const underlay = this.$el.querySelector(".search-underlay");
			const wrapper = this.$el.querySelector(".byor-single-search-wrapper");
			if (underlay) underlay.classList.remove("focus");
			if (wrapper) {
				wrapper.classList.remove("focus");
				if (this.fromNav) wrapper.classList.add("hidden");
			}
			this.hasFocus = false;
		},
	},
});
</script>

<style scoped>
.search-underlay {
	background: #f7f6f6;
	position: fixed;
	width: 100vw;
	height: 100vh;
	top: 0;
	left: 0;
	z-index: 1000;
	opacity: 0.8;
	display: none;
}
.search-underlay-close-note {
	position: absolute;
	left: 50%;
	top: -30px;
	transform: translateX(-50%);
	display: none;
	font-size: 12px;
	width: 100%;
	text-align: right;
	padding: 0 10px;
	cursor: pointer;
}
.search-underlay.focus {
	display: block;
}
.byor-single-search-wrapper {
	width: 100%;
	position: relative;
}
.byor-single-search-wrapper.focus {
	z-index: 2000;
}
.byor-single-search-wrapper.focus .search-underlay-close-note {
	display: block;
}
.byor-single-search {
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}
.reset-search {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	right: 4px;
	color: #999999;
	font-size: 14px;
}
.reset-search:hover {
	color: #333333;
}
</style>
