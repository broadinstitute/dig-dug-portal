<template>
  <div>
      <h5>Meta-analysis types</h5>
      <table class="meta-graph"
        :style="{'width': `${chartWidth}px`}">
        <colgroup>
          <col class="header-col" />
          <col class="bottom-line-col"
            :style="{'width': barWidth(this.bottomLineOnly)}" />
          <col class="bottom-line-min-p-col" 
            :style="{'width': barWidth(this.bottomLineMinP)}" />
          <col class="all-metas-col"
            :style="{'width': barWidth(this.allMetas)}" />
        </colgroup>
        <tr class="bottom-line">
          <th scope="row">bottom-line</th>
          <td colspan="3" class="filled">
            {{ this.bottomLineOnly + this.bottomLineMinP + this.allMetas }}
          </td>
        </tr>
        <tr class="min-p">
          <th scope="row">min_p</th>
          <td></td>
          <td colspan="2"class="filled">
            {{ this.bottomLineMinP + this.allMetas }}
          </td>
        </tr>
        <tr class="largest">
          <th scope="row">largest</th>
          <td></td>
          <td></td>
          <td class="filled">
            {{ this.allMetas }}
          </td>
        </tr>
        <tr class="empty-bar">
          <th scope="row"></th>
          <td class="summary1"></td>
          <td class="summary2"></td>
          <td class="summary3"></td>
        </tr>
        <tr class="summary">
          <th scope="row"></th>
          <td>
            <span class="summary1">
              {{ this.bottomLineOnly }}
            </span>
          </td>
          <td>
            <span class="summary2">
              {{ this.bottomLineMinP }}
            </span>
          </td>
          <td>
            <span class="summary3">
              {{ this.allMetas }}
            </span>
          </td>
        </tr>
      </table>
  </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("meta-analysis-bar-graph", {
  props: ["graphData", "filter"],
  data() {
      return {
        width: 400,
        chartWidth: 600,
        bottomLineOnly: 0,
        bottomLineMinP: 0,
        allMetas: 0
      };
  },
  methods: {
    collateData(data){
      let summary = {
        "bottom-line": 0,
        "bottom-line;min_p": 0,
        "bottom-line;min_p;largest": 0
      };
      for (let i = 0; i < data.length; i++){
        let metaTypes = data[i]["inMetaTypes"];
        if(summary[metaTypes] === undefined){
          console.error(`Type entry ${metaTypes} unrecognized.`);
        }
        summary[metaTypes] += 1;
      }
      console.log(JSON.stringify(summary));
      this.bottomLineOnly = summary["bottom-line"];
      this.bottomLineMinP = summary["bottom-line;min_p"];
      this.allMetas = summary["bottom-line;min_p;largest"];
      return summary;
    },
    barWidth(barSize){
      let total = this.bottomLineOnly + this.bottomLineMinP + this.allMetas;
      let relativeWidth = barSize / total * this.width;
      return `${relativeWidth}px`;
    }
  },
  watch: {
    graphData(newData){
      this.collateData(newData);
    }
  }
});
</script>
<style scoped>
  .meta-graph th {
    text-align: right;
    padding-right: 5px;
  }
  .meta-graph td {
    text-align: center;
    border-left: 1px solid black;
    border-right: 1px solid black;
  }
  .meta-graph .bottom-line td.filled {
    background-color: #6dcff6;
  }
  .meta-graph .min-p td.filled {
    background-color: #f49ac1;
  }
  .meta-graph .largest td.filled {
    background-color: #fff200;
  }
  .empty-bar {
    height: 10px;
  }
  .summary1 {
    background-color: #6dcff6;
  }
  .summary2 {
    background-color: #8781bd;
  }
  .summary3 {
    background-color: #b6aaa7;
  }
  .summary td span {
    border-radius: 10px;
  }
</style>