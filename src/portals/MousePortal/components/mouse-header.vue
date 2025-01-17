<template>
  <div class="mouse-header-div">
    <div class="logo">
        <a href="/">
            <img
                src="@/portals/MousePortal/assets/placeholder_mouselogo.png"
            />
        </a>
    </div>
    <h2>Mouse Portal</h2>
  </div>
</template>
<script>
import Vue from "vue";

export default Vue.component("MouseHeader", {
    components: {},
    props: {},
    data() { 
        return {} 
    },
    computed: {},
    created() {},
    methods: {},
});
</script>
<style>
  .mouse-header-div {
    background-color: #007bff;
    color: #fff;
    vertical-align: baseline;
    width: 100%;
    height: 150px;
    display: flex;
  }
  .logo img {
    height: 150px;
    display: inline;
    padding: 10px;
  }
  .h2 {
    display: inline;
  }
</style>