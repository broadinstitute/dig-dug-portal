<template>
    <div class="front-page-body">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>
        <!-- Body -->
        <div v-if="$parent.diseaseGroup">
            <div class="fluid">
                <div
                    :class="
                        'front-top-banner-' +
                        $parent.diseaseGroup.name +
                        'kp front-top-banner'
                    "
                >
                    <div class="container" style="display: block !important">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="front-logo-wrapper">
                                    <img
                                        v-if="
                                            $parent.frontContents
                                                .field_front_logo
                                        "
                                        class="front-logo-img"
                                        :src="
                                            'https://kp4cd.org/sites/default/files/vueportal/' +
                                            $parent.frontContents
                                                .field_front_logo
                                        "
                                    />
                                    <span
                                        :class="
                                            'front-logo-tagline front-logo-tagline-' +
                                            $parent.diseaseGroup.name +
                                            'kp'
                                        "
                                        v-html="
                                            $parent.frontContents.field_tagline
                                        "
                                    ></span>
                                </div>
                            </div>
                        </div>
                        <!-- A2F only feature -->
                        <div
                            v-if="$parent.diseaseGroup.name == 'a2f'"
                            class="row"
                            style="margin-top: 25px"
                        >
                            <div class="col-md-8 offset-md-2">
                                <h4
                                    style="color: #fff"
                                    align="center"
                                    v-html="
                                        !!$parent.diseaseInSession
                                            ? '<small>Current focus:</small> ' +
                                              $parent.diseaseInSession
                                            : 'Set system focus'
                                    "
                                ></h4>

                                <div
                                    :class="
                                        !$parent.diseaseInSession
                                            ? 'hidden'
                                            : ''
                                    "
                                    style="
                                        text-align: center;
                                        margin-bottom: 20px;
                                    "
                                >
                                    <span
                                        href="javascript:;"
                                        align="center"
                                        class="btn btn-sm btn-light"
                                        @click="
                                            $parent.showHideElement(
                                                'disease_systems_tree'
                                            )
                                        "
                                    >
                                        {{ "Change focus" }}</span
                                    >
                                </div>

                                <div
                                    v-if="
                                        $store.state.bioPortal.diseaseSystems
                                            .length > 0 &&
                                        $parent.phenotypes.length > 0
                                    "
                                    id="disease_systems_tree"
                                    class="disease-systems-trees-wrapper"
                                    :class="
                                        !!$parent.diseaseInSession
                                            ? 'hidden'
                                            : ''
                                    "
                                >
                                    <disease-systems
                                        page="front"
                                        :diseases="
                                            $store.state.bioPortal
                                                .diseaseSystems
                                        "
                                        :disease-groups="
                                            $store.state.bioPortal.diseaseGroups
                                        "
                                        :phenotypes="$parent.phenotypes"
                                        :phenotype-correlation="
                                            $store.state.phenotypeCorrelation
                                        "
                                    ></disease-systems>
                                </div>
                            </div>
                        </div>
                        <!-- end -->
                        <!-- search for CMD -->
                        <div
                            v-if="$store.getters['bioPortal/isRootPortal']"
                            class="row"
                        >
                            <div class="col-md-12 portal-front-tabs">
                                <b-tabs content-class="mt-3" align="center">
                                    <b-tab
                                        title="Gene, region, variant or phenotype"
                                        active
                                    >
                                        <div
                                            class="col-md-8 offset-md-2"
                                            align="center"
                                        >
                                            <div class="single-search-wrapper">
                                                <research-single-search
                                                    :single-search-config="null"
                                                    :phenotypes="
                                                        $parent.phenotypesInSession
                                                    "
                                                    :utils="$parent.utilsBox"
                                                ></research-single-search>
                                                <div
                                                    class="region-search-examples a2f-region-search-examples"
                                                >
                                                    <documentation
                                                        name="home.example"
                                                        :group="
                                                            $parent.diseaseGroup
                                                                .name
                                                        "
                                                    ></documentation>
                                                </div>
                                            </div>
                                        </div>
                                    </b-tab>

                                    <b-tab title="Disease-specific portals">
                                        <disease-group-select
                                            :disease-groups="
                                                $store.state.bioPortal
                                                    .diseaseGroups
                                            "
                                        ></disease-group-select>
                                    </b-tab>
                                </b-tabs>
                            </div>
                        </div>
                        <!-- end -->
                        <div id="stats">
                            <div class="stats">
                                <div class="stat">
                                    <div class="icon">
                                        <img
                                            src="/images/icons/stats/phenotypes.svg"
                                        />
                                    </div>
                                    <div class="info">
                                        <div class="count">
                                            {{
                                                $parent.pageStats["Phenotypes"]
                                            }}
                                        </div>
                                        <div class="label">Phenotypes</div>
                                    </div>
                                </div>
                                <div class="stat">
                                    <div class="icon">
                                        <img
                                            src="/images/icons/stats/genetic_datasets.svg"
                                        />
                                    </div>
                                    <div class="info">
                                        <div class="count">
                                            {{
                                                $parent.pageStats[
                                                    "Genetic datasets"
                                                ]
                                            }}
                                        </div>
                                        <div class="label">
                                            Genetic Datasets
                                        </div>
                                    </div>
                                </div>
                                <div class="stat">
                                    <div class="icon">
                                        <img
                                            src="/images/icons/stats/genomic_datasets.svg"
                                        />
                                    </div>
                                    <div class="info">
                                        <div class="count">
                                            {{
                                                $parent.pageStats[
                                                    "Genomic datasets"
                                                ]
                                            }}
                                        </div>
                                        <div class="label">
                                            Genomic Datasets
                                        </div>
                                    </div>
                                </div>
                                <div class="stat">
                                    <div class="icon">
                                        <img
                                            src="/images/icons/stats/bioinfomatics_methods.svg"
                                        />
                                    </div>
                                    <div class="info">
                                        <div class="count">
                                            {{
                                                $parent.pageStats[
                                                    "Bioinformatic methods"
                                                ]
                                            }}
                                        </div>
                                        <div class="label">
                                            Bioinfomatic Methods
                                        </div>
                                    </div>
                                </div>
                                <div class="stat">
                                    <div class="icon">
                                        <img
                                            src="/images/icons/stats/curated_datasets.svg"
                                        />
                                    </div>
                                    <div class="info">
                                        <div class="count">
                                            {{
                                                $parent.pageStats[
                                                    "Curated datasets"
                                                ]
                                            }}
                                        </div>
                                        <div class="label">
                                            Curated Datasets
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- search for all portals except CMD -->
                        <template
                            v-if="!$store.getters['bioPortal/isRootPortal']"
                        >
                            <div class="row front-search-section">
                                <div
                                    class="col-md-8 offset-md-2"
                                    align="center"
                                >
                                    <div class="single-search-wrapper">
                                        <h4 style="color: #fff">
                                            Search gene, variant, region,
                                            phenotype or tissue
                                        </h4>
                                        <research-single-search
                                            :single-search-config="null"
                                            :phenotypes="
                                                $parent.phenotypesInSession
                                            "
                                            :utils="$parent.utilsBox"
                                        ></research-single-search>
                                        <div
                                            class="region-search-examples a2f-region-search-examples"
                                        >
                                            <documentation
                                                name="home.example"
                                                :group="
                                                    $parent.diseaseGroup.name
                                                "
                                            ></documentation>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <!-- end -->
                    </div>
                </div>
            </div>

            <!---->

            <!---->
            <!-- A2FKP only static content -->
            <template v-if="$parent.diseaseGroup.name == 'a2f'">
                <div class="container static-content-section">
                    <div class="row">
                        <div
                            v-if="!!$parent.kPortals"
                            class="col-md-8"
                            style="margin-left: -30px; margin-right: 30px"
                        >
                            <h2>Community Knowledge Portals</h2>
                            <p></p>
                            <div class="row">
                                <div
                                    v-for="portal in $parent.kPortals"
                                    :key="portal.title"
                                    class="k-portal"
                                >
                                    <div v-html="portal.body"></div>
                                    <div
                                        class="kp-title"
                                        v-html="portal.title"
                                    ></div>
                                    <div>
                                        <a :href="portal.field_portal_address"
                                            >Visit portal</a
                                        >
                                    </div>
                                </div>
                            </div>
                            <h2>
                                What's new
                                <span style="font-size: 16px"
                                    ><a href="/news.html" target="_blank"
                                        >View news archive ></a
                                    ></span
                                >
                            </h2>

                            <news-feed-section
                                :disease-group="$parent.diseaseGroup"
                                :news-feed="$store.state.kp4cd.newsFeed"
                            ></news-feed-section>
                        </div>
                        <div class="col-md-4">
                            <research-page-description
                                v-if="$parent.pageDescription != null"
                                :content="$parent.pageDescription"
                                :utils="$parent.utilsBox"
                            ></research-page-description>

                            <about-project-section
                                :front-contents="$parent.frontContents"
                            ></about-project-section>
                        </div>
                    </div>
                </div>
            </template>
            <!-- end-->
            <!-- Static contents for other portals -->
            <template v-else>
                <div class="container static-content-section">
                    <div class="row">
                        <div class="col-md-7">
                            <about-portal-section
                                :front-contents="$parent.frontContents"
                            ></about-portal-section>
                            <!--<datasets-section
								:disease-group="$parent.diseaseGroup"
								:disease-groups="
									$store.state.bioPortal.diseaseGroups
								"
								:datasets-info="$store.state.kp4cd.datasetsInfo"
							></datasets-section>-->
                            <under-datasets-section
                                :front-contents="$parent.frontContents"
                            ></under-datasets-section>
                            <h2>
                                What's new
                                <span style="font-size: 16px"
                                    ><a href="/news.html" target="_blank"
                                        >View news archive ></a
                                    ></span
                                >
                            </h2>
                            <news-feed-section
                                :disease-group="$parent.diseaseGroup"
                                :news-feed="$store.state.kp4cd.newsFeed"
                            ></news-feed-section>
                        </div>
                        <div class="col-md-5">
                            <research-page-description
                                v-if="$parent.pageDescription != null"
                                :content="$parent.pageDescription"
                                :utils="$parent.utilsBox"
                            ></research-page-description>
                            <about-project-section
                                :front-contents="$parent.frontContents"
                            ></about-project-section>
                        </div>
                    </div></div
            ></template>
            <!-- end -->
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
.a2f-front-logo-wrapper {
    margin-left: auto;
    margin-right: auto;
    width: 900px;
    text-align: center;
}

.a2f-front-logo-img {
    width: 500px;
}
.a2f-front-tagline {
    font-size: 28px;
    font-weight: 100;
    color: #fff;
}

.front-search-section {
    margin-top: 50px;
}

.front-search-section .tab-pane {
    padding: 50px 0 50px 0;
}

.disease-systems-trees-wrapper {
    position: relative;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
}

.single-search-wrapper {
    position: relative;
    text-align: center;
    width: 680px;
    margin-left: auto;
    margin-right: auto;
}

.disease-systems-trees-wrapper {
}

.disease-systems-tree-header,
.single-search-header {
    position: absolute;
    transform: rotate(-90deg);
    border-radius: 15px;
    font-size: 12px;
    width: 280px;
    top: 48%;
    border: solid 1px #fff;
    left: 40px;
    color: #fff;
}

.single-search-header {
    width: 120px;
    top: 20%;
    border: solid 1px #fff;
    left: 120px;
}

.byor-single-search-wrapper input,
.byor-single-search-results {
    width: 680px !important;
}

.a2f-region-search-examples {
    text-align: center;
    color: #fff;
    margin-top: 10px;
    width: 100%;
}

.k-portal {
    width: 20%;
    text-align: center;
    font-size: 14px;
    border: solid 1px #eeeeee;
    border-bottom: none;
    border-top: none;
    margin-bottom: 25px;
    margin-right: -1px;
    padding: 5px 10px;
}

.k-portal .kp-title {
    font-size: 16px;
    line-height: 1.25em;
    font-weight: 500;
}

.k-portal img {
    height: 110px;
}
.a2fkp-footer {
    margin-top: 50px;
}

#stats {
    display: flex;
    align-items: center;
    justify-content: center;
}
.stats {
    display: flex;
    color: white;
    font-family: sans-serif;
    gap: 40px;
}
.stats .stat {
    display: flex;
    gap: 10px;
}
.stats .icon {
    height: 70px;
    width: fit-content;
}
.stats .icon img {
    height: 100%;
}
.stats .info {
    padding: 5px 0 0;
}
.stats .count {
    font-size: 22px;
    font-weight: bold;
}
.stats .label {
    font-size: 12px;
    max-width: 70px;
}
</style>
