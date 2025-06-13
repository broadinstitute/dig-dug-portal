<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div>
                <div v-html="$parent.info"></div>
                <iframe
                    id="meta-embed"
                    src="https://tools.cmdga.org/PCA_explorer/"
                ></iframe>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>
<style>
#meta-embed {
    width: 100%;
    height: 1300px;
    border: none;
    margin: 40px 0 0;
}
</style>
