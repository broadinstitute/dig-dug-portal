<template>
    <div>
        <!-- Header -->
        <!--<paper-page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :paperMenu="$parent.paperMenu[0].body"
            v-if="!!$parent.paperMenu"
        ></paper-page-header>-->

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            {{ $parent.researchPage }}
        </div>
        <div class="container-fluid mdkp-body">
            {{ $parent.dataTableFormat }}
        </div>
        <div class="container-fluid mdkp-body">
            {{ $parent.researchData }}
        </div>

        <!-- Footer-->
        <!--<paper-page-footer
            :disease-group="$parent.diseaseGroup"
        ></paper-page-footer>-->
    </div>
</template>

<style>
/*@import url("/css/effectorGenes.css");*/
</style>
