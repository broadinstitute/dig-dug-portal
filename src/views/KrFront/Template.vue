<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h3>KrFront</h3>
                        <p class="mb-0">
                            Scaffold page is ready. Add KR front-page prototype content here.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
