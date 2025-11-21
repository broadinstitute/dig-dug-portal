<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-hero">
            <div class="pkb-hero-bg">
                <img
                    src="https://hugeampkpncms.org/sites/default/files/images/pankbase/pankbase_hero_bg.jpg"
                />
            </div>
            <div class="pbk-hero-title">
                {{ $parent.content.hero.blurb }}
            </div>
        </div>

        <div class="pkb-search">
                <div style="font-weight: bold;">Search Gene</div>
                <research-single-search
                    :single-search-config="null"
                    :phenotypes="[]"
                    :utils="$parent.utilsBox"
                ></research-single-search>
            </div>

        <div class="pkb-body">
            <div class="section">
                <div>
                    <div class="section-title">
                        {{ $parent.content.resources.title }}
                    </div>
                    <div class="section-subtitle">
                        {{ $parent.content.resources.subtitle }}
                    </div>
                </div>
                <div v-for="row in $parent.content.resources.rows" class="section-items">
                    <div v-for="item in row" class="section-item" :class="[item.type, item.comingSoon ? 'soon' : '']">
                        <div class="item-copy" style="justify-content: space-between">
                            <div>
                                <div class="item-title">{{ item.title }}</div>
                                <div class="item-body" v-html="item.body"></div>
                            </div>
                            <a class="item-btn" :href="item.linkUrl">{{ item.linkLabel }} ❯</a>
                        </div>
                        <div class="item-bg contain">
                            <img :src="item.bgImage" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div>
                    <div class="section-title">
                        {{ $parent.content.tools.title }}
                    </div>
                    <div class="section-subtitle">
                        {{ $parent.content.tools.subtitle }}
                    </div>
                </div>
                <div class="f-row section-items">
                    <div
                        class="section-item"
                        v-for="item in $parent.content.tools.rows"
                        :class="[item.type, item.comingSoon ? 'soon' : '']"
                    >
                        <div class="item-copy">
                            <div class="item-title">{{ item.title }}</div>
                            <div class="item-body" v-html="item.body"></div>
                            <a class="item-btn" :href="item.linkUrl"
                                >{{ item.linkLabel }} ❯</a
                            >
                        </div>
                        <div class="item-bg contain">
                            <img :src="item.bgImage" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div>
                    <div class="section-title">
                        {{ $parent.content.examples.title }}
                    </div>
                    <div class="section-subtitle">
                        {{ $parent.content.examples.subtitle }}
                    </div>
                </div>
                <div class="f-row section-items" style="flex-direction: column">
                    <div
                        class="example-item"
                        v-for="item in $parent.content.examples.rows"
                    >
                        <div class="example-item-title">
                            {{ item.title }}
                        </div>
                        <a v-if="item.linkUrl" :href="item.linkUrl">{{ item.linkLabel }} ❯</a>
                        <div v-else>{{ item.linkLabel }} ❯</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div>
                    <div class="section-title">
                        {{ $parent.content.external.title }}
                    </div>
                    <div class="section-subtitle">
                        {{ $parent.content.external.subtitle }}
                    </div>
                </div>
                <div class="f-row section-items">
                    <div
                        class="section-item"
                        v-for="item in $parent.content.external.rows"
                        :class="[item.type, item.comingSoon ? 'soon' : '']"
                    >
                        <div class="item-copy">
                            <div class="item-title">{{ item.title }}</div>
                            <div class="item-body" v-html="item.body"></div>
                            <a class="item-btn" :href="item.linkUrl" style="margin-top: auto;"
                                >{{ item.linkLabel }} ❯</a
                            >
                        </div>
                        <div class="item-bg contain">
                            <img :src="item.bgImage" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="section" style="gap: 5px; margin: 40px 0">
                <div class="partners" style="background: #fbfbfb">
                    <div
                        class="partner-logo"
                        v-for="item in $parent.content.partners.list"
                    >
                        <a :href="item.url || null" target="_blank">
                            <img :src="item.logo" />
                        </a>
                    </div>
                </div>
                <div class="partners-title">
                    {{ $parent.content.partners.title }}
                </div>
            </div>

            <div class="section" style="flex-direction: row">
                <div class="f-col" style="flex: 1; gap:20px">
                    <div v-for="item in $parent.content.extras" class="collab f-col" style="gap: 10px">
                        <div class="section-title">{{item.title}}</div>
                        <div class="f-row" style="gap:20px">
                            <div v-if="item.icon"><img :src="item.icon" style="height: 80px;"/></div>
                            <div v-html="item.body"></div>
                        </div>
                    </div>
                </div>

                <div class="news f-col" style="flex: 1; gap: 10px">
                    <div class="section-title">News</div>
                    <div class="news-items" v-if="$parent.newsFeed">
                        <div
                            class="news-item f-row"
                            v-for="item in $parent.newsFeed"
                        >
                            <div
                                class="news-thumbnail contain"
                                v-html="item.field_thumbnail_image"
                            ></div>
                            <div class="f-col">
                                <a
                                    :href="`${$parent.content.news.newsItemUrl}${item.nid}`"
                                    ><div class="">{{ item.title }}</div></a
                                >
                                <div class="" v-html="item.body"></div>
                            </div>
                        </div>
                        <a
                            style="align-self: flex-end"
                            :href="`${$parent.content.news.newsUrl}`"
                            >See All News</a
                        >
                    </div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped>
.pkb-nav {
    background: #fafafa99 !important;
}
.pkb-hero {
    position: relative;
    min-height: 500px;
    width: 100%;
    overflow: hidden;
}
.pkb-hero-bg {
    position: absolute;
    width: 100%;
}
.pkb-hero-bg img {
    position: absolute;
    width: 1300px;
    top: -420px;
    right: calc(50% - 450px);
}
.pbk-hero-title {
    position: absolute;
    left: calc(50% + 75px);
    top: 250px;
    max-width: 250px;
    font-size: 22px;
    font-weight: bold;
    line-height: 22px;
}

.pkb-body {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-bottom: 50px;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.section-title {
    font-size: 1.6em;
    font-weight: bold;
}
.section-subtitle {
    font-size: 1.2em;
}
.section-items {
    display: flex;
    gap: 20px;
}
.section-item {
    display: flex;
    background: #fbfbfb;
    border: 1px solid #eee;
    flex: 1;
    position: relative;
}
.item-copy {
    width: -webkit-fill-available;
    max-width: 200px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.item-title {
    font-weight: bold;
    font-size: 1.2em;
}
.item-bg {
    width: 100%;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    mix-blend-mode: darken;
    overflow: hidden;
}
::v-deep .contain img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 7%;
}

::v-deep .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

::v-deep .pkb-search {
  position:absolute;
  top:470px;
  width:40%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

::v-deep .pkb-search input::placeholder {
  color: transparent;
}

::v-deep .search-word-group a:not(.search-gene-link){
    display:none;
}

::v-deep .pkb-search .reset-search{
    right: -19px;
}

.section-item.medium {
    flex-direction: column-reverse;
    justify-content: flex-end;

    .item-copy {
        width: -webkit-fill-available;
        max-width: unset;
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .item-title {
        font-weight: bold;
        font-size: 1.2em;
    }
    .item-bg {
        width: auto;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        mix-blend-mode: darken;
        overflow: hidden;
    }
}

.section-item.soon::after {
    content: "Coming Soon";
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: rgb(251 251 251 / 80%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: black;
}

.example-item {
    display: flex;
    justify-content: space-between;
    background: #fbfbfb;
    padding: 10px;
}

.partners {
    display: flex;
    gap: 20px;
    justify-content: center;
    padding: 20px;
}
.partners-title {
    align-self: center;
    text-transform: uppercase;
    font-weight: bold;
    color: #ccc;
}
.partner-logo {
    height: 50px;
    mix-blend-mode: darken;
}
.partner-logo img {
    height: 50px;
}

.news-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.news-item {
    gap: 10px;
}
.news-thumbnail {
    min-width: 200px;
    height: 100px;
    background: #fbfbfb;
    border: 1px solid #eee;
}
.news-thumbnail img {
    mix-blend-mode: darken;
}
</style>
