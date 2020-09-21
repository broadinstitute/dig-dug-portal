<template>
    <b-container class="bv-example-row mb-3">
        <b-row cols="2">
            <b-col>Column</b-col>
            <b-col>Column</b-col>
            <b-col>Column</b-col>
            <b-col>Column</b-col>
        </b-row>
    </b-container>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
export default {
    components: {}
};
</script>