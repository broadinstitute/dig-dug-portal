<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->

        <div class="pkb-body">
           <b-table :items="$parent.donors" :fields="$parent.donorsFields"  class="table table-striped table-hover table-sm" head-variant="light"></b-table>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped>
.pkb-nav {
    background: #fafafa99 !important;
}
</style>
