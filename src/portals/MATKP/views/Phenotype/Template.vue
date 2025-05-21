<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav :showSearch="false" />

        <!-- Body -->
        <div class="mat-body f-col" style="width: -webkit-fill-available">

            <matkp-search style="width: 33.33%; align-self: flex-end; margin:-20px 0 20px;"/>

            <h4>Phenotype Page Coming Soon</h4>

        </div>

        <!-- FOOTER -->
          <matkp-footer></matkp-footer>
      </div>
  </div>
</template>

<style scoped>
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}

/* basic positioning */
.legend {
    list-style: none;
}
.legend li {
    float: left;
    margin-right: 10px;
}
.legend span {
    border: 0px;
    float: left;
    width: 12px;
    height: 12px;
    margin: 2px;
}
/* your colors */
.legend .superawesome {
    background-color: #e7edf7;
}
.legend .awesome {
    background-color: #fef8dc;
}

.invalid-gene-warning {
    position: fixed;
    z-index: 20000;
    background-color: #ffcccc;
    width: 500px;
    padding: 15px 25px;
    border: solid 1px #cccccc;
    border-radius: 5px;
    left: calc(50% - 275px);
    top: calc(20% - 50px);
    text-align: center;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
    font-size: 20px;
}

.invalid-gene-hide-warning {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 15px;
    height: 15px;
    border-radius: 15px;
    font-size: 10px;
    background-color: #666666;
    color: #ffffff !important;
}

.invalid-gene-hide-warning:hover {
    cursor: pointer;
}

#invalidGeneRedirect {
    color: #ffffff !important;
    margin-top: 15px;
}

.gene-search-tip {
    position: absolute;
    font-weight: 300;
    font-size: 14px;
    top: 10px;
    left: 20px;
    color: #28a745;
}

.pseudoFilter {
    font-weight: bold !important;
}

.pseudoFilter a {
    color: inherit !important;
    text-decoration: inherit !important;
}
</style>
