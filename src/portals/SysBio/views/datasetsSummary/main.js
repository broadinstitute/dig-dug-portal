import Vue from "vue";
import Template from "./template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

new Vue({
    mixins: [sysbioMixin],
    data() {
        return {
            convertedData: null,
            rawTsvData: `source_short	field	category	n_donors
CMD	case_control	Case	111
CMD	case_control	Unknown	80
CMD	case_control	Control	63
DiverseCohorts	case_control	Unknown	62
DiverseCohorts	case_control	Case	53
DiverseCohorts	case_control	Control	52
Mitrosmap	case_control	Control	23
Mitrosmap	case_control	Case	16
Mitrosmap	case_control	Unknown	9
PD	case_control	Case	69
PD	case_control	Control	24
PD	case_control	Unknown	4
RASLE	case_control	Case	156
RASLE	case_control	Control	30
ROSMAP	case_control	Unknown	153
ROSMAP	case_control	Control	152
ROSMAP	case_control	Case	146
CMD	disease	Unknown	106
CMD	disease	chronic kidney disease	37
CMD	disease	normal	37
CMD	disease	MASL	25
CMD	disease	MASH	23
CMD	disease	acute kidney failure	14
CMD	disease	MetALD	12
DiverseCohorts	disease	Unknown	125
DiverseCohorts	disease	MCI	42
Mitrosmap	disease	Unknown	48
PD	disease	Parkinson's Disease	69
PD	disease	No PD Nor Other Neurological Disorder	24
PD	disease	Parkinsonism	3
PD	disease	Dementia With Lewy Bodies	1
RASLE	disease	SLE	156
RASLE	disease	Unknown	30
ROSMAP	disease	Unknown	451
CMD	ethnicity	Unknown	199
CMD	ethnicity	Caucasian	55
DiverseCohorts	ethnicity	Unknown	167
Mitrosmap	ethnicity	Unknown	48
PD	ethnicity	Unknown	97
RASLE	ethnicity	Unknown	186
ROSMAP	ethnicity	Unknown	451
CMD	race	Unknown	180
CMD	race	White	52
CMD	race	Black or African-American	15
CMD	race	Asian	4
CMD	race	Other	2
CMD	race	White-Other	1
DiverseCohorts	race	Unknown	167
Mitrosmap	race	Unknown	48
PD	race	Unknown	97
RASLE	race	Unknown	186
ROSMAP	race	Unknown	451
CMD	sex	Male	92
CMD	sex	Female	82
CMD	sex	Unknown	80
DiverseCohorts	sex	Female	109
DiverseCohorts	sex	Male	58
Mitrosmap	sex	Female	24
Mitrosmap	sex	Male	24
PD	sex	Unknown	97
RASLE	sex	Unknown	186
ROSMAP	sex	Female	304
ROSMAP	sex	Male	146
ROSMAP	sex	Unknown	1
`,
        };
    },
    mounted() {
        this.convertedData = this.convertTsvToJson(this.rawTsvData);
        console.log("convertedData", this.convertedData);
    },
    computed: {},
    methods: {
        /**
         * Converts TSV (source_short, field, category, n_donors) into nested object:
         * { [source_short]: { [field]: { [category]: n_donors, ... }, ... }, ... }
         */
        convertTsvToJson(rawTsvData) {
            const text = (rawTsvData || "").trim();
            if (!text) return {};
            const lines = text.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) return {};
            const header = lines[0].split("\t").map((h) => h.trim());
            const srcIdx = header.indexOf("source_short");
            const fieldIdx = header.indexOf("field");
            const categoryIdx = header.indexOf("category");
            const nDonorsIdx = header.indexOf("n_donors");
            if (srcIdx === -1 || fieldIdx === -1 || categoryIdx === -1 || nDonorsIdx === -1) {
                return {};
            }
            const out = {};
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split("\t");
                const sourceShort = cols[srcIdx] != null ? String(cols[srcIdx]).trim() : "";
                const field = cols[fieldIdx] != null ? String(cols[fieldIdx]).trim() : "";
                const category = cols[categoryIdx] != null ? String(cols[categoryIdx]).trim() : "";
                const nDonors = cols[nDonorsIdx] != null ? parseInt(cols[nDonorsIdx], 10) : 0;
                if (!sourceShort || !field) continue;
                if (!out[sourceShort]) out[sourceShort] = {};
                if (!out[sourceShort][field]) out[sourceShort][field] = {};
                out[sourceShort][field][category] = isNaN(nDonors) ? 0 : nDonors;
            }
            return out;
        },
    },
    render(h) {
        return h(Template);
    },
}).$mount("#app");
