<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body row">
          <div v-for="person in $parent.peopleList" class="person col-md-6">
            <img :src="person['Photo']" height="300px"/>
            <h4>{{ person["Name"] }}</h4>
            <h5>{{ person["Affiliation"] }}</h5>
            <p>{{ person["Role"] }}</p>

          </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style>
  .person {
    margin-bottom: 25px;
  }
</style>