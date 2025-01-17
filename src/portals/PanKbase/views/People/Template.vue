<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">People</h2>
        <div class="row">
            <div v-for="person in $parent.people" class="person col-md-6">
            <img :src="person['Photo']" height="300px"/>
            <h5>{{ person["Name"] }}</h5>
            <h6>{{ person["Affiliation"] }}</h6>
            <p class="bio">{{ person["Role"] }}</p>

          </div>
        </div>
        
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style>
  .person {
    padding: 25px;
  }
  .bio {
    width: 85%;
    text-align: justify;
  }
  h5, h6 {
    font-weight: bolder;
  }
</style>