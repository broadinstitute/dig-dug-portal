<template>
    <div>
        <h4>{{title}}</h4>
        <b-row>
            <b-col cols="3">
                <slot name="sidebar">
                    TODO: Sidebar for card type compatible with {{ title }}
                </slot>
            </b-col>
            <b-col>
                <slot name="content"></slot>
            </b-col>
        </b-row>
    </div>
</template>
<script>
import Vue from "vue"
import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
Vue.use(BootstrapVue);
export default Vue.component('result-card-template', {
    props: ["title"],
})
</script>
