function alleleFormatter(reference, alt) {
    if (reference.length > 3) {
        reference = reference.substr(0, 3) + "...";
    }

    if (alt.length > 3) {
        alt = alt.substr(0, 3) + "...";
    }

    return `${reference}/${alt}`;
}

function dataTypeFormatter(s) {
    const types = {
        GWAS: "GWAS",
        ExChip: "Exome chip",
        ExSeq: "Exome sequence analysis",
        WGS: "Whole genome sequencing",
        IChip: "IChip",
    };

    return types[s];
}

function ancestryFormatter(s) {
    const ancestries = {
        ABA: "Aboriginal Australian",
        AA: "African American or Afro-Caribbean",
        AF: "African unspecified",
        SSAF: "Sub-Saharan African",
        ASUN: "Asian unspecified",
        CA: "Central Asian",
        EA: "East Asian",
        SA: "South Asian",
        SEA: "South East Asian",
        EU: "European",
        GME: "Greater Middle Eastern (Middle Eastern, North African, or Persian)",
        HS: "Hispanic or Latin American",
        NAM: "Native American",
        NR: "Not reported",
        OC: "Oceanian",
        OTH: "Other",
        OAD: "Other admixed ancestry",
        Mixed: "Mixed ancestry",
    };
    return ancestries[s];
}

function snakeFormatter(s) {
    if (s) {
        return s.replace(
            /(^|_|\s)([a-z])/g,
            (m, t, s) => `${t.length > 0 ? " " : ""}${s.toUpperCase()}`
        );
    }
}

function toSnakeFormatter(s) {
    if (s) {
        return s.trim().toLowerCase().replaceAll(' ', '_');
    }
}

function annotationFormatter(s) {
    return snakeFormatter(s);
}

function bioTypeFormatter(s) {
    return capitalizedFormatter(s);
}

function capitalizedFormatter(s) {
    return snakeFormatter(s);
}

function consequenceFormatter(s) {
    return capitalizedFormatter(s);
}

function consequenceMeaning(s) {
    const consequences = {
        transcript_ablation:
            "It deletes a region that includes a transcript feature.",
        splice_donor_variant:
            "It is a splice variant that changes the 2-base region at the 5' end of an intron.",
        splice_acceptor_variant:
            "It is a splice variant that changes the 2-base region at the 3' end of an intron.",
        stop_gained:
            "It is a sequence variant that introduces a stop codon, leading to a shortened transcript.",
        frameshift_variant:
            "It causes a frameshift, disrupting the translational reading frame because the number of nucleotides inserted or deleted is not a multiple of three.",
        stop_lost:
            "It is a sequence variant that changes a stop codon, resulting in an elongated transcript.",
        initiator_codon_variant: "It changes the first codon of a transcript.",
        inframe_insertion:
            "It is an inframe non-synonymous variant that inserts bases into the coding sequence.",
        inframe_deletion:
            "It is an inframe non-synonymous variant that deletes bases from the coding sequence.",
        missense_variant:
            "It results in a different amino acid sequence but preserves length.",
        transript_amplification:
            "It amplifies a region containing a transcript.",
        splice_region_variant:
            "It is a sequence variant in which a change has occurred within the region of a splice site, either within 1-3 bases of the exon or 3-8 bases of the intron.",
        incomplete_terminal_codon_variant:
            "It is a sequence variant that changes at least one base of the final codon of an incompletely annotated transcript.",
        synonymous_variant:
            "It does not cause any change to the encoded amino acid.",
        stop_retained_variant:
            "It changes the set of bases in a stop codon, but the stop codon itself remains functional.",
        coding_sequence_variant: "It changes the coding sequence.",
        mature_miRNA_variant:
            "It is a transcript variant located with the sequence of the mature miRNA.",
        "5_prime_UTR_variant": "It is found in the 5' untranslated region.",
        "3_prime_UTR_variant": "It is found in the 3' untranslated region.",
        non_coding_exon_variant: "It changes the non-coding exon sequence.",
        nc_transcript_variant:
            "It is a transcript variant of a non-coding RNA.",
        intron_variant:
            "It is a transcript variant occurring within an intron.",
        nmd_transcript_variant:
            "It falls in a transcript that is the target of nonsense-mediated decay.",
        upstream_gene_variant: "It is located upstream (5') of the gene.",
        downstream_gene_variant: "It is located downstream (3') of the gene.",
        tfbs_ablation:
            "It deletes a region that includes a transcription factor binding site.",
        tfbs_amplification:
            "It amplifies a region that includes a transcription factor binding site.",
        tf_binding_site_variant:
            "It is located within a transcription factor binding site.",
        regulatory_region_variant: "It is located within a regulatory region.",
        regulatory_region_ablation: "It deletes a regulatory region.",
        regulatory_region_amplification: "It amplifies a regulatory region.",
        feature_elongation:
            "It causes the extension of a genomic feature with regard to the reference sequence.",
        feature_truncation:
            "It causes the truncation of a genomic feature with regard to the reference sequence.",
        intergenic_variant:
            "It is located in an intergenic region (between genes).",
    };

    return consequences[s] || "Unknown";
}

function dbSNPFormatter(dbSNP) {
    return dbSNP;
}

function floatFormatter(value) {
    if (!value) {
        return "-";
    }
    return Number.parseFloat(value).toFixed(2);
}

function tpmFormatter(value) {
    return Number.isNaN(Number.parseFloat(value))
        ? "-"
        : Number.parseFloat(value).toFixed(3);
}

function pValueFormatter(value) {
    if (!value) {
        return "-";
    }

    let x = Number.parseFloat(value);

    if (x < 1e-5) {
        return x.toExponential(2);
    } else {
        let num = (x.toFixed(7) * 1).toString(); // remove trailing zeroes using string hacks
        return num;
    }
}

function effectFormatter(value) {
    if (!value) {
        return "-";
    }
    return Number.parseFloat(value).toFixed(4);
}

function intFormatter(value) {
    return value ? Number.parseInt(value).toLocaleString() : "-";
}

function igvLocusFormatter(igvLocus) {
    const chromosome = igvLocus.chr.charAt(3);
    const start = igvLocus.start.replace(/,/g, "");
    const end = igvLocus.end.replace(/,/g, "");
    return locusFormatter(chromosome, start, end);
}

function locusFormatter(chromosome, position, end = undefined) {
    if (end) {
        return `${chromosome}:${intFormatter(position)}-${intFormatter(end)}`;
    }
    return `${chromosome}:${intFormatter(position)}`;
}

function phenotypeFormatter(phenotype) {
    return phenotype ? phenotype.description : "-";
}

function methodFormatter(method) {
    if (!method) {
        return "-";
    }

    return capitalizedFormatter(method);
}

function tissueFormatter(tissue) {
    return snakeFormatter(tissue);
}

function pValueCss(value, max) {
    if (value === max) return 100;
    const maxWidth = Math.log(-Math.log10(max));
    const barWidth = Math.log(-Math.log10(value));
    let calculated = (barWidth / maxWidth) * 100;
    return calculated > 100 ? 100 : calculated;
}

function decimalFormatter(NUM, DECIMAL) {
    let decimal = DECIMAL == 0 ? 1 : DECIMAL * 10;
    let newNum = Math.round(NUM * decimal) / decimal;
    return newNum;
}
function maskFormatter(mask) {
    let maskLookup = {
        LoF_HC: { description: "LofTee", sort: 0 },
        loftee: { description: "LofTee", sort: 0 },

        "16of16": { description: "16/16", sort: 1 },
        ns_severe: { description: "16/16", sort: 1 },

        "11of11": { description: "11/11 ", sort: 2 },
        ns_stringent: { description: "11/11 ", sort: 2 },

        "5of5": { description: "5/5", sort: 3 },
        ns_strict: { description: "5/5", sort: 3 },

        "5of5_LoF_LC": { description: "5/5 + LofTee LC", sort: 4 },
        ns_strict_fp_ptvs: { description: "5/5 + LofTee LC", sort: 4 },

        "1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
        ns_strict_ns_broad_1pct: { description: "5/5 + 1/5 1%", sort: 5 },

        "0of5_1pct": { description: "5/5 + 0/5 1%", sort: 6 },
        ns_strict_ns_1pct: { description: "5/5 + 0/5 1%", sort: 6 },

        hclof_noflag_canonical: { description: "Rare LoF", sort: 7 },
        "hclof_noflag_missense0.8_canonical": {
            description: "Rare LoF + Missense",
            sort: 7,
        },
        "missense0.5_canonical": {
            description: "Ultra-rare Missense",
            sort: 7,
        },
    };
    if (maskLookup[mask]) {
        return maskLookup[mask];
    }
    return { description: mask, sort: 7 };
}

function ssColumnFormat(ROW_DATA, FORMAT, VALUE) {

    let content;

    switch (FORMAT.type) {
        case "link":
            let href = FORMAT.link;

            FORMAT.parameters.map(p => {
                href = href.replace('$' + p, ROW_DATA[p]);
            })
            /*for (const [rKey, rValue] of Object.entries(ROW_DATA)) {

                href = href.replace('$' + rKey, rValue);
            }*/

            content = "<a href='" + href + "'>" + VALUE + "</a>";

            break;

        case "scientific notation":
            content = pValueFormatter(VALUE);

            content = content == "-" ? 0 : content;
            break;

        case "ancestry":
            content = ancestryFormatter(VALUE)
            break;

    }

    return content;

}

function formatLLMResponse(VALUE, FORMAT) {
    let newTab;
    switch (FORMAT.type) {
        case "link":
            newTab = FORMAT["new tab"] ? "_blank" : "";
            return "<a href='" + FORMAT["link to"] + VALUE + "' target='" + newTab + "'>" + VALUE + "</a>";
            break;
        case "split link":
            newTab = FORMAT["new tab"] ? "_blank" : "";
            let contentArr = VALUE.split(FORMAT["split by"]);
            let returnContent = "";

            contentArr.map((content, index) => {
                returnContent += (index == FORMAT["link index"]) ? "<a href='" + FORMAT["link to"] + content + "' target='" + newTab + "'>" + content + "</a>" : content;
            })
            return returnContent;
    }
}

function formatCellValues(VALUE, columnKeyObj, formatTypes, linkToNewTab, KEY, CONFIG, PMAP, DATA_SCORES, ROW_VALUE) {

    let cellValue = VALUE;
    formatTypes.map((type) => {
        let linkString, linkLabel, fieldValue, weight, weightClasses;
        switch (type) {
            case "js math":
                let calFunc = columnKeyObj["method"];

                cellValue = Math[calFunc](VALUE);
                break;
            case "scientific notation":
                cellValue = pValueFormatter(VALUE);

                cellValue = cellValue == "-" ? 0 : cellValue;
                break;

            case "fixed 2":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 10) / 10;
                break;

            case "fixed 3":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 100) / 100;
                break;

            case "fixed 4":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 1000) /
                        1000;
                break;

            case "fixed 5":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 10000) /
                        10000;
                break;

            case "fixed 6":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 100000) /
                        100000;
                break;

            case "fixed 7":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 1000000) /
                        1000000;
                break;

            case "fixed 8":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 10000000) /
                        10000000;
                break;

            case "fixed 9":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(Number.parseFloat(VALUE) * 100000000) /
                        100000000;
                break;

            case "fixed 10":
                cellValue =
                    VALUE == "-"
                        ? 0
                        : Math.round(
                            Number.parseFloat(VALUE) * 1000000000
                        ) / 1000000000;
                break;

            case "kp phenotype description":
                let phenotypeDescription = PMAP && PMAP[cellValue]
                    ? PMAP[cellValue].description
                    : cellValue;

                cellValue = phenotypeDescription;
                break;

            case "kp phenotype link":
                let phenotypeName = PMAP[cellValue]
                    ? PMAP[cellValue].description
                    : cellValue;
                linkString =
                    "<a href='" + columnKeyObj["link to"] + cellValue;

                linkString +=
                    !!columnKeyObj["link type"] &&
                        columnKeyObj["link type"] == "button"
                        ? "' class='btn btn-sm btn-outline-secondary link-button"
                        : "";

                linkLabel = columnKeyObj["link label"]
                    ? columnKeyObj["link label"]
                    : phenotypeName;

                linkString +=
                    linkToNewTab == "true"
                        ? "' target='_blank'>" + linkLabel + "</a>"
                        : "'>" + linkLabel + "</a>";

                cellValue = linkString;
                break;

            case "link":
                if (!!cellValue && cellValue != "") {

                    let linksArr = [];

                    let cellVals = (typeof cellValue == "string") ? cellValue.split(",") :
                        (typeof cellValue == "object" && !!cellValue.isArray()) ? cellValue : [cellValue];

                    cellVals.map(v => {
                        let link = "<a href='" + columnKeyObj["link to"] + v;

                        link +=
                            !!columnKeyObj["link type"] &&
                                columnKeyObj["link type"] == "button"
                                ? "' class='btn btn-sm btn-outline-secondary link-button"
                                : "";

                        linkLabel = columnKeyObj["link label"]
                            ? columnKeyObj["link label"]
                            : v;

                        link +=
                            linkToNewTab == "true"
                                ? "' target='_blank'>" + linkLabel + "</a>"
                                : "'>" + linkLabel + "</a>";
                        linksArr.push(link);
                    })

                    linkString = linksArr.join();
                }

                cellValue = (!!cellValue && cellValue != "") ? linkString : cellValue;
                break;

            case "link with parameters":
                if (!!cellValue && cellValue != "") {

                    let link = "<a href='" + columnKeyObj["link to"];

                    let paramKeys = Object.keys(columnKeyObj["parameters"]);

                    paramKeys.map(key => {
                        link += key + '=' + ROW_VALUE[columnKeyObj["parameters"][key]] + '&';
                    })

                    link +=
                        linkToNewTab == "true"
                            ? "' target='_blank'>" + cellValue + "</a>"
                            : "'>" + cellValue + "</a>";

                    linkString = link;
                }

                //console.log("linkString", linkString)
                cellValue = (!!cellValue && cellValue != "") ? linkString : cellValue;

                break;

            case "map name":

                let tempValue = cellValue;

                if (columnKeyObj["map"] == "shared resource") {
                    let map = this.$root.sharedResource[columnKeyObj["map name"]]
                    cellValue = map[cellValue];
                } else {
                    cellValue = columnKeyObj["map"][cellValue];
                }

                if (!!columnKeyObj["link to"]) {
                    cellValue = "<a href='" + tempValue + "'>" + cellValue + "</a>"
                }

                break;

            case "as link":

                cellValue = "<a href='" + cellValue + "'>" + cellValue + "</a>"


                break;

            case "image":

                if (!!cellValue && cellValue != "") {
                    cellValue = '<img width="' + columnKeyObj["width"] + '" height="' + columnKeyObj["height"] + '" src="' + cellValue + '" />'
                }

                break;

            case "video":
                if (!!cellValue && cellValue != "") {
                    cellValue = '<video width="' + columnKeyObj["width"] + '" height="' + columnKeyObj["height"] + '" controls><source src="' + cellValue + '" type="video/mp4" >\
                            Your browser does not support the video tag.</video>'
                }
                break;

            case "list":
                if (typeof cellValue != "object") {
                    cellValue = `<div class="list-item">${cellValue}</div>`
                } else if (typeof cellValue === "object" && Array.isArray(cellValue)) {
                    let cellValueString = "<ul>";
                    cellValue.map(value => {
                        cellValueString += `<li>${value}</li>`;
                    })
                    cellValueString += "</ul>";

                    cellValue = cellValueString;
                }

                break;

            case "value in class":
                if (typeof cellValue != "object") {
                    const colorize = formatTypes.includes('colorize');
                    cellValue = `<span class="${cellValue} ${colorize ? 'do-color' : ''}">${cellValue}</span>`
                } else if (typeof cellValue == "object" && !!Array.isArray(cellValue)) {
                    let cellValueString = "";
                    cellValue.map(value => {
                        cellValueString += `<span class="${value} ${colorize ? 'do-color' : ''}">${value}</span>`;
                    })

                    cellValue = cellValueString;
                }

                break;

            case "render background percent":
                fieldValue =
                    typeof VALUE != "number"
                        ? columnKeyObj["percent if empty"]
                        : VALUE;

                weight = Math.floor(
                    ((Number(fieldValue) - DATA_SCORES[KEY].low) /
                        (DATA_SCORES[KEY].high - DATA_SCORES[KEY].low)) *
                    100
                );

                weightClasses = "cell-weight-" + weight + " ";

                weightClasses +=
                    VALUE < 0 ? "weight-negative" : "weight-positive";

                cellValue =
                    "<span class='" +
                    weightClasses +
                    "'>" +
                    cellValue +
                    "</span>";
                break;

            case "render background percent negative":
                fieldValue =
                    typeof VALUE != "number"
                        ? columnKeyObj["percent if empty"]
                        : VALUE;

                weight =
                    100 -
                    Math.floor(
                        ((Number(fieldValue) - DATA_SCORES[KEY].low) /
                            (DATA_SCORES[KEY].high -
                                DATA_SCORES[KEY].low)) *
                        100
                    );

                weightClasses = "cell-weight-" + weight + " ";

                weightClasses +=
                    VALUE < 0 ? "weight-negative" : "weight-positive";

                cellValue =
                    "<span class='" +
                    weightClasses +
                    "'>" +
                    cellValue +
                    "</span>";
                break;

            case "direction triangle":
                cellValue =
                    cellValue > 0
                        ? '<span class="direction-positive">&#x25B2;</span>' +
                        cellValue
                        : '<span class="direction-negative">&#x25BC;</span>' +
                        cellValue;
                break;

            case "direction triangle opposite":
                cellValue =
                    cellValue > 0
                        ? '<span class="direction-positive">&#x25BC;</span>' +
                        cellValue
                        : '<span class="direction-negative">&#x25B2;</span>' +
                        cellValue;
                break;

            case "shorten":
                let shortenTo = columnKeyObj["shorten to"];
                let shortString = (columnKeyObj["shorten anchor"] == "start") ? cellValue.substring(0, shortenTo) :
                    cellValue.substring(cellValue.length - shortenTo, cellValue.length);

                cellValue = (columnKeyObj["shorten anchor"] == "start") ? "<span class='byor-shortened-string'><span class='raw-string'>" + cellValue + "</span>" + shortString + "...</span>" :
                    "<span class='byor-shortened-string'><span class='raw-string'>" + cellValue + "</span>..." + shortString + "</span>";
        }
    });
    return cellValue
}

function getHoverValue(VALUE) {
    let formatted;

    if (typeof VALUE == 'number' && !isNaN(VALUE)) {
        formatted = pValueFormatter(VALUE);
    } else {
        formatted = VALUE;
    }
    return formatted;
}

function BYORColumnFormatter(VALUE, KEY, CONFIG, PMAP, DATA_SCORES, ROW_VALUE) {
    if (
        CONFIG["column formatting"] != undefined &&
        CONFIG["column formatting"][KEY] != undefined
    ) {
        let columnKeyObj = CONFIG["column formatting"][KEY];
        let formatTypes = columnKeyObj["type"];
        let linkToNewTab = columnKeyObj["new tab"]
            ? columnKeyObj["new tab"]
            : null;
        let cellValue;

        if (formatTypes.includes("cfde-datatypes")) {
            console.log(typeof VALUE, Array.isArray(VALUE));
        }


        if (typeof VALUE != "object") {
            //console.log('...not object')
            if (formatTypes.includes("youtube")) {
                let cellValueString = `
                    <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${VALUE}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                `;
                cellValue = cellValueString;
            } else {
                cellValue = formatCellValues(VALUE, columnKeyObj, formatTypes, linkToNewTab, KEY, CONFIG, PMAP, DATA_SCORES, ROW_VALUE);
            }
        } else if (typeof VALUE == "object" && !!Array.isArray(VALUE)) {
            //console.log('...is array')
            if (formatTypes.includes("object to mini-card")) {

                let cellValueString = "";

                VALUE.map(aValue => {
                    cellValueString += "<div class='mini-card'>";
                    let valueKeys = Object.keys(aValue);
                    //console.log(aValue["title"]);
                    cellValueString += `<div class="mini-card-video">
                            <video src="${aValue["video"]}" poster="${aValue["screenshot"]}" autoplay muted playsinline>
                        </div>`;
                    cellValueString += `<div class="mini-card-info">
                            <a class="mini-card-title" href="${aValue["link"]}" target="_blank">${aValue["title"]}<span>&nearr;</span></a>
                            <div class="mini-card-description">${aValue["description"]}</div>
                        </div>`;

                    cellValueString += "</div>";
                })
                cellValue = cellValueString;

            } else if (formatTypes.includes("custom-citation")) {

                let cellValueString = '';

                VALUE.forEach(item => {
                    if (!item.title || item.title === "") return;
                    const citation = `
                    <div class="citation">
                        <div><strong>${item.title}</strong></div>
                        <div>${item.authors} <i>${item.publication}</i></div>
                        <div class="citation-links">
                            <div>DOI: <a href="https://doi.org/${item.doi}" target="_blank">${item.doi}</a></div>
                            <div style="display:${item.pmid === "" ? 'none' : 'block'}">PMID: <a href="http://www.ncbi.nlm.nih.gov/pubmed/${item.pmid}" target="_blank">${item.pmid}</a></div>
                            <div style="display:${item.pmcid === "" ? 'none' : 'block'}">PMCID: <a href="http://www.ncbi.nlm.nih.gov/pubmed/${item.pmcid}" target="_blank">${item.pmcid}</a></div>
                        </div>
                        <div class="citation-notes">${item.description}</div>
                    </div>
                    `;
                    cellValueString += citation;
                })

                cellValue = cellValueString;
                //console.log('make citation', VALUE);

            } else {
                //console.log('...something else')
                let cellValueString = (!!formatTypes.includes("image") && VALUE != "") ? "<div class='imgs_wrapper'>" : "";
                VALUE.map(value => {
                    cellValueString += formatCellValues(value, columnKeyObj, formatTypes, linkToNewTab, KEY, CONFIG, PMAP, DATA_SCORES, ROW_VALUE);
                })

                cellValueString += (!!formatTypes.includes("image") && VALUE != "") ? "</div>" : "";

                cellValue = cellValueString;
            }
        } else {
            if (formatTypes.includes("custom-extra")) {
                cellValue = `<div class=""><div class="">${VALUE["description"]}</div><a href="${VALUE["link"]}" target="_blank">${VALUE["link label"]}</a></div>`
            }
            if (formatTypes.includes("cfde-datatypes")) {
                //console.log("data type!");
                let cellValueString = '<div style="display:flex;flex-direction:column; gap:10px;">';
                for (const [key, value] of Object.entries(VALUE)) {
                    if (value.trim() != '') {
                        const k = key.replaceAll('_', ' ');
                        cellValueString += `<div style="${k === 'note' ? 'display:flex;gap:5px;font-style:italic;' : ''}">
                        <div style="font-weight:bold;text-transform:capitalize">${k}</div>
                        <div>${value}</div>
                        </div>
                        `
                    }
                }
                cellValueString != '</div>';
                cellValue = cellValueString;
            }
        }

        return cellValue;
    } else {
        return VALUE;
    }
}

function getShortName(STR) {
    let formatted;
    formatted = (STR.length >= 15) ? "<span class='byor-shortened-string'><span class='raw-string'>" + STR + "</span>" + STR.substring(0, 14) + "...</span>" :
        STR;
    return formatted;
}

function replaceWithParams(STR, PARAMS) {
    let paramKeys = (!!PARAMS) ? Object.keys(PARAMS) : [];
    let replacedSTR = STR;
    if (!!replacedSTR) {
        let url = window.location.href;
        const queryParams = {};
        const urlObj = new URL(url);
        const searchParams = urlObj.searchParams;

        for (const [key, value] of searchParams.entries()) {
            queryParams[key] = value;
        }

        Object.keys(queryParams).map(key => {
            if (paramKeys.includes(key)) {
                let replaceTo = (!!PARAMS[key].values) ? PARAMS[key].values[queryParams[key]] : queryParams[key];
                replacedSTR = replacedSTR.replaceAll('$' + key, replaceTo);
            }
        })

        replacedSTR = replacedSTR.replaceAll('$', '<small style="background-color: #cccccc; padding: 0 0.1em; font-size:0.65em; vertical-align: text-top; margin-right: 0.2em;">parameter</small>');
    }

    return replacedSTR
}


export default {
    alleleFormatter,
    ancestryFormatter,
    dataTypeFormatter,
    annotationFormatter,
    bioTypeFormatter,
    capitalizedFormatter,
    consequenceFormatter,
    consequenceMeaning,
    dbSNPFormatter,
    floatFormatter,
    tpmFormatter,
    intFormatter,
    locusFormatter,
    igvLocusFormatter,
    maskFormatter,
    phenotypeFormatter,
    snakeFormatter,
    toSnakeFormatter,
    tissueFormatter,
    methodFormatter,
    pValueFormatter,
    effectFormatter,
    pValueCss,
    decimalFormatter,
    BYORColumnFormatter,
    getHoverValue,
    getShortName,
    ssColumnFormat,
    replaceWithParams,
    formatLLMResponse
};
