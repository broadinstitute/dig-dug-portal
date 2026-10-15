<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <birds-dashboard></birds-dashboard>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
.mdkp-body {
    padding-top: 0px;
}
</style>