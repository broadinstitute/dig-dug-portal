<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav glass></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <template>
                    <!-- HERO -->
                    <matkp-hero></matkp-hero>
                    <!-- CONTENT -->
                    <div class="content-wrap">
                        <div class="f-row align-h-center" style="gap:50px; margin:40px 0 0 0">
                            <div class="f-col" style="width:400px;font-size:14px;gap:20px;">
                                <div style="font-size: 18px;line-height: 40px;font-weight: bold;">Why study adipose tissue?</div>
                                <div>
                                    Once thought to be an inert, cellularly bland storage reservoir for energy 
                                    in the form of triacylglycerol, adipose tissue (AT) is now recognized to be 
                                    a multifocal, complex, heterogenous, and dynamic organ that controls 
                                    metabolic homeostasis via both endocrine and paracrine mechanisms. Unlike 
                                    most organs, AT is <span class="highlight-text">multifocal</span>, found 
                                    both in discrete depots as well as scattered throughout other organs and 
                                    tissues. AT is <span class="highlight-text">complex</span> because it 
                                    contains a multitude of cell types and subtypes, including adipocytes, 
                                    \fibroblastic stromal cells (many of which represent adipocyte progenitor 
                                    cells), immune cells, Schwann cells, and vascular cells. AT is 
                                    <span class="highlight-text">heterogeneous</span> because its cellular 
                                    composition (and therefore its function) varies significantly between, 
                                    and also within depots. AT is <span class="highlight-text">dynamic</span> 
                                    because its composition changes during development or after changes in 
                                    nutrition, physical activity, or ambient temperature. 
                                </div>
                                <div>
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
                            <!--ANATOMOGRAM-->
                            <matkp-anatomogram></matkp-anatomogram>
                        </div>

                        <div class="f-row">
                            <!-- coming soon -->
                        </div>

                        <div class="f-row">
                            <div class="f-col">
                                <!--collaborate-->
                            </div>
                            <div class="f-row">
                                <!--news-->
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>

<style scoped>
.logline {
    font-size: 20px;
    line-height: 26px;
    font-weight: bold;
    text-align: center;
    width: 650px;
    margin: 10px auto 40px;
}
.content-wrap{
    padding: 20px 20px 100px 20px;
    line-height: normal;
}
.highlight-text{
    background: gold;
    padding: 0 3px;
    margin: 0 -3px;
}
</style>