<template>
    <div class="sysbio-body">
        <!-- NAV -->
        <page-nav></page-nav>
        <!-- BODY -->
        <div
            class="static-content-wrapper"
        >
            <!-- CONTENT -->
            <h2 class="static-header">{{ $parent.pageContent.title }}</h2>
            <div v-html="$parent.pageContent.body"  class="static-content"></div>
        </div>
        <!-- FOOTER -->
        <page-footer></page-footer>
    </div>
  
</template>

<script>
export default {

}
</script>

<style>

</style>