<template>
    <div>
        <!-- Header -->
        <page-header></page-header>

        <!-- Body -->
        <div class="fluid">
            <div :class="'front-top-banner-'+this.$store.state.diseaseGroup+'kp front-top-banner'">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="front-logo-wrapper">
                                <img
                                    class="front-logo-img"
                                    :src="'images/'+this.$store.state.diseaseGroup+'kp_front_logo.svg'"
                                />
                                <span
                                    :class="'front-logo-tagline front-logo-tagline-'+this.$store.state.diseaseGroup+'kp'"
                                >Providing data and tools to promote understanding of cardiometabolic disorders and their complications</span>
                            </div>
                        </div>

                        <div class="col-md-12 portal-front-tabs">
                            <b-tabs content-class="mt-3" align="center">
                                <b-tab title="Explore by region" active></b-tab>
                                <b-tab title="Explore by phenotype">
                                    <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypes"></phenotype-selectpicker>
                                </b-tab>
                                <b-tab title="Set default disease group">
                                    <disease-group-select></disease-group-select>
                                </b-tab>
                            </b-tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container static-content-section">
            <div class="row">
                <div class="col-md-7">
                    <about-portal-section></about-portal-section>
                    <datasets-section></datasets-section>
                </div>
                <div class="col-md-5">
                    <news-feed-section></news-feed-section>
                    <about-project-section></about-project-section>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer></page-footer>
    </div>
</template>
