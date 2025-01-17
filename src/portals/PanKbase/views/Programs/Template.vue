<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">Related Programs</h2>
        <div v-html="$parent.about" class="page-info"></div>
        <div class="row">
          <div v-for="program in $parent.programs" class="program col-md-6">
            <img :src="program.bgImage"/>
            <h4 v-if="!program.comingSoon">
              <a :href="program.linkUrl">{{ program.title }}</a>
            </h4>
            <h4 v-else>{{ program.title }}
              <span class="coming-soon">(Coming Soon)</span></h4>
            
            <p>{{ program.body }}</p>

          </div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style>
  .program {
    padding: 25px;
  }
  .program img {
    margin-bottom: 10px;
    width: 350px;
    height: auto;
  }
  .coming-soon {
    font-size: smaller;
  }
</style>