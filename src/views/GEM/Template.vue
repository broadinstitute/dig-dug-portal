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
            <div class="card mdkp-card">
                <div class="card-body">something</div>
            </div>
        </div>

        <b-button v-b-toggle.sidebar-1>Show Criteria</b-button>
        <b-sidebar id="sidebar-1" title="Criteria" shadow>
            <div class="px-3 py-2">
                <p>
                    Cras mattis consectetur purus sit amet fermentum. Cras justo
                    odio, dapibus ac facilisis in, egestas eget quam. Morbi leo
                    risus, porta ac consectetur ac, vestibulum at eros.
                </p>
                <b-img
                    src="https://picsum.photos/500/500/?image=54"
                    fluid
                    thumbnail
                ></b-img>
            </div>
        </b-sidebar>
    </div>
</template>
