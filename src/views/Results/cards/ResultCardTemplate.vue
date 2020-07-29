<template>
    <div>
        <slot name="header">
            <h4>{{title}} <scroll-to-arrow></scroll-to-arrow></h4>
            <slot name="subheader"></slot>
        </slot>
        <b-row>
            <slot name="sidebar">
                <!-- <b-col cols="3">
                    TODO: Sidebar for card type compatible with {{ title }}
                </b-col> -->
            </slot>
            <b-col>
                <slot name="content"></slot>
            </b-col>
        </b-row>
    </div>
</template>
<script>
import Vue from "vue"

import ScrollToTop from "@/components/ScrollToTop"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
Vue.use(BootstrapVue);
export default Vue.component('result-card-template', {
    props: ["title", "card"],
    components: {
        ScrollToTop,
    }
})
</script>
