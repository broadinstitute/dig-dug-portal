export function filterDropdown(data, col, term) {
    //let filtered = [];
    // console.log("data ", data);
    // console.log("col ", col);
    // console.log("term ", term);

    // if (Array.isArray(term) && term.length > 0) {
    //     console.log("array");
    //     filtered = data.filter(row => {
    //         // console.log("term", term);
    //         // console.log("row", row);
    //         // return Object.keys(term).every(key => {
    //         //     console.log("key", key);
    //         //     console.log("rowcol", row[col]);
    //         //     console.log("check", row[col] == term[key]);
    //         //     return String(data[col]) == term[key];
    //         // });

    //         return term.includes(row[col]);
    //     });
    //     console.log("filters", filtered);
    // } else {
    //     console.log("not array");
    //     if (!!term) {
    //         console.log("inside");
    //         filtered = data.filter(row => {
    //             return row[col] == term;
    //         });
    //     }
    //     console.log("filters", filtered);
    // }

    //works for array of inputs
    const filtered = data.filter(row => {
        return term.includes(row[col]);
    });

    //console.log("FF ", filtered);
    return filtered.length > 0 ? filtered : data;
    //return data;
}

import Formatters from "@/utils/formatters";
export function filterTissue(data, col, term) {
    const filtered = data.filter(row => {
        // console.log("formatted", Formatters.tissueFormatter(row[col]));
        return term.includes(Formatters.tissueFormatter(row[col]));
    });

    //console.log("FF ", filtered);
    return filtered.length > 0 ? filtered : data;
}
