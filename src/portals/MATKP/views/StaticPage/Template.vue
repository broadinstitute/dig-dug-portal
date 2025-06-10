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
            <div v-if="$parent.pageContent">
                <!-- CONTENT -->
                  <template v-if="$parent.pageType==='content'">
                    <h2 class="matkp-static-content-title">{{ $parent.pageContent.title }}</h2>
                    <div v-html="$parent.pageContent.body"></div>
                  </template>
    
    
                  <template v-if="$parent.pageType==='list'">
                    <div class="f-row spread-out" style="align-items: baseline; margin: 0 0 20px">
                        <h2 class="page-title">News</h2> 
                        <a v-if="$parent.pageContent.length<2" href="/info.html?page=news">All News</a>
                    </div>
    
                    <div class="news-items" v-if="$parent.pageContent.length>1">
                        <div class="news-item f-row" v-for="item in $parent.pageContent">
                            <div class="news-thumbnail contain" v-html="item.field_thumbnail_image"></div>
                            <div class="f-col">
                                <a :href="`/info.html?page=news&id=${item.nid}`"><div class="">{{item.title}}</div></a>
                                <div class="" v-html="item.body"></div>
                            </div>
                        </div>
                    </div>
                    <div v-else>
                        <h4>{{$parent.pageContent[0].title}}</h4>
                        <div class="" v-html="$parent.pageContent[0].body"></div>
                    </div>
                  </template>
            </div>
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

.news-items{
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.news-item {
    gap: 10px;
}
.news-thumbnail {
    min-width: 200px;
    width: 200px;
    height: 100px;
    background: #fbfbfb;
    border: 1px solid #eee;
}
.news-thumbnail img {
    mix-blend-mode: darken;
}
::v-deep .contain img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
</style>