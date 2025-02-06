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
               This is Only a Test. {{ JSON.stringify($parent.pageContent) }}
              </template>
          </div>
          <!-- FOOTER -->
          <matkp-footer></matkp-footer>
      </div>
  </div>
</template>