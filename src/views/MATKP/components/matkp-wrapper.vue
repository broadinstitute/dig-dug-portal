<template>
    <div>
        <slot></slot>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("matkp-wrapper", {});
</script>

<style>
body, 
body.kp-default{
    margin: 0;
    padding: 0;
    height: 100vh;
}
</style>
<style scoped>
::v-deep .hidden{
    display: none !important;
}
::v-deep .bold{
    font-weight: bold;
}
::v-deep .underline{
    border-bottom: 1px solid dimgray;
    width: fit-content;
    padding: 5px 0;
}

::v-deep .mat-header, .mat-footer{
    flex: 0 0 auto;
    background: #424242;
    color: white;
    padding: 20px;
}
::v-deep .mat-body{
    flex-grow: 1;
    /*background: #fff7d0;*/
}
::v-deep .table-wrap {
    width: -webkit-fill-available;
    overflow-x: auto;
}
::v-deep label{
    margin:0;
}

::v-deep select, 
::v-deep input:not([type="checkbox"]),
::v-deep .matkp-input{
    position:relative;
    width: 100%;
    height: 40px;
    border: 0;
    border-bottom: 1px solid dimgray;
    background: #dddddd;
    padding: 10px;
    font-size: 14px;
}
::v-deep .search-input:not([value=''])::after{
    content:'x';
    font-size: 22px;
    height: inherit;
    aspect-ratio: 1;
    position: absolute;
    top: 0;
    right: 0;
}
::v-deep .matkp-input{
    cursor:pointer;
}
::v-deep a.matkp-input,
::v-deep a.matkp-input:hover{
    text-decoration: none;
    color:black !important;
    text-align: center;
}
::v-deep .input-options {
    position: absolute;
    top: 0;
    left: 100%;
    background: white;
    color: black;
    padding: 10px;
    min-width: 100%;
    width: auto;
    box-shadow: 2px 2px 5px 0 #00000038;
    z-index:10;
    max-height: 300px;
    overflow-y: auto;
}
::v-deep .input-overlay {
    background: none;
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    z-index: 9;
}
::v-deep .input-list:not(:empty) {
    display: flex;
    background: #ccc;
    padding: 10px;
    gap: 5px;
    flex-wrap: wrap;
    border-radius: 0 0 5px 5px;
}
::v-deep .input-list-item {
    background: white;
    padding: 2px 5px;
    font-size: 12px;
    border-radius: 5px;
    cursor: pointer;
    position: relative;
}
::v-deep .input-list-item:hover:after {
    content: '✖';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    color: red;
}
::v-deep .multiselect-toggle{
    font-weight: bold;
    cursor: pointer;
}

/* LAYOUT STYLES */
::v-deep .no-events{
    pointer-events: none;
}
::v-deep .f-col{
    display: flex;
    flex-direction: column;
}
::v-deep .f-row{
    display: flex;
    flex-direction: row;
}
::v-deep .f-col.align-v-center{
    justify-content: center;
}
::v-deep .f-row.align-v-center{
    align-items: center;
}
::v-deep .f-col.align-h-center{
    align-items: center;
}
::v-deep .f-row.align-h-center{
    justify-content: center;
}
::v-deep .f-col.spread-out,
::v-deep .f-row.spread-out{
    justify-content: space-between;
}
::v-deep .fill-height{
    height: -moz-available;
    height: -webkit-fill-avaiilable;
    height: fill-available;
    height: 100%;
}
::v-deep .fill-width{
    width: -moz-available;
    width: -webkit-fill-avaiilable;
    width: fill-available;
    width: 100%;
}
::v-deep .hug-height{
    height: fit-content;
}
::v-deep .hug-width{
    width: fit-content
}
::v-deep .grow-children>*{
    flex-grow: 1;
}
</style>