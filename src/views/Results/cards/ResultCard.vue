<template>
    <div>
        <h4>{{title}}</h4>
        <b-row>
            <b-col>
                <slot name="content"></slot>
            </b-col>
            <b-col cols="4">
                <slot name="sidebar">
                    TODO: Sidebar for card type compatible with {{ title }}
                </slot>
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
export default Vue.component('result-card', {
    props: ["title"],
    components: {
    },
})
</script>
