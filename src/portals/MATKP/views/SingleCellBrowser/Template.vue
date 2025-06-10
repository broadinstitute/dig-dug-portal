<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div
                class="mat-body f-col"
                style="max-width: 1400px; margin: 0 auto; width: -webkit-fill-available"
            >
                <!-- CONTENT -->
                 <div v-if="$parent.info">
                    <h2>{{ $parent.title }}</h2>
                    <div v-html="$parent.info"></div>
                 </div>
                <research-single-cell-browser 
                    v-if="$parent.scbConfig"
                    sectionId="matkp"
                    :renderConfig="$parent.scbConfig"
                    :utils="$parent.utils"
                    :data="$parent.data"
                ></research-single-cell-browser>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
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