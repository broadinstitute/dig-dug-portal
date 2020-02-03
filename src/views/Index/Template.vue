<template>
    <div>
        <!-- Header -->
        <page-header></page-header>

        <!-- Body -->
        <div class="container-fluid front-top-banner-mdkp front-top-banner">
            <div class="row">
                <div class="col-md-12">
                    <div class="front-logo-wrapper">
                        <img class="front-logo-img" src="images/MDKP_front_logo.svg" />
                        <span
                            class="front-logo-tagline front-logo-tagline-mdkp"
                        >Providing data and tools to promote understanding of cardiometabolic disorders and their complications</span>
                    </div>
                </div>
                <div class="col-md-6 offset-md-3" style="text-align: center; padding-top: 30px;"></div>

                <div class="col-md-12">
                    <h2
                        class="front-banner-ui-tabs"
                        style="font-size: 45px; padding-bottom: 15px;"
                    >Explore by region</h2>
                    <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypes"></phenotype-selectpicker>
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
