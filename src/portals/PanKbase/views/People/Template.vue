<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
          <div v-for="person in $parent.peopleList">
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