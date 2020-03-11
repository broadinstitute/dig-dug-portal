<template>
    <!-- Header -->
    <div>
        <page-header
            :disease-groups="$store.state.bioPortal.diseaseGroups"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">Transcript</div>
        

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
