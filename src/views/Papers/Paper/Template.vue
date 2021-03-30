<template>
    <div>
        <!-- Header -->
        <paper-page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :paperMenu="$parent.paperMenu[0].body"
            v-if="!!$parent.paperMenu"
        ></paper-page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2
                            v-if="$parent.researchMethod != null"
                            v-html="$parent.researchMethod[0].title"
                        ></h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <research-method-section
                        v-if="$parent.researchMethod != null"
                        :researchMethod="$parent.researchMethod"
                    ></research-method-section>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <paper-page-footer
            :disease-group="$parent.diseaseGroup"
        ></paper-page-footer>
    </div>
</template>
