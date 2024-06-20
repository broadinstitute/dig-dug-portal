<template>
  <div>
      <h5>Meta-analysis types</h5>
      <table class="meta-graph">
        <tr class="bottom-line">
          <th scope="row">bottom-line</th>
          <td class="filled"></td>
          <td class="filled"></td>
          <td class="filled">{{ this.bottomLineOnly + this.bottomLineMinP + this.allMetas }}</td>
        </tr>
        <tr class="min-p">
          <th scope="row">min_p</th>
          <td></td>
          <td class=filled></td>
          <td class=filled>{{ this.bottomLineMinP + this.allMetas }}</td>
        </tr>
        <tr class="largest">
          <th scope="row">largest</th>
          <td></td>
          <td></td>
          <td class="filled">{{ this.allMetas }}</td>
        </tr>
        <tr class="thin-bar">
          <th scope="row"></th>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr class="summary">
          <th scope="row"></th>
          <td>{{ this.bottomLineOnly }}</td>
          <td>{{ this.bottomLineMinP }}</td>
          <td>{{ this.allMetas }}</td>
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
  .meta-graph {
    width: 400px;
  }
  .meta-graph td {
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
</style>