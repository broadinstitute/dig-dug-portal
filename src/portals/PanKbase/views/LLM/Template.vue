<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div v-html="$parent.about"></div>
        <div style="max-width: 800px; margin: 0 auto">
          <h4>PanKbase Data Library Search</h4>
          <div style="display:flex; gap:10px;">
            <input type="text" v-model="$parent.userQuery" @keyup.enter="$parent.runQuery()" style="flex:1;" />
            <button @click="$parent.runQuery()" style="width:100px; padding:5px 10px">
              <span v-if="$parent.llmQueryLoading" class="loader"></span>
              <span v-else>Ask</span>
            </button>
          </div>
          <div v-if="!$parent.queryResponse && !$parent.llmQueryLoading" style="padding: 20px">
            Examples:
            <div style="display:flex; flex-direction: column; gap:5px">
              <div class="query-example" v-for="query in $parent.queryExamples" @click="$parent.runQuery(query)">{{ query }}</div>
            </div>
          </div>
          <div v-if="$parent.queryResponse" style="display:flex; flex-direction: column; gap:10px; padding: 20px;">
            <div style="display:none">{{ $parent.queryResponse.note }}</div>
            <div v-if="$parent.queryResponse.query">
              <a :href="`${$parent.baseQueryURL}${$parent.queryResponse.query}`" target="_blank">
                See Results
              </a>
              <div style="font-size: 0.8em;">{{ `${$parent.baseQueryURL}${$parent.queryResponse.query}` }}</div>
            </div>
            <div v-if="$parent.queryResponse.answer">
              {{ $parent.queryResponse.answer }}
            </div>
          </div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
.loader {
    width: 15px;
    height: 15px;
    border: 2px solid #000;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
}
@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
} 
.query-example{
  background:#eee;
  padding: 3px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.query-example:hover{
  background: #ddd;
}
</style>