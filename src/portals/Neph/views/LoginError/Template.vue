<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <!-- Body -->
              <div class="container-fluid mdkp-body">

                <p>You do not have permission to access this url. Please click here to request.</p>
              
              </div> 
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>