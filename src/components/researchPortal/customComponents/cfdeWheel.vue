<template>
    <div class="cfde-wheel">
        <div class="cfde-underlay" @click="$emit('close')"></div>
        <div class="cfde-close" @click="$emit('close')">✖</div>
        <div style="display:flex; width: 100%; height:100%; padding:40px; gap: 20px">
        <div style="flex:1; display:flex; align-items: center; justify-content: center;">
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 382.365 366.599">
                <g transform="translate(191,183) scale(0.55) translate(-191,-200)">
                    <path class="interactive" @mouseenter="hoverCenter($event, centers[0].short_label, 100)" @mouseleave="unhover()" @click="handleClick(centers[0])"
                        d="m99.134 67.883 91.725 124.504L282.29 67.103 191.033.957l-45.95 33.463Z" fill="#cd5230" stroke="#cd5230" stroke-width="1.914" stroke-linejoin="round"/>
                    <path class="interactive" @mouseenter="hoverCenter($event, centers[1].short_label, 120)" @mouseleave="unhover()" @click="handleClick(centers[1])"
                        d="m381.408 140.247-91.693-66.462-91.43 125.285 148.332 48.664z" fill="#ecaa4b" stroke="#ecaa4b" stroke-width="1.914" stroke-linejoin="round"/>
                    <path class="interactive" @mouseenter="hoverCenter($event, centers[2].short_label, 60)" @mouseleave="unhover()" @click="handleClick(centers[2])"
                        d="m309.598 365.388 34.792-107.487-148.333-48.664.22 156.28z" fill="#7cb27c" stroke="#7cb27c" stroke-width="1.914" stroke-linejoin="round"/>
                    <path class="interactive" @mouseenter="hoverCenter($event, centers[3].short_label, 60)" @mouseleave="unhover()" @click="handleClick(centers[3])"
                        d="m73.25 365.642 112.632-.127-.22-156.278-147.446 48.996z" fill="#5a909b" stroke="#5a909b" stroke-width="1.914" stroke-linejoin="round"/>
                    <path class="interactive" @mouseenter="hoverCenter($event, centers[4].short_label, 120)" @mouseleave="unhover()" @click="handleClick(centers[4])"
                        d="m35.99 248.066 147.445-48.996L91.71 74.566.957 140.658Z" fill="#544f77" stroke="#544f77" stroke-width="1.914" stroke-linejoin="round"/>
                    <path class="no-events"
                        d="M191.22 315.291c63.947 0 115.787-51.768 115.787-115.627 0-63.859-51.84-115.627-115.787-115.627S75.434 135.805 75.434 199.664c0 63.86 51.84 115.627 115.786 115.627z" fill="#9f9f9f" style="mix-blend-mode:color-burn"/>
                    <path class="interactive2"
                        d="M191.08 255.844c30.946 0 56.032-25.086 56.032-56.032 0-30.945-25.086-56.032-56.032-56.032-30.945 0-56.032 25.087-56.032 56.032 0 30.946 25.087 56.032 56.032 56.032z" fill="#ffffff"/>
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/CFDE_logo.png" 
                        :x="centerX - 100/2"
                        :y="centerY - 10"
                        width="100"
                    />
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/training_1.png" 
                        :x="centerX - 25"
                        :y="centerY - 90"
                        width="50"
                    />
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/cloud_1.png" 
                        :x="centerX + 55"
                        :y="centerY - 40"
                        width="50"
                    />
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/knowledge_1.png" 
                        :x="centerX + 25"
                        :y="centerY + 60"
                        width="50"
                    />
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/training_1.png" 
                        :x="centerX - 75"
                        :y="centerY + 60"
                        width="50"
                    />
                    <image class="no-events"
                        href="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/data_1.png" 
                        :x="centerX - 100"
                        :y="centerY - 40"
                        width="50"
                    />
                    
                    <text class="label" x="191" y="70">Coordination</text>
                    <text class="label" x="330" y="155">Cloud</text>
                    <text class="label" x="260" y="335">Knowledge</text>
                    <text class="label" x="120" y="335">Training</text>
                    <text class="label" x="50" y="155">Data</text>
                </g>

                <!-- Ring of Image Circles -->
            <g v-for="(item, index) in dccs" :key="item.id">
                <circle
                :cx="getX(index)"
                :cy="getY(index)"
                :r="imgSize / 1.5"
                fill="#ffffff"
                stroke="#ccc"
                stroke-width="0.2"
                class="interactive2"
                @click="handleClick(item)"
                @mouseenter="hover($event, item.description)"
                @mouseleave="unhover()"
                />
                <image
                class="img-circle no-events"
                :href="item.icon"
                :x="getX(index) - imgSize/2"
                :y="getY(index) - imgSize/2"
                :width="imgSize"
                :height="imgSize"
                clip-path="circleClip"
                style="mix-blend-mode:darken"

                />
            </g>
            <defs>
                <clipPath id="circleClip">
                <circle :r="imgSize / 2" :cx="imgSize/2" :cy="imgSize/2" />
                </clipPath>
            </defs>
            </svg>
            <div class="cfde-tooltip" v-if="tooltip.visible" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }">
                {{tooltip.text}}
            </div>
        </div>
        <div v-if="useRAG" style="flex:1; padding: 7% 0">
            <cfde-rag />
        </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import cfdeRAG from "./cfdeRAG.vue";
import EventBus from "@/utils/eventBus";

Vue.use(BootstrapVueIcons);

export default Vue.component("cfde-wheel", {
    components: {cfdeRAG},
    data() {
        return {
            useRAG: false,
            viewBox: "0 0 382.365 366.599",
            centerX: 191,
            centerY: 183,
            ringRadius: 150,
            imgSize: 35,
            colors: {
                triangle: "#cd5230",
                yellow: "#ecaa4b",
                center: "#9f9f9f",
            },
            tooltip: {
                visible: false,
                text: '',
                x: 0,
                y: 0
            },
            dccs: [
                {
                    id: '65af85ae-82d5-5b81-bc66-6bddaa6420ce',
                    short_label: 'Kids First',
                    homepage: 'https://info.cfde.cloud/dcc/Kids First',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/Kids First.png',
                    description: 'Data, tools, and resources empowering pediatric research'
                },
                {
                    id: 'e332dadd-8084-5fbc-be41-29d75775aab3',
                    short_label: 'A2CPS',
                    homepage: 'https://info.cfde.cloud/dcc/A2CPS',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/A2CPS.png',
                    description: 'Understanding the complex biological processes underlying chronic pain'
                },
                {
                    id: '803ad44d-e7a2-550a-95c6-57855bf06be8',
                    short_label: 'HuBMAP',
                    homepage: 'https://info.cfde.cloud/dcc/HuBMAP',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/HuBMAP.png',
                    description: 'Cellular spatial atlas of the human body'
                },
                {
                    id: 'd6bb00c3-7224-5001-b9c5-9838622fba40',
                    short_label: '4DN',
                    homepage: 'https://info.cfde.cloud/dcc/4DN',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/4DN.png',
                    description: 'Nuclear organization in space and time'
                },
                {
                    id: 'f3f490cf-fd69-579c-8ea3-472c7cf3fb59',
                    short_label: 'LINCS',
                    homepage: 'https://info.cfde.cloud/dcc/LINCS',
                    icon: 'https://cfde-drc.s3.amazonaws.com/assets/img/LINCS-logo.png',
                    description: 'Omics signatures for drug & target discovery'
                },
                {
                    id: 'a1289ebb-0306-59a1-b0fc-e4d03a4790d7',
                    short_label: 'IDG',
                    homepage: 'https://info.cfde.cloud/dcc/IDG',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/IDG.png',
                    description: 'Illuminating GPCRs, kinases, ion channels, & other drug targets'
                },
                {
                    id: undefined,
                    short_label: 'NPH',
                    homepage: 'https://commonfund.nih.gov/nutritionforprecisionhealth',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/nph.png',
                    description: 'Predictive algorithms to advance nutrition research'
                },
                {
                    id: 'e31052b0-ac50-5ede-9828-698ff3610427',
                    short_label: 'GlyGen',
                    homepage: 'https://info.cfde.cloud/dcc/GlyGen',
                    icon: 'https://cfde-drc.s3.amazonaws.com/assets/img/glygen.png',
                    description: 'Computational and informatics resources for glycoscience'
                },
                {
                    id: '75b3be39-a021-5d80-b7e2-2a7938a1e11a',
                    short_label: 'Bridge2AI',
                    homepage: 'https://info.cfde.cloud/dcc/Bridge2AI',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/Bridge2AI.png',
                    description: 'Biomedical AI ↔ people, data & ethics'
                },
                {
                    id: 'a9aeab22-4fbc-5329-aef6-21110f463c23',
                    short_label: 'MoTrPAC',
                    homepage: 'https://info.cfde.cloud/dcc/MoTrPAC',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/MoTrPAC.png',
                    description: 'The molecular map of exercise'
                },
                {
                    id: '089d8d63-3364-526f-9706-80d62d0ec88c',
                    short_label: 'Metabolomics Workbench',
                    homepage: 'https://info.cfde.cloud/dcc/Metabolomics',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/Metabolomics.png',
                    description: 'Metabolomics'
                },
                {
                    id: undefined,
                    short_label: 'SCGE',
                    homepage: 'https://commonfund.nih.gov/editing',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/scge.png',
                    description: 'Reducing the burden of diseases caused by genetic changes'
                },
                {
                    id: '2399794e-74c6-5735-a039-0782cdeeb1e2',
                    short_label: 'SPARC',
                    homepage: 'https://info.cfde.cloud/dcc/SPARC',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/SPARC.svg',
                    description: 'Bridging the body and brain'
                },
                {
                    id: undefined,
                    short_label: 'SMaHT',
                    homepage: 'https://info.cfde.cloud/dcc/SMaHT',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/smath.png',
                    description: "Mapping somatic mutations' health implications"
                },
                {
                    id: 'cbfd44b8-684d-56b9-bfd4-45c0e259f896',
                    short_label: 'HMP',
                    homepage: 'https://info.cfde.cloud/dcc/HMP',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/HMP.png',
                    description: 'Human microbiome in health and disease'
                },
                {
                    id: 'b3028db2-209c-5862-8f4d-33c5b312332e',
                    short_label: 'GTEx',
                    homepage: 'https://info.cfde.cloud/dcc/GTEx',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/GTEx.png',
                    description: 'Gene expression and regulation across human tissues'
                },
                {
                    id: 'dd66e8a5-0e05-5a43-a0ca-18cc3698bb36',
                    short_label: 'SenNet',
                    homepage: 'https://info.cfde.cloud/dcc/SenNet',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/SenNet.png',
                    description: 'Mapping senescent cells'
                },
                {
                    id: 'f65babf7-2875-5725-9635-210d654533f1',
                    short_label: 'ExRNA',
                    homepage: 'https://info.cfde.cloud/dcc/ExRNA',
                    icon: 'https://cfde-drc.s3.us-east-2.amazonaws.com/assets/img/exRNA.png',
                    description: 'Extracellular RNA communication'
                }
            ],
            centers: [
                {
                    homepage: 'https://info.cfde.cloud/centers/ICC',
                    short_label: 'The Integration and Coordination Center'
                },
                {
                    homepage: 'https://info.cfde.cloud/centers/CWIC',
                    short_label: 'The Cloud Workspace Implementation Center'
                },
                {
                    homepage: 'https://info.cfde.cloud/centers/KC',
                    short_label: 'The Knowledge Center'
                },
                {
                    homepage: 'https://info.cfde.cloud/centers/TC',
                    short_label: 'The Training Center'
                },
                {
                    homepage: 'https://info.cfde.cloud/centers/DRC',
                    short_label: 'The Data Resource Center'
                }
            ]
        }
    },
    mounted() {
        document.body.style.overflow = 'hidden';
    },
    beforeDestroy() {
        document.body.style.overflow = '';
    },
    methods: {
        sendToLLM(dcc) {
            EventBus.$emit("send-to-chat", `Please tell me about ${dcc}`);
        },
        handleClick(item) {
            if(this.useRAG){
                this.sendToLLM(item.short_label);
            }else{
                window.open(item.homepage, "_blank");
            }
        },
        hover(event, index) {
            const svgRect = event.target.getBoundingClientRect();
            //console.log(window.innerHeight, {x:event.clientX, y:event.clientY}, svgRect)
            const yDir = svgRect.y + svgRect.height * 2 > window.innerHeight ? -1 : 1;
            const xDir = svgRect.x + svgRect.width * 2 > window.innderWidth ? -1 : 1;
            const svgCenter = {x: svgRect.x + svgRect.width/2, y:svgRect.y + svgRect.height/2}
            this.tooltip.text = index;//this.dccs[index].description;
            this.tooltip.x = svgCenter.x;
            this.tooltip.y = svgCenter.y + (svgRect.height/1.25) * yDir;
            this.tooltip.visible = true;
        },
        hoverCenter(event, index, yOffset) {
            const svgRect = event.target.getBoundingClientRect();
            //console.log(window.innerHeight, {x:event.clientX, y:event.clientY}, svgRect)
            const yDir = svgRect.y + svgRect.height * 2 > window.innerHeight ? -1 : 1;
            const xDir = svgRect.x + svgRect.width * 2 > window.innderWidth ? -1 : 1;
            const svgCenter = {x: svgRect.x + svgRect.width/2, y:svgRect.y + svgRect.height/2}
            this.tooltip.text = index;//this.dccs[index].description;
            this.tooltip.x = svgCenter.x;
            this.tooltip.y = svgRect.y + yOffset;
            this.tooltip.visible = true;
        },
        unhover() {
            this.tooltip.visible = false;
        },
        getX(index) {
            const angle = (2 * Math.PI / this.dccs.length) * index;
            return this.centerX + this.ringRadius * Math.cos(angle);
        },
        getY(index) {
            const angle = (2 * Math.PI / this.dccs.length) * index;
            return this.centerY + this.ringRadius * Math.sin(angle);
        }
    }
});

</script>

<style scoped>
    .cfde-wheel{
        position:fixed;
        width:100vw;
        height:100vh;
        left:0;
        top:0;
        z-index: 100;
        display:flex;
        justify-content: center;
        padding: 0px;
    }
    .cfde-underlay{
        position:absolute;
        width:100%;
        height:100%;
        left:0;
        top:0;
        background:rgba(0,0,0,0.8);
        z-index: -1;
    }
    .cfde-close {
        color: black;
        position: absolute;
        right: 25px;
        top: 20px;
        background: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor:pointer;
    }

    svg {
      width: auto;
      max-height: 100%;
      height: auto;
    }

    .label {
      font-family: sans-serif;
      font-size: 12px;
      fill: #000;
      pointer-events: none;
      text-anchor: middle;
    }

    .interactive:hover {
      opacity: 0.75;
      cursor: pointer;
    }
    .interactive2:hover {
        cursor: pointer;
        fill: #ccc;
    }

    .no-events{
        pointer-events: none;
    }

    .label{
        fill:white;
        text-transform: uppercase;
        font-size: 14px;
    }

    .cfde-tooltip{
        position: absolute;
        background: rgba(30, 30, 30, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 14px;
        font-family: sans-serif;
        pointer-events: none;
        max-width: 200px;
        transform: translate(-50%, -50%);
    }
  </style>