<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body" style="gap:70px">
            <div class="section hero f-row grow-children align-v-center" style="gap:50px;">
                <div class="f-col" style="gap:20px; margin-top: -100px;">
                    <div class="f-col">
                        <div class="hero-title">SysBio FAIRplex</div>
                        <h4 style="line-height: 1em;">
                            a FAIR PLatform for EXploration<br />
                            of Systems Biology
                        </h4>
                    </div>
                    <div>
                        Integrated multi-tissue and multi-modal data from<br />
                        the Accelerating Medicines Partnership<sup>®</sup> (AMP<sup>®</sup>) ecosystem<br />
                        to generate novel insights.</div>
                    <a href="/about.html?page=about" class="bold" style="color: #FFFFFF !important">Learn More ❯</a>
                </div>
                <div class="f-col" style="gap:20px; align-self:flex-end; padding-bottom: 10px;">
                    <input class="hero-search" type="text" placeholder="Search gene">
                    <div class="f-row spread-out" style="gap:15px">
                        <div class="stat f-row">
                            <div class="stat-num">08</div>
                            <div class="stat-txt">AMP® Programs</div>
                        </div>
                        <div class="stat f-row">
                            <div class="stat-num">40</div>
                            <div class="stat-txt">Datasets</div>
                        </div>
                        <div class="stat f-row">
                            <div class="stat-num">14</div>
                            <div class="stat-txt">Tissues</div>
                        </div>
                        <div class="stat f-row">
                            <div class="stat-num">23</div>
                            <div class="stat-txt">Disease States</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Resources</h2>
                <div>Explore data from programs across the Accelerating Medicines Partnership (AMP)</div>
                <div class="section-body">
                    <div class="f-row">
                        <div class="tabs f-col">
                            <div class="tab f-col active" data-tab="composition" @click="$parent.showTab($event)">
                                <div class="tab-title">Data Composition</div>
                                <div class="tab-body">Distribution of samples by assay, tissue, and disease status</div>
                            </div>
                            <div class="tab f-col" data-tab="expression" @click="$parent.showTab($event)">
                                <div class="tab-title">Gene Expression</div>
                                <div class="tab-body">Differential gene expression across AMP programs</div>
                            </div>
                            <div class="tab f-col" data-tab="clustering" @click="$parent.showTab($event)">
                                <div class="tab-title">Sample Clustering</div>
                                <div class="tab-body">PCA of cases and controls</div>
                            </div>
                        </div>
                        <div class="tab-contents f-col">
                            <div class="tab-content active f-col" data-tab="composition">
                                <research-bar-in-cell-plot v-if="!!$parent.dataComposition.data"
                                    :plotData="$parent.dataComposition.data"
                                    :plotMargin="$parent.dataComposition.plotMargin"
                                    :plotConfig="$parent.dataComposition.plotConfig"
                                    :canvasId="$parent.dataComposition.id" :utils="null" />
                            </div>
                            <div class="tab-content f-col" data-tab="expression">
                                <div>Explore visualizations of differential gene expression within human tissues derived
                                    from the Accelerating Medicines Partnership (AMP) programs. Differential expression
                                    analyses were performed on blood-derived bulk RNA sequencing datasets from
                                    individuals with common metabolic disorders versus blood-derived pseudobulk RNA
                                    sequencing datasets from individuals with Parkinson's disease. The volcano plot
                                    shows all differentially expressed genes between the two groups.</div>
                                <div class="tab-content-img-wrapper">
                                    <img style="width: 450px;"
                                        src="https://hugeampkpncms.org/sites/default/files/images/sysbio/images/sysbio_volcano.jpg" />

                                </div>
                            </div>
                            <div class="tab-content f-col" data-tab="clustering">
                                <div>Explore principal component analyses (PCA) of cases and controls derived from
                                    the following Accelerating Medicines Partnership (AMP) programs: AMP AD, AMP PD,
                                    and AMP CMD. </div>
                                <div class="tab-content-img-wrapper">

                                    <img style="width: 850px;"
                                        src="https://hugeampkpncms.org/sites/default/files/images/sysbio/images/sysbio_pca_collected.jpg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Accelerating Medicines Partnership<sup>®</sup> (AMP<sup>®</sup>) Programs</h2>
                <div>Learn more about the AMP<sup>®</sup> Programs</div>
                <div class="section-body">
                    <div class="section-items f-row">
                        <div class="section-item" v-for="item in $parent.content.amps.rows"
                            :class="[item.type, item.comingSoon ? 'soon' : '']">
                            <div class="item-copy">
                                <div class="item-title">{{ item.title }}</div>
                                <div class="item-body" v-html="item.body"></div>
                                <a class="item-btn" :href="item.linkUrl" style="margin-top: auto;">{{ item.linkLabel
                                    }} ❯</a>
                            </div>
                            <div class="item-bg contain">
                                <img :src="item.bgImage" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>SysBio FAIRplex Consortium</h2>
                <div class="section-body">
                    <div class="partners">
                        <div class="partner-logo" v-for="item in $parent.content.partners.list">
                            <a :href="item.url || null" target="_blank">
                                <img :src="item.logo" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="f-row grow-children" style="gap:40px">
                <div class="section">
                    <h2>News</h2>
                    <div class="section-body">
                        <div class="news-items" v-if="$parent.newsFeed">
                            <div class="news-item f-row" v-for="item in $parent.newsFeed">
                                <div class="news-thumbnail contain" v-html="item.field_thumbnail_image"></div>
                                <div class="f-col">
                                    <a :href="`${$parent.content.news.newsItemUrl}${item.nid}`">
                                        <div class="">{{ item.title }}</div>
                                    </a>
                                    <div class="" v-html="item.body"></div>
                                </div>
                            </div>
                            <a style="align-self: flex-end" :href="`${$parent.content.news.newsUrl}`">See All News
                                ❯</a>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Releases</h2>
                    <div class="section-body">

                    </div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<style scoped>
.hero{
    background: #eee;
    height: 500px;
    margin: -40px -5vw 0;
    padding: 100px;
    background-image: url('https://hugeampkpncms.org/sites/default/files/images/sysbio/images/sysbio_hero.png');
    background-size: cover;
    background-position: bottom center;
    color: white;
}
.hero a{
    color:white !important;
}
.hero-title{
    font-size: 2.15rem;
    font-weight: bold;
}
.hero-search {
    padding: 7px 15px;
    border-radius: 5px;
    border: 0;
    box-shadow: 2px 2px 2px 0 black;
}
.stat{
    gap:5px;
}
.stat-num {
    font-size: 50px;
    line-height: 35px;
    font-weight: bold;
}
.stat-txt {
    width: min-content;
    line-height: 14px;
    display: flex;
    align-items: flex-end;
    font-weight: bold;
    color: #e6e6e6;
}

.section-body{
    padding: 20px 0 0;
}
.section-items {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}
.section-item {
    display: flex;
    background: #fbfbfb;
    border: 1px solid #eee;
    flex: 1;
    position: relative;
    min-width: calc(25% - 20px);
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
    font-size: 1.1em;
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
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        mix-blend-mode: darken;
        overflow: hidden;
    }
}


.partners {
    display: flex;
    gap: 20px;
    justify-content: center;
    padding: 20px;
    flex-wrap: wrap;
    background: #eee;
    margin: 0 -5vw;
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


.tabs {
    width: 300px;
    min-width: 300px;
    gap: 1px;
}
.tab {
    padding: 20px;
    background: #eee;
    margin: 0 0 0 5px;
    border-radius: 5px 0 0 5px;
    cursor: pointer;
}
.tab.active {
    background: white;
    box-shadow: 2px 2px 2px 0 black;
    z-index: 1;
    margin: 0;
    cursor: default;
}
.tab-contents {
    flex: 1;
    background: white;
    z-index: 1;
    min-height: 100%;
    padding: 20px;
    border-radius: 0 5px 5px 0;
    box-shadow: 2px 2px 2px 0 black;
}
.tab-content{
    display:none !important;
}
.tab-content.active{
    display:flex !important;
}
.tab-title{
    font-weight: bold;
    font-size: 1.1em;
}

.tab-content-img-wrapper {
    text-align: center;
    padding-top: 15px;
}

::v-deep #sysBioDataCompositionbarInCellPlot{
    width: 100% !important;
    min-width: 600px;
    height: auto !important;
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