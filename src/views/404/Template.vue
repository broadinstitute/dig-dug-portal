<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body notfound">
            <div class="card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12">
                        <div class="page">
                            <span class="number">4</span>
                            <div class="DNA">
                                <div class="helix"></div>
                                <div class="bases at"></div>
                                <div class="bases ta"></div>
                                <div class="bases at"></div>
                                <div class="bases at"></div>
                                <div class="bases gc"></div>
                                <div class="bases ta"></div>
                                <div class="bases gc"></div>
                                <div class="bases gc"></div>
                                <div class="bases gc"></div>
                                <div class="bases at"></div>
                                <div class="bases at"></div>
                                <div class="bases ta"></div>
                                <div class="bases at"></div>
                                <div class="bases at"></div>
                                <div class="bases gc"></div>
                                <div class="bases gc"></div>
                                <div class="bases cg"></div>
                                <div class="bases gc"></div>
                                <div class="bases at"></div>
                                <div class="bases ta"></div>
                                <div class="bases ta"></div>
                                <div class="bases cg"></div>
                                <div class="bases cg"></div>
                            </div>
                            <span class="number">4</span>
                        </div>
                        <div class="notice">
                            <h4>Page Not Found</h4>
                            <p>We couldn't find the page you're looking for.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
@import url("/css/404.css");
</style>
