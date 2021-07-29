<template>
    <div id="gem">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <documentation name="region.lz.subheader"></documentation>
                    <documentation name="region.igv.subheader"></documentation>
                </div>
            </div>
        </div>
    </div>
</template>
