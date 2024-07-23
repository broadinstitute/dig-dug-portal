<template>
    <div class="front-page-body">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
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
                    <div class="container">
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
                                        >{{
                                            $parent.frontContents.field_tagline
                                        }}</span
                                    >
                                </div>
                            </div>

                            <div class="col-md-12 portal-front-tabs">
                                <div class="front-gene-search-wrapper">
                                    <h4 class="text-center white">
                                        Search gene, region or variant
                                    </h4>
                                    <div class="col-md-12 input-wrapper">
                                        <autocomplete
                                            :placeholder="'Search'"
                                            :matches="$parent.matchingGenes"
                                            :match-key="null"
                                            @input-change="
                                                $store.dispatch(
                                                    'lookupGenes',
                                                    $event
                                                )
                                            "
                                            @keyup-enter="
                                                $store.dispatch(
                                                    'exploreRegionOrVariant',
                                                    $event
                                                )
                                            "
                                            @item-select="
                                                $store.dispatch(
                                                    'onGeneChange',
                                                    $event
                                                )
                                            "
                                        ></autocomplete>
                                    </div>
                                    <div class="region-search-examples">
                                        <documentation
                                            name="home.example"
                                            :group="$parent.diseaseGroup.name"
                                        ></documentation>
                                    </div>

                                    <div
                                        v-show="
                                            $store.state.invalidGeneOrRegion
                                        "
                                        class="text-danger"
                                    >
                                        Invalid gene name or region or variant
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                    </div>
                    <div class="col-md-5">
                        <about-project-section
                            :front-contents="$parent.frontContents"
                        ></about-project-section>
                        <news-feed-section
                            :disease-group="$parent.diseaseGroup"
                            :news-feed="$store.state.kp4cd.newsFeed"
                        ></news-feed-section>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
h4.white {
    color: white;
}
</style>
