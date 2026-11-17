<template>
    <div class="whats-new">
        <div class="whats-new-head">
            <h2>What's new</h2>
            <div v-if="recentNews.length > 1" class="whats-new-pages" role="tablist" aria-label="News items">
                <button
                    v-for="(item, index) in recentNews"
                    :key="item.nid"
                    type="button"
                    role="tab"
                    class="whats-new-page"
                    :class="{ active: index === current }"
                    :aria-selected="String(index === current)"
                    :aria-label="`News ${index + 1}`"
                    @click="current = index"
                >{{ index + 1 }}</button>
            </div>
        </div>

        <div v-if="currentItem" class="whats-new-item">
            <p class="whats-new-text">
                <strong>{{ currentItem.title }}:</strong>
                {{ currentItem.body }} ...
                <a :href="'news.html?nid=' + currentItem.nid" target="_blank" rel="noopener noreferrer">Read more</a>
            </p>
        </div>
        <p v-else class="whats-new-text">No news available.</p>

        <a class="whats-new-archive" href="news.html">View news archive &gt;</a>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("news-feed-section", {
    props: ["diseaseGroup", "newsFeed"],
    data() {
        return { current: 0 };
    },
    computed: {
        recentNews() {
            return (this.newsFeed || []).slice(0, 5);
        },
        currentItem() {
            return this.recentNews[this.current] || null;
        },
    },
    watch: {
        recentNews() {
            if (this.current >= this.recentNews.length) this.current = 0;
        },
    },
});
</script>

<style scoped>
.whats-new { padding: 20px 10px 24px; text-align: left; }
.whats-new-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.whats-new h2 { margin: 0; font-family: "Oswald", "Arial Narrow", Impact, sans-serif; font-size: 36px; font-weight: 500; color: #222; }
.whats-new-pages { display: flex; gap: 6px; }
.whats-new-page { width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: #9a9a9a; color: #fff; font-size: 12px; font-weight: 700; line-height: 22px; cursor: pointer; }
.whats-new-page.active { background: #0b72c4; }
.whats-new-text { margin: 0 0 16px; font-size: 18px; line-height: 1.55; color: #222; }
.whats-new-text strong { font-weight: 700; }
.whats-new-text a { color: #0b72c4; }
.whats-new-archive { font-size: 17px; font-weight: 700; color: #0b72c4; }
</style>
