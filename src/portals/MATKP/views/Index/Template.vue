<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav glass/>
            <!-- HERO BG -->
            <matkp-hero />
            <!-- BODY -->
            <div class="mat-body f-col align-h-center">
                
                <div class="f-row align-v-bottom" style="padding: 50px 0 10px; background:none">
                    <div class="hero-label f-col align-v-center no-events">
                        <div class="logo f-row align-v-center">
                            <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkplll.png"/>
                            <div style="font-size: 22px;line-height: 22px;font-weight: bold;">
                                Mammalian<br />
                                Adipose<br />
                                Tissue<br />
                                <span style="font-size: 15px;display: block;font-weight: normal;">
                                    Knowledge Portal
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="f-col hero-info no-events" style="z-index: 1; gap: 20px; flex: 1">
                        <div class="tagline">
                            An open community portal for adipose biology across multiple mammalian species
                        </div>
                        <!--
                        <b-input-group size="sm" style="pointer-events: none; opacity: 0.7">
                            <input type="text" placeholder="Search gene, cell type or trait"/>
                            <b-button class="button-lock-right" @click="">
                                Search
                            </b-button>
                        </b-input-group>
                        -->
                        <a class="matkp-input" style="pointer-events: all" href="/datasets.html">
                            Browse all Datasets
                        </a>
                        
                    </div>
                </div>

                <!-- CONTENT -->
                <div class="section f-row" style="gap:50px;">
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
                    <matkp-anatomogram></matkp-anatomogram>
                </div>

                <div class="section f-col">
                    <div class="f-col" style="font-size:14px;gap:20px;">
                        <div class="section-title">Why study adipose tissue?</div>
                        <div style="column-count:3; column-gap: 20px; text-indent: 40px;">
                            Once thought to be an inert, cellularly bland storage reservoir for energy 
                            in the form of triacylglycerol, adipose tissue (AT) is now recognized to be 
                            a multifocal, complex, heterogenous, and dynamic organ that controls 
                            metabolic homeostasis via both endocrine and paracrine mechanisms. Unlike 
                            most organs, AT is <span class="highlight-text">multifocal</span>, found 
                            both in discrete depots as well as scattered throughout other organs and 
                            tissues. AT is <span class="highlight-text">complex</span> because it 
                            contains a multitude of cell types and subtypes, including adipocytes, 
                            fibroblastic stromal cells (many of which represent adipocyte progenitor 
                            cells), immune cells, Schwann cells, and vascular cells. AT is 
                            <span class="highlight-text">heterogeneous</span> because its cellular 
                            composition (and therefore its function) varies significantly between, 
                            and also within depots. AT is <span class="highlight-text">dynamic</span> 
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

                <!-- -->
                <div class="section f-row" style="gap:20px">
                    <div class="f-col" style="flex: 1; gap: 10px">
                        <div class="section-title">Collaborate</div>
                        <div v-html="$parent.content.collaborate"></div>
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
}
.section {
    pointer-events: all;
    background: #f6f6f6;
    padding: 40px;
    width:90vw;
    max-width: 1400px;
    border-radius: 20px;
}
.logline {
    font-size: 20px;
    line-height: 26px;
    font-weight: bold;
    text-align: center;
    width: 650px;
    margin: 10px auto 40px;
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
    padding: 40px;
    aspect-ratio: 1;
    box-shadow: 0 0 10px 0 #42424220;
}
.logo {
    color: #424242;
    gap: 20px;
}
.logo img {
    height: 100px;
}
.hero-info {
    margin: 0 0 0 30px;
    padding: 0 0 0 20px;
}
.tagline {
    z-index: 1;
    width: 500px;
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
</style>