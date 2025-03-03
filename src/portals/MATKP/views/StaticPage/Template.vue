<template>
  <div class="matkp">
      <div class="f-col fill-height">
          <!-- NAV -->
          <matkp-nav></matkp-nav>
          <!-- BODY -->
          <div
              class="mat-body f-col matkp-static-content"
              style="width: -webkit-fill-available"
          >
              <template>
              <!-- CONTENT -->
               <h2 class="matkp-static-content-title">{{ $parent.pageContent.title }}</h2>
               <div v-html="$parent.pageContent.body"></div>
              </template>
          </div>
          <!-- FOOTER -->
          <matkp-footer></matkp-footer>
      </div>
  </div>
</template>

<style scoped>
.matkp-static-content-title {
    margin-bottom: 30px;
}

.matkp-static-content {
    max-width: 1000px; 
    margin: 0 auto; 
}
</style>