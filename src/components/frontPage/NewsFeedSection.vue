<template>
	<div class="row">
		<div
			class="news"
			v-for="(item, itemIndex) in recentNews"
			:key="item.nid"
		>
			<template v-if="itemIndex < 5">
				<div class="thumbnail">
					<img
						:src="item.field_image"
						v-if="item.field_image != ''"
					/>
				</div>
				<h5>{{ item.title }}</h5>
				<div class="news-body">{{ item.body }}</div>
				<span>
					...
					<a :href="'news.html?nid=' + item.nid" target="_blank"
						>Read more</a
					>
				</span>
			</template>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("news-feed-section", {
	props: ["diseaseGroup", "newsFeed"],
	data() {
		return {};
	},
	methods: {},
	computed: {
		recentNews() {
			let content = [];

			let nIndex = 0;
			this.newsFeed.map((n) => {
				if (nIndex < 5) {
					content.push(n);
				}
				nIndex++;
			});

			return content;
		},
	},
});
</script>
<style scoped>
.news {
	width: 100%;
	text-align: left;
	font-size: 14px;
	border-bottom: solid 1px #eeeeee;
	padding: 15px 10px;
}
.thumbnail {
	width: 100px;
	height: 100px;
	margin-right: 15px;
	float: left;
	background-color: #eeeeee;
	background-image: url("https://kp4cd.org/sites/default/files/images/news.svg");
	border-radius: 5px;
	border: solid 1px #ccc;
	overflow: hidden;
	text-align: center;
}
</style>
