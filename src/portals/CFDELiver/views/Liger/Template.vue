<template>
    <div class="main-content">
        <div class="f-col" style="width:100%">
            <LigerBrowser :config="$parent.ligerConfig" />
        </div>
    </div>
</template>
<style scoped>
::v-deep .heatmap-meta{
    white-space: nowrap;
}
::v-deep .drawer{
    top:65px !important;
    height: calc(100vh - 65px) !important;
}
::v-deep .metric-tooltip-bubble{
    white-space: normal;
}
::v-deep .bar-fill{
    background: linear-gradient(90deg, #aaa, #2dd643) !important;
}
</style>