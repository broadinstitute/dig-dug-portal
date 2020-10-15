<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Hello</h4>
                    <div class="row">something</div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
