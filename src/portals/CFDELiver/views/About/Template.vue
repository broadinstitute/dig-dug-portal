<template>
    <div class="main-content">
        <div class="f-col" style="width:100%">
            <!-- CONTENT -->
             <div v-if="$parent.page === 'about'">
                <h1 class="page-title">{{ $parent.pageTitleAbout }}</h1>
                <div v-html="$parent.pageContentAbout"></div>
             </div>
             <div v-if="$parent.page === 'governance'">
                <h1 class="page-title">{{ $parent.pageTitleGovernance }}</h1>
                <div v-html="$parent.pageContentGovernance"></div>
             </div>
        </div>
    </div>
</template>
<style scoped>
h1.page-title {
    margin-bottom: 25px;
}
</style>