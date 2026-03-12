<template>
    <div class="main-content">
        <div class="f-col" style="width:100%">
            <!-- CONTENT -->
             <!--
            <div v-if="$parent.info">
                <h2>{{ $parent.title }}</h2>
                <div v-html="$parent.info"></div>
            </div>
            -->
            <h2>Cell Atlas</h2>
            <research-single-cell-browser 
                v-if="$parent.scbConfig"
                sectionId="matkp"
                :renderConfig="$parent.scbConfig"
                :utils="$parent.utils"
                :data="$parent.data"
            ></research-single-cell-browser>
        </div>
    </div>
</template>
<style scoped>
::v-deep select, 
::v-deep input:not([type="checkbox"]){
    position:relative;
    width: 100%;
    height: 23px !important;
    border: 1px solid #ccc  !important;
    background: white !important;
    padding: 0 5px  !important;
    font-size: 14px  !important;
}
</style>