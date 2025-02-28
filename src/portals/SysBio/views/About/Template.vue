<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <h2 class="static-header">{{ $parent.pageContent.title }}</h2>
            <div v-html="$parent.pageContent.body"  class="static-content"></div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
export default {

}
</script>

<style scoped>
.sysbio-body{
    max-width: 1000px !important;
}


</style>