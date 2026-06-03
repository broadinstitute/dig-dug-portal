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
            <div id="pigean" class="fluid">
                <div
                    :class="
                        'front-top-banner-' +
                        $parent.diseaseGroup.name +
                        'kp front-top-banner'
                    "
                    style="height: 70vh"
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
                                        style="font-size: 2.3rem"
                                        >Priors Inferred from GEne
                                        ANotations</span
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- search for all portals except CMD -->

                        <div class="row front-search-section">
                            <div class="col-md-8 offset-md-2" align="center">
                                <div class="single-search-wrapper">
                                    <h4 style="color: #fff">
                                        Search for gene, geneset or phenotype
                                    </h4>
                                    <research-single-search
                                        :single-search-config="$parent.altConfig"
                                        :phenotypes="
                                            $parent.phenotypesInSession
                                        "
                                        :utils="$parent.utilsBox"
                                    ></research-single-search>
                                </div>
                            </div>
                        </div>

                        <!-- end -->
                    </div>
                </div>
            </div>

            <!-- end -->
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
p[id="home.example"] {
    white-space: break-spaces;
}
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
    margin-top: 40px;
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
#pigean .front-logo-tagline-a2fkp {
    transform: translate(0%, 40%);
}
</style>
