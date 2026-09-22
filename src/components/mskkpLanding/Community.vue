<template>
    <section class="mskkp-landing-community">
        <div class="mskkp-landing-community-columns">
            <div class="mskkp-landing-community-about">
                <h2>About Us</h2>
                <p>
                    It is being developed by a team of scientists and software
                    engineers at the
                    <span class="mskkp-landing-community-link"
                        >Broad Institute</span
                    >
                    in collaboration with the
                    <span class="mskkp-landing-community-link"
                        >International Federation of Musculoskeletal Research
                        Societies (IFMRS)</span
                    >.
                </p>
                <h2>Contact</h2>
                <p>
                    We welcome the involvement of interested researchers.
                    <span class="mskkp-landing-community-link">Contact us</span>
                    to learn more about contributing data or collaborating with
                    us on analyses, methods, or tool development.
                </p>
                <p>
                    <span class="mskkp-landing-community-link">Sign up</span>
                    for emailed updates, newsletters, and webinar invitations.
                </p>
            </div>
            <div class="mskkp-landing-community-news">
                <div class="mskkp-landing-community-news-header">
                    <h2>News</h2>
                    <a
                        class="mskkp-landing-community-link"
                        href="/news.html"
                        >See more</a
                    >
                </div>
                <div
                    v-for="item in latestNews"
                    :key="item.nid"
                    class="mskkp-landing-community-news-item"
                >
                    <div class="mskkp-landing-community-news-thumb">
                        <img
                            v-if="item.field_image"
                            :src="item.field_image"
                            :alt="item.title"
                        />
                    </div>
                    <div class="mskkp-landing-community-news-copy">
                        <div class="mskkp-landing-community-news-title">
                            {{ item.title }}
                        </div>
                        <div class="mskkp-landing-community-news-body">
                            {{ item.body }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("mskkp-landing-community", {
    props: ["diseaseGroup", "newsFeed", "frontContents"],
    computed: {
        latestNews() {
            const feed = Array.isArray(this.newsFeed) ? this.newsFeed : [];
            return feed.slice(0, 3);
        },
    },
});
</script>

<style>
.mskkp-landing-community {
    width: 100%;
    background-color: #bcafd6;
    color: #ffffff;
    padding: 35px 50px;
    box-sizing: border-box;
}

.mskkp-landing-community-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    align-items: start;
}

.mskkp-landing-community h2 {
    font-size: 20px;
    font-weight: 700;
    color: #6060a4;
    margin: 0 0 12px;
}

.mskkp-landing-community-about h2 + h2,
.mskkp-landing-community-about p + h2 {
    margin-top: 28px;
}

.mskkp-landing-community p {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 1.5;
    color: #ffffff;
}

.mskkp-landing-community-link {
    color: #ffffff !important;
    text-decoration: underline;
}

.mskkp-landing-community-news-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;
}

.mskkp-landing-community-news-header h2 {
    margin: 0;
}

.mskkp-landing-community-news-item {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
}

.mskkp-landing-community-news-thumb {
    width: 80px;
    height: 80px;
    flex: 0 0 80px;
    background-color: #ffffff;
    overflow: hidden;
}

.mskkp-landing-community-news-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.mskkp-landing-community-news-copy {
    flex: 1;
}

.mskkp-landing-community-news-title {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 4px;
}

.mskkp-landing-community-news-body {
    font-size: 14px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
