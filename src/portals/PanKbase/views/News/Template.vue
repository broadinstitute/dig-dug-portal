<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div class="f-row spread-out" style="align-items: baseline; margin: 0 0 20px">
            <h2>News</h2> 
            <a v-if="$parent.newsItem" href="/news.html">All News</a>
        </div>

        <div class="news-items" v-if="$parent.newsFeed">
            <div class="news-item f-row" v-for="item in $parent.newsFeed">
                <div class="news-thumbnail contain" v-html="item.field_thumbnail_image"></div>
                <div class="f-col">
                    <a :href="`${$parent.newsItemUrl}${item.nid}`"><div class="">{{item.title}}</div></a>
                    <div class="" v-html="item.body"></div>
                </div>
            </div>
        </div>

        <div class="" v-if="$parent.newsItem">
            <h4>{{$parent.newsItem[0].title}}</h4>
            <div class="" v-html="$parent.newsItem[0].body"></div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
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