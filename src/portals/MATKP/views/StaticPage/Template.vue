<template>
  <div class="matkp">
      <div class="f-col fill-height">
          <!-- NAV -->
          <matkp-nav></matkp-nav>
          <!-- BODY -->
          <div
              class="mat-body f-col"
              style="max-width: 1400px; margin: 0 auto; width: -webkit-fill-available"
          >
              <template>
              <!-- CONTENT -->
               <h2>{{ $parent.pageContent.title }}</h2>
               <div v-html="$parent.pageContent.body"></div>
              </template>
          </div>
          <!-- FOOTER -->
          <matkp-footer></matkp-footer>
      </div>
  </div>
</template>