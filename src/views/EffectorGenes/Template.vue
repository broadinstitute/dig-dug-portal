<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>Effector gene predictions</h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12" style="font-size: 20px">
                            <documentation name="egl.summaries.info"></documentation>
                        </div>
                    </div>
                    <div
                        class="row"
                        v-if="$parent.eglSummaries && $parent.eglSummaries[0]"
                        v-for="item in $parent.eglSummaries"
                    >
                        <div class="col-md-12" v-html="item.body"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
