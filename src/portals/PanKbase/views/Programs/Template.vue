<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div v-html="$parent.programInfo"></div>
        <div class="row">
          <div v-for="program in $parent.allPrograms" class="program col-md-6">
            <img :src="program.bgImage" height="300px"/>
            <h4>
              <a :href="program.linkUrl">{{ program.title }}</a>
            </h4>
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
  }
</style>