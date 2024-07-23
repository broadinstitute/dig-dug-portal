<template>
	<div class="container-fluid mdkp-body flex-body front-page">
        <div class="fp-top" 
            :style="{ background: `linear-gradient( ${this.sectionConfigs['content']['color secondary']} 0%, ${this.sectionConfigs['content']['color primary']} 100% )`}">
            <div class="fp-intro-section">
                <div class="fp-intro-logo">
                    <img style="width:400px;" 
                        :src="getLogo(this.sectionConfigs['content']['logo large'])"/>
                </div>
                <div class="fp-intro-divider"></div>
                <div class="fp-intro-blurb">
                    <div class="fp-intro-blurb-text">{{ this.sectionConfigs["content"]["tagline"] }}</div>
                </div>
            </div>
            <div v-if="this.sectionConfigs['content']['search enabled']"
                class="row fp-search-section">
                <div class="fp-search">
                    <research-single-search
                        :single-search-config="sectionConfigs['content']"
                        :phenotypes="phenotypesInUse"
                        :utils="utilsBox"
                    ></research-single-search>                    
                </div>
                <div v-if="!!sectionConfigs['content']['search examples']" class="fp-search-examples">
                    <span v-html="'examples: '"></span>
                    <span v-for="example in sectionConfigs['content']['search examples']" :key="example.value"
                    v-html="getExampleLink(example)">
                    </span>
                </div> 
            </div>
        </div>
        <div class="fp-bottom">
            <div class="fp-bottom-container">
                <research-page-description v-if="this.pageDescription"
                    :content="this.pageDescription"
                    :utils="this.utilsBox"
                ></research-page-description>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";

export default Vue.component("research-front-page", {
	props: ["sectionConfigs","pageDescription", "utilsBox","phenotypeMap","phenotypesInUse"],
    
	components: {},

	data() {
		return {
			researchSearchParam: null,
		};
	}, 
	created() {
    },
    mounted() {
    },
	computed: {},
	watch: {
        researchSearchParam(PARAM) {
            console.log("typing", PARAM)
        }
    },
    methods: {
        getLogo(SRC) {

            let updatedLink = SRC;
            let replaceItems = this.sectionConfigs['content']["replace links"];

            if (!!replaceItems) {
                replaceItems.map(r => {
                    updatedLink = updatedLink.replace("$" + r, this.utilsBox.keyParams[r]);
                })
            }

            return updatedLink
        },
        getExampleLink(EXAMPLE) {
            let exampleLink;
            this.sectionConfigs['content']['search parameters'].map(param =>{
                if(param.parameter == EXAMPLE.parameter) {
                    exampleLink = "<a href='/research.html?pageid="+param["target page"]["page id"]
                        +"&"+ param.parameter+"="+EXAMPLE.value+"'>"+ EXAMPLE.value +"</a>";
                }
            })
            return exampleLink;
        }
    },
});
</script>

<style>
/*
.research-header-menu-wrapper {
    background: none;
}
.research-header-menu-wrapper ul {
    text-align: right;
}
*/
/*
.paper-footer-wrapper {
    background-color: #2e3e6e;
}*/
/*
.fp-container{
    flex: 1 1 auto;
    display:flex;
    flex-direction: column;
}*/
.mdkp-body.front-page {
    padding-top: 0;
    padding-left: 0;
    padding-right: 0;
    }
.fp-top{
    flex: 0 1 auto;
    padding:0 0 20px;
}
.fp-nav-section {
    padding: 5px; 
    display: flex; 
    flex-direction: row; 
    align-items: center; 
    flex-wrap: nowrap; 
    justify-content: space-between
}
.fp-nav-logo{
    width: 200px; 
    height: 50px; 
    display: flex; 
    align-items: center;
    margin: 0 0 0 7px;
}
.fp-intro-section{
    display: flex; 
    width: 100%; 
    min-height:100px; 
    height: fit-content; 
    align-items: center; 
    justify-content: center; 
    margin: 50px 0;
}
.fp-intro-logo{
    min-width: calc(50% - 20.5px); 
    max-height: 200px;
    display:flex; 
    justify-content: flex-end;
}
.fp-intro-logo img{
    width:inherit;
}
.fp-intro-divider{
    width: 1px;
    min-height: 100%;
    background: white;
    margin: 0 20px;
}
.fp-intro-blurb{
    min-width: calc(50% - 20.5px);
}
.fp-intro-blurb-text{
    width:350px; 
    color:white; 
    font-size: 22px; 
    line-height: 24px;
}
.fp-search-section{
    display:flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
}
.fp-search{
    width: 50%;
    margin: 10px 0;
}
.fp-search-examples,
.fp-search-examples a {
    color: white !important;
    font-size: 1.15em;
}

.fp-search-examples span {
    margin-left: 3px;
    margin-right: 3px;
}


.fp-bottom{
    flex: 1 1 auto;
    background:white; 
    padding:50px 50px;
    display: flex; 
    flex-direction: row; 
    justify-content: space-between;
}
.fp-bottom-container{
    max-width: 980px;
    margin: 0 auto;
}
.fp-bottom:has(.fp-bottom-container:empty) {
    padding: 0;
    display:none;
}
.fp-col{
    max-width:50%; 
    width:50%
}
.fp-title{
    font-family:'Oswald'; 
    font-size: 30px; 
    margin-top:5px;
}
</style>
