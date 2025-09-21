<template>
    <div v-if="data" class="citations-wrapper" :class="{compact:compact, open:isOpen}" :style="{'--citations-width': width}">
        <div ref="citationsBtnRef" class="citations-button" @click="showCitations">
            Sources <span v-if="isOpen" class="close">✖</span>
        </div>
        <div class="citations-section" :class="alignment">
            <ol class="citations">
                <li v-for="(c, idx) in data" :key="idx" class="citation">
                    <span v-if="hasAuthors(c)">{{ formatAuthors(c) }}. </span>
                    <span v-if="c.organization">{{ c.organization }}. </span>
                    <span v-if="c.year">({{ c.year }}). </span>
                    <em v-if="c.title">{{ c.title }}. </em>
                    <span v-if="c.version"> <strong>{{ c.version }}</strong>. </span>
                    <template v-if="c.url">
                        <span v-html="renderUrlsInline(c)"></span>. 
                    </template>
                    <span v-if="c.accessed"> Accessed {{ c.accessed }}. </span>
                    <div v-if="c.notes" class="notes">
                        <small><em>{{ c.notes }}</em></small>
                    </div>
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
/*
//////////citation json template
"citations": [
    {
        "authors": "string or array of strings",
        "organization": "string (optional, for institutional or group authors)",
        "year": "integer" (optional, if given),
        "title": "string",
        "version": "string (optional — dataset version or journal volume/pages)",
        "url": "string or array (DOI, URL, or multiple links)",
        "accessed": "YYYY-MM-DD (optional, for web resources)",
        "notes": "string (optional — funding, supporting info, etc.)"
    }
]


//////////citation example
"citations": [
    {
        "organization": "The Common Fund Data Ecosystem Knowledge Center",
        "title": "CFDE Knowledge Center",
        "url": "https://www.cfdeknowledge.org",
        "accessed": "2025-09-08",
        "notes": "Supported by NIH Office of the Director, Fund OT2OD036440"
    },{
        "authors": [
            "MoTrPAC Study Group", 
            "Lead Analysts"
        ],
        "year": 2024,
        "title": "Temporal dynamics of the multi-omic response to endurance exercise training",
        "version": "Nature 629, 174-183",
        "url": "https://doi.org/10.1038/s41586-023-06877-w"
    },
    {
        "authors": "The Molecular Transducers of Physical Activity Consortium (MoTrPAC)",
        "title": "Endurance Trained Young Adult Rats Study",
        "url": [
            "https://motrpac.org",
            "https://motrpac-data.org"
        ]
    }
]



//////////component usage
<research-citation  
    :data="citations"
    :compact="true"
    width="1000px"
/>
*/

import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("research-citation", {
    props: {
        data: {
            type: Array,
            required: true,
            default: null


        },
        compact: {
            type: Boolean,
            required: false,
            default: false
        },
        width: {
            type: String,
            required: false
        }
    },
    data(){
        return {
            isOpen: false,
            alignment: 'isLeft'
        };
    },
    mounted(){
        if(!this.data) return;
        this.alignment = this.getAlignment();
    },
	computed: {

    },
	watch: {

    },
    methods: {
        ...uiUtils,
        showCitations(){
            if(!this.compact) return;
            this.isOpen = !this.isOpen;
        },
        getAlignment() {
            //component auto-detects if its aligned on the left or right of a page
            //and will adjust its display accordingly
            //note: applies to 'compact' mode only
            const el = this.$refs.citationsBtnRef;
            if (!el || typeof window === 'undefined') return 'isLeft';

            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth || document.documentElement.clientWidth;

            const componentCenterX = rect.left + rect.width / 2;
            const viewportCenterX = vw / 2;

            return componentCenterX <= viewportCenterX ? 'isLeft' : 'isRight';
        },

        hasAuthors(c) {
            return Array.isArray(c.authors) ? c.authors.length > 0 : !!c.authors;
        },
        formatAuthors(c) {
            // authors can be string or array of strings
            if (Array.isArray(c.authors)) {
                return c.authors.filter(Boolean).join("; ");
            }
            return c.authors || "";
        },
        wrapParens(val) {
            // e.g., 2024 -> (2024). or 'n.d.' -> (n.d.).
            const s = String(val).trim();
            return `(${s}).`;
        },
        urlsAsArray(c) {
            if (!c.url) return [];
            return Array.isArray(c.url) ? c.url : [c.url];
        },
        renderUrlsInline(c) {
            const urls = this.urlsAsArray(c);
            if (!urls.length) return "";
            // Join multiple URLs with '; '
            return urls
                .map((u) => `<a href="${this.escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${this.escapeText(u)}</a>`)
                .join("; ");
        },
        // Minimal escaping to guard text nodes/attrs
        escapeText(s) {
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        },
        escapeAttr(s) {
            return String(s)
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;");
        }
    },
});
</script>
<style scoped>
.citations-wrapper{
    position: relative;
}
.citations-button{
    font-weight: bold;
}
.citations {
    margin: 0;
    padding-left: 2rem;
}
.citation {
    line-height: 1.4;
    margin-bottom: 0.5em;
}
.citation em {
    font-style: italic;
}
.notes {
    color: #555;
    margin-top: -.2em;
}

.citations-button{
    user-select: none;
    display: flex;
    align-items: center;
    gap: 5px;
}

.close{
    font-size: 0.8em;
}

.compact{
    z-index: 1000;

    .citations-button{
        position: relative;
        cursor: pointer;
        background: #eee;
        padding:3px 10px;
        border-radius: 7px;
        width: fit-content;
        z-index: 1;
    }

    .citations-button:hover{
        background-color: #ddd;
    }

    .citations-section{
        display: none;
    }
}

.compact.open{
    --min-width: 500px;
    z-index: 10000;

    .citations-button{
        background: white;
    }
    .citations-button:hover{
        background-color: #ddd;
    }
    .citations-section {
        display:flex;
        position: absolute;
        top: -10px;
        left: -10px;
        min-width: var(--min-width);
        width: var(--citations-width, calc(100% + 20px));
        background: #eee;
        padding: 50px 20px 20px;
        border-radius: 10px;
        box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
    }

    .citations-section.isRight {
        left:auto;
        right:-10px;
    }

    .citations{  
        max-height: 400px;
        overflow: auto;
    }
}
</style>