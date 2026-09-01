<template>
    <section class="msskp-landing-community">
        <div class="msskp-landing-community-columns">
            <div class="msskp-landing-community-about">
                <h2>About Us</h2>
                <p>
                    It is being developed by a team of scientists and software
                    engineers at the
                    <span class="msskp-landing-community-link"
                        >Broad Institute</span
                    >
                    in collaboration with the
                    <span class="msskp-landing-community-link"
                        >International Federation of Musculoskeletal Research
                        Societies (IFMRS)</span
                    >.
                </p>
                <h2>Contact</h2>
                <p>
                    We welcome the involvement of interested researchers.
                    <span class="msskp-landing-community-link">Contact us</span>
                    to learn more about contributing data or collaborating with
                    us on analyses, methods, or tool development.
                </p>
                <p>
                    <span class="msskp-landing-community-link">Sign up</span>
                    for emailed updates, newsletters, and webinar invitations.
                </p>
            </div>
            <div class="msskp-landing-community-news">
                <div class="msskp-landing-community-news-header">
                    <h2>News</h2>
                    <span class="msskp-landing-community-link">see more</span>
                </div>
                <div
                    v-for="item in latestNews"
                    :key="item.nid"
                    class="msskp-landing-community-news-item"
                >
                    <div class="msskp-landing-community-news-thumb">
                        <img
                            v-if="item.field_image"
                            :src="item.field_image"
                            :alt="item.title"
                        />
                    </div>
                    <div class="msskp-landing-community-news-copy">
                        <div class="msskp-landing-community-news-title">
                            {{ item.title }}
                        </div>
                        <div class="msskp-landing-community-news-body">
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

export default Vue.component("msskp-landing-community", {
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
.msskp-landing-community {
    width: 100%;
    background-color: #bcafd6;
    color: #ffffff;
    padding: 35px 50px;
    box-sizing: border-box;
}

.msskp-landing-community-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    align-items: start;
}

.msskp-landing-community h2 {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 12px;
}

.msskp-landing-community-about h2 + h2,
.msskp-landing-community-about p + h2 {
    margin-top: 28px;
}

.msskp-landing-community p {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 1.5;
    color: #ffffff;
}

.msskp-landing-community-link {
    color: #ffffff;
    text-decoration: underline;
}

.msskp-landing-community-news-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;
}

.msskp-landing-community-news-header h2 {
    margin: 0;
}

.msskp-landing-community-news-item {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
}

.msskp-landing-community-news-thumb {
    width: 80px;
    height: 80px;
    flex: 0 0 80px;
    background-color: #ffffff;
    overflow: hidden;
}

.msskp-landing-community-news-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.msskp-landing-community-news-copy {
    flex: 1;
}

.msskp-landing-community-news-title {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 4px;
}

.msskp-landing-community-news-body {
    font-size: 14px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
