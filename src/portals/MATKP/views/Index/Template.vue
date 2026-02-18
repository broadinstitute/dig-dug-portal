<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav glass :showSearch="false"/>
            <!-- HERO BG -->
            <matkp-hero />
            <!-- BODY -->
            <div class="mat-body f-col align-h-center" style="max-width: 1400px; margin: 0 auto">
                
                <div class="f-col" style="gap:30px; width:100%">
                    <div class="f-row align-v-bottom" style="padding: 50px 0 10px; background:none; gap:50px">
                        <div class="hero-label f-row align-v-center align-h-center no-events">
                            <div class="logo f-row align-v-center">
                                <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkplll.png"/>
                                <div style="font-size: 30px;line-height: 30px;font-weight: bold;">
                                    Mammalian<br />
                                    Adipose<br />
                                    Tissue<br />
                                    <span style="font-size: 20px;display: block;font-weight: normal; white-space: nowrap;">
                                        Knowledge Portal
                                    </span>
                                </div>
                            </div>
                            <div class="f-col" style="gap:10px">
                                <div class="tagline">
                                    An open community portal for adipose biology across multiple mammalian species
                                </div>
                                <div class="f-col align-v-center yes-events" style="z-index: 1; gap: 20px; height:100%">
                                    <matkp-search/>
                                </div>
                                <div>
                                    Search a gene for a summary of adipose knowledge from our portal.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="f-row cards" style="gap:20px">
                    <a class="f-col white-blur-bg yes-events" style="gap:5px; flex:1" href="/cellbrowser.html">
                        <div style="width:100%; height:125px; padding:20px;"><img class="fit-img" src="https://hugeampkpncms.org/sites/default/files/images/matkp/matkp_sc.png"/></div>
                        <div style="font-size:16px; font-weight:bold">Single Cell Browser</div>
                        <div>Explore single-cell RNA-seq datasets from adipose tissue to examine cell types, gene expression, and marker genes.</div>
                    </a>
                    <a class="f-col white-blur-bg yes-events" style="gap:5px; flex:1" href="/bulkbrowser.html">
                        <div style="width:100%; height:125px; padding:20px;"><img class="fit-img" src="https://hugeampkpncms.org/sites/default/files/images/matkp/matkp_de.png"/></div>
                        <div style="font-size:16px; font-weight:bold">Expression Browser</div>
                        <div>Compare gene expression in adipose tissue using bulk RNA-seq to identify differentially expressed genes and enriched pathways.</div>
                    </a>
                    <a class="f-col white-blur-bg yes-events" style="gap:5px; flex:1" href="/phenotype.html">
                        <div style="width:100%; height:125px; padding:20px;"><img class="fit-img" src="https://hugeampkpncms.org/sites/default/files/images/matkp/matkp_p.png"/></div>
                        <div style="font-size:16px; font-weight:bold">Phenotype Browser</div>
                        <div>Browse adipose tissue–related phenotypes to examine genetic associations, implicated genes, and enriched pathways.</div>
                    </a>
                    <a class="f-col white-blur-bg yes-events" style="gap:5px; flex:1" href="/tissue.html">
                        <div style="width:100%; height:125px; padding:20px;"><img class="fit-img" src="https://hugeampkpncms.org/sites/default/files/images/matkp/matkp_fa.png"/></div>
                        <div style="font-size:16px; font-weight:bold">Functional Annotations</div>
                        <div>Functional gene and regulatory annotations in adipose tissue; integrating gene expression, GWAS signals, and epigenomic data.</div>
                    </a>
                    <a class="f-col white-blur-bg yes-events" style="gap:5px; flex:1" href="/adipogenesis.html">
                        <div style="width:100%; height:125px; padding:20px;"><img class="fit-img" src="https://hugeampkpncms.org/sites/default/files/images/matkp/matkp_a.png"/></div>
                        <div style="font-size:16px; font-weight:bold">Adipogenesis</div>
                        <div>Investigate gene expression programs underlying adipogenesis using interactive time-course datasets.</div>
                    </a>
                </div>

                <div class="f-row align-v-center" style="gap:20px; min-width: 1160px;">
                    <div class="f-row fill-width" style="gap:20px; padding:40px; background:#ffffffcc;">
                        <div class="f-col" style="gap:5px; width: 225px;">
                            <div style="font-size:16px; font-weight:bold">Browse Data</div>
                            <div style="flex:1">Browse and filter curated adipose tissue datasets across species, depots, assays, and experimental methods. Access detailed metadata and explore datasets available throughout the portal.</div>
                            <a class="yes-events" href="/datasets.html">Browse All</a>
                        </div>
                        <div class="f-row fill-width" style="gap:10px; padding: 25px 0 0">
                            <div id="data-viz-labels">
                                <div>Datasets</div>
                                <div>Species</div>
                                <div>Data Type</div>
                            </div>
                            <div class="f-col fill-width" style="gap:10px">
                                <div id="data-viz" class="yes-events" style="flex:1"></div>
                                <div class="f-row" style="gap:10px">
                                    <div v-for="item in $parent.secondaryLegend" class="f-row" style="gap:5px;">
                                        <div
                                            style="width:20px; height:20px;"
                                            :style="{ background: item.color }"
                                        ></div>
                                        <div>{{ item.label }}</div>
                                    </div>
                                </div>
                                <!--
                                <div><em>Click a segment of the chart to go to the data page and see that subset of datasets.</em></div>
                                -->
                            </div>
                        </div>
                    </div>
                    <div class="f-col" style="gap:5px; padding:40px; width:250px; background: #ffffffcc; height: -webkit-fill-available;">
                        <div style="font-size:16px; font-weight:bold">Contribute Data</div>
                        <div style="flex:1">Upload your data through our Data Registry.</div>
                        <a class="yes-events" target="_blank" href="https://uploads.matkp.org">Try it here</a>
                    </div>
                </div>
                
                <!--
                <div class="f-row align-v-center grow-children" style="gap:20px; width: min-content; min-width: 1160px">
                    <div v-if="$parent.newsFeed && $parent.newsFeed.length>0" style="padding:20px; background: #ffffff70; backdrop-filter: blur(5px); height: -webkit-fill-available;">
                        <div style="font-size:16px; font-weight:bold">Latest News</div>
                        <div class="news-items">
                            <div class="news-item f-row">
                                <div class="news-thumbnail contain" style="height:70px; min-width:100px"
                                    v-html="$parent.newsFeed[0].field_thumbnail_image"
                                ></div>
                                <div class="f-col align-v-bottom">
                                    <div class="bold">{{ $parent.newsFeed[0].title }}</div>
                                    <div class="" v-html="$parent.newsFeed[0].body"></div>
                                    <a class="yes-events" :href="`${$parent.content.news.newsItemUrl}${$parent.newsFeed[0].nid}`">
                                        Read more
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                -->
                

                <!-- CONTENT -->
                <div class="section f-row" style="gap:50px; margin-top:-20px">
                    <div class="f-col" style="gap:20px">
                        <div class="section-title">Where is adipose tissue found?</div>
                        <div>
                            Adipose tissue (AT) is found throughout the body in aggregates referred to as depots. 
                            Broadly speaking, AT can be divided into subcutaneous depots (found under the skin) and 
                            visceral depots (found in the peritoneal and thoracic cavities). There are, however, 
                            other depots that are not clearly categorized as subcutaneous or visceral, such as 
                            around blood vessels (perivascular), within joints (intra-articular), and in bone marrow.
                            <a href="/info.html?page=adipose">Learn more.</a>
                        </div>
                        <em>
                            Select a species to the right, then mouse over the depots lists for more information. 
                        </em>
                        <em>Click on depots to see (N) associated datasets.
                        </em>
                    </div>
                    <!--ANATOMOGRAM-->
                    <matkp-anatomogram v-if="$parent.datasets" :data="$parent.datasets"></matkp-anatomogram>
                </div>

                <!--
                <div class="section f-col">
                    <div class="f-col" style="font-size:14px;gap:20px;">
                        <div class="section-title">Why study adipose tissue?</div>
                        <div style="column-count:3; column-gap: 20px;">
                            Once thought to be an inert, cellularly bland storage reservoir for energy 
                            in the form of triacylglycerol, adipose tissue (AT) is now recognized to be 
                            a multifocal, complex, heterogenous, and dynamic organ that controls 
                            metabolic homeostasis via both endocrine and paracrine mechanisms. Unlike 
                            most organs, AT is <span class="bold">multifocal</span>, found 
                            both in discrete depots as well as scattered throughout other organs and 
                            tissues. AT is <span class="bold">complex</span> because it 
                            contains a multitude of cell types and subtypes, including adipocytes, 
                            fibroblastic stromal cells (many of which represent adipocyte progenitor 
                            cells), immune cells, Schwann cells, and vascular cells. AT is 
                            <span class="bold">heterogeneous</span> because its cellular 
                            composition (and therefore its function) varies significantly between, 
                            and also within depots. AT is <span class="bold">dynamic</span> 
                            because its composition changes during development or after changes in 
                            nutrition, physical activity, or ambient temperature.
                            <br/><br/>
                            Dysfunctional AT is associated with a variety of cardiometabolic diseases. 
                            An obvious example is obesity, a condition in which excess adiposity 
                            significantly increases the risk of type 2 diabetes (T2D), metabolic 
                            dysfunction-associated steatotic liver disease (MASLD), and cardiovascular 
                            disease. But AT is not only associated with disease when in excess; lack 
                            of AT, either generally or limited to specific regions, also confers risk 
                            for severe T2D, MASLD, and atherosclerosis. Individuals with either 
                            inherited or acquired forms of lipodystrophy store excess lipid in 
                            non-adipose organs such as liver, muscle, and pancreatic islets, 
                            contributing to insulin resistance and reduced insulin secretion.
                        </div>
                    </div>
                </div>
                -->

                <!-- -->
                <div class="section f-row" style="gap:50px">
                    <div class="f-col" style="width:270px; gap:20px">
                        <div class="f-col" style="gap: 10px">
                            <div class="section-title">Collaborate</div>
                            <div v-html="$parent.content.collaborate"></div>
                        </div>
    
                        <div class="f-col" style="gap: 10px">
                            <div class="section-title">Related Resources</div>
                            <div>MATKP and ATKP provide complementary views on adipose tissue biology.<br/><a target="_blank" href="https://hugeamp.org/r/eat_bio">Learn More</a></br></div>
                        </div>
                    </div>

                    <div class="f-col" style="flex: 1; gap: 10px">
                        <div class="section-title">News</div>
                        <div class="news-items" v-if="$parent.newsFeed">
                            <div
                                class="news-item f-row"
                                v-for="item in $parent.newsFeed"
                            >
                                <div
                                    class="news-thumbnail contain"
                                    v-html="item.field_thumbnail_image"
                                ></div>
                                <div class="f-col">
                                    <a
                                        :href="`${$parent.content.news.newsItemUrl}${item.nid}`"
                                        ><div class="">{{ item.title }}</div></a
                                    >
                                    <div class="" v-html="item.body"></div>
                                </div>
                            </div>
                            <a
                                style="align-self: flex-end"
                                :href="`${$parent.content.news.newsUrl}`"
                                >See All News</a
                            >
                        </div>
                    </div>
                </div>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>

<style scoped>
.mat-body{
    pointer-events: none;
    gap:40px;
    min-width: 1200px;
}
.section {
    pointer-events: all;
    background: #ffffffcc;
    padding: 40px;
    width:1160px;
    max-width: 1400px;
}
.highlight-text{
    background: gold;
    padding: 0 3px;
    margin: 0 -3px;
}
.section-title{
    font-size: 18px;
    font-weight: bold;
}
.hero-label {
    z-index: 1;
    background: #ffffff50;
    backdrop-filter: blur(5px);
    padding: 80px;
    width: 100%;
    gap:100px;
    box-shadow: 0 0 10px 0 #42424220;
    
}
.logo {
    color: #424242;
    gap: 20px;
}
.logo img {
    height: 170px;
}
.tagline {
    z-index: 1;
    width: 400px;
    line-height: normal;
    font-size: 18px;
    font-weight: bold;
    color: #424242;
}
.button-lock-right {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 1;
    border-radius: 0;
}

.news-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.news-item {
    gap: 10px;
}
.news-thumbnail {
    min-width: 200px;
    height: 100px;
    background: #fbfbfb;
    border: 1px solid #eee;
}
.news-thumbnail img {
    mix-blend-mode: darken;
}

.matkp .cards a{
    color: black !important;
    font-weight: normal;
    transition: 0.2s all;
}
.matkp .cards a:hover{
    text-decoration: none;
    background: rgba(255, 255, 255, 0.8);
}

.white-blur-bg{
    background: #ffffff70; 
    backdrop-filter: blur(5px);
    padding:20px;
}
.fit-img{
    width: 100%;
    height: 100%;
    object-fit: contain;
}

#data-viz-labels div{
    display:flex;
    height:28px;
    align-items: center;
    font-weight: bold;
}

::v-deep .contain img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 7%;
}

::v-deep .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

::v-deep p {
    margin:0;
}
</style>