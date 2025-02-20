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
              <bulk-browser-comp 
                  sectionId="matkp"
                  :renderConfig="$parent.scbConfig"
                  :utils="$parent.utils"
                  :data="$parent.data"
              ></bulk-browser-comp>
              </template>
          </div>
          <!-- FOOTER -->
          <matkp-footer></matkp-footer>
      </div>
  </div>
</template>