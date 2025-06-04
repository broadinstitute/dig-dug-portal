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