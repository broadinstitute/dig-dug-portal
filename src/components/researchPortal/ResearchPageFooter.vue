<template>
        <div class="container-fluid paper-footer-wrapper">
            <a href="https://kp4cd.org/" style="color: #fff !important">
                Part of
                <span>
                    <img
                        src="https://kp4cd.org/sites/default/files/kpn_small.svg"
                        style="width: 50px; margin-left: 3px; margin-right: 5px"
                    />
                </span>
                <span
                    style="
                        font-weight: 500;
                        font-size: 1.2em;
                        vertical-align: -0.1em;
                    "
                    >the Knowledge Portal Network</span
                >
            </a>
        </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-page-footer", {
    props: [],

    data() {
        return {};
    },
});
</script>

<style>
.paper-footer-wrapper {
    background-color: cornflowerblue;
    padding-top: 10px;
    padding-bottom: 10px;
    text-align: center;
    font-size: 12px;
    position: absolute;
    bottom: 0;
}
</style>
