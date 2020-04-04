<template>
    <div id="igv-div"></div>
</template>
<script>
import Vue from "vue";
import igv from "igv";

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"

export default Vue.component("igv", {
    mounted() {
        var igvDiv = document.getElementById("igv-div");
        var optionsRemote =
            {
                genome: "hg38",
                locus: "chr8:127,736,588-127,739,371",
                tracks: [
                    {
                        "name": "HG00103",
                        "url": "https://s3.amazonaws.com/1000genomes/data/HG00103/alignment/HG00103.alt_bwamem_GRCh38DH.20150718.GBR.low_coverage.cram",
                        "indexURL": "https://s3.amazonaws.com/1000genomes/data/HG00103/alignment/HG00103.alt_bwamem_GRCh38DH.20150718.GBR.low_coverage.cram.crai",
                        "format": "cram"
                    }
                ]
            };

    var optionsLocal =
        {
            genome: "hg19",
            locus: 'chr1:629,422-16,522,294',
            tracks: [
                        {
                            name: "Copy number",
                            type: "seg",
                            displayMode: "EXPANDED",
                            features: [
                                {
                                    chr: "1",
                                    start: 3218610,
                                    end: 4749076,
                                    value: -0.2239,
                                    sample: "TCGA-OR-A5J2-01"
                                },
                                {
                                    chr: "1",
                                    start: 4750119,
                                    end: 11347492,
                                    value: -0.8391,
                                    sample: "TCGA-OR-A5J2-01"
                                }
                            ]
                        },
                        {
                            name: "Associations",
                            type: "annotation",
                            sourceType: "custom",
                            source: {
                                url: `${BIO_INDEX_HOST}/api/bio/query/top-associations?q=$CHR:$START-$END`,
                                method: "GET",
                                contentType: "application/json",
                                parser: (json) => {
                                    if (typeof json.data != 'undefined') {
                                        return [{
                                            chr: "1",
                                            start: 3218610,
                                            end: 4749076,
                                            score: -0.2239,
                                        }]
                                    }
                                    return []; 
                                },
                            },
                       }
                    ]
        };


        igv.createBrowser(igvDiv, optionsLocal)
                .then(function (browser) {
                    console.log("Created IGV browser");
                })
    }
})

// igv.browser.loadTrack({
//     url: 'https://data.broadinstitute.org/igvdata/test/igv-web/segmented_data_080520.seg.gz',
//     indexed: false,
//     isLog: true,
//     name: 'GBM Copy # (TCGA Broad GDAC)'});
// igv.browser.loadTrack({
//     type: 'annotation',
//     format: 'bed',
//     url: 'https://data.broadinstitute.org/igvdata/annotations/hg19/dbSnp/snp137.hg19.bed.gz',
//     indexURL: 'https://data.broadinstitute.org/igvdata/annotations/hg19/dbSnp/snp137.hg19.bed.gz.tbi',
//     visibilityWindow: 200000,
//     name: 'dbSNP 137'});
// igv.browser.loadTrack({
//         type: 'wig',
//         format: 'bigwig',
//         url: 'https://s3.amazonaws.com/igv.broadinstitute.org/data/hg19/encode/wgEncodeBroadHistoneGm12878H3k4me3StdSig.bigWig',
//         name: 'Gm12878H3k4me3'
//     })
// igv.browser.loadTrack({
//     name: 'Sample BAM',
//     url: 'https://idea-cdn.s3.eu-west-2.amazonaws.com/out.marked.bam',
//     indexURL: 'https://idea-cdn.s3.eu-west-2.amazonaws.com/out.marked.bai',
//     format: 'bam',
//     height: 100,
//     order: 51
// })
// igv.browser.loadTrack({
//         name: 'bedgraph',
//         //url: 'https://dig-humgen.s3.amazonaws.com/v4c.bedGraph',
//         url: '/dig-diabetes-portal/variantInfo/bedGraphFile',
//         type: 'wig',
//         format: 'bedGraph',
//         height: 100,
//         order: 52
//     })
// igv.browser.loadTrack({
//     name: 'Genome wide DIAMANTE GWAS',
//     trait: 'T2D',
//     label: 'T2D DIAMANTE GWAS',
//     maxLogP: 10,
//     height: 200,
//     pvalue: 'score',
//     colorScale:  {
//         thresholds: [5e-8, 5e-4, 0.05],
//         colors: ['rgb(0,102,51)', 'rgb(122,179,23)', 'rgb(158,213,76)', 'rgb(227,238,249)']
//     },
//     type: 'gwas',
//     format: 'bedgwas',
//     url: 'https://dig-humgen.s3.amazonaws.com/diamante.0001.gz',
//     indexURL: 'https://dig-humgen.s3.amazonaws.com/diamante.0001.gz.tbi',
//     //visibilityWindow: -1,
//     wholeGenomeView: true,
//     rememberVariant:  function(parm){alert(parm)},
//     traitURL:'${createLink(controller:"variantInfo", action:"variantInfo")}',
//     color: 'rgb(100,200,200)',
//     displayMode: 'EXPANDED',
//     autoHeight: true,
//     autoscale: true,
//     order: 4
// })
</script>
