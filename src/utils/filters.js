export function filterDropdown(data, filters) {
    //let filtered = [];
    console.log("data ", data);
    // console.log("col ", col);
    console.log("filtersIN ", filters);

    // if (Array.isArray(term) && term.length > 0) {
    //     console.log("array");
    const filtered = data.filter(row => {
        // console.log("term", term);
        //console.log("row", row);
        return Object.keys(filters).every(key => {
            //console.log("key", key);
            //console.log("fKEY", filters[key]);
            //console.log("rKEY", row[key]);
            console.log("compare", filters[key].includes(row[key]));
            if (filters[key] != "") return filters[key].includes(row[key]);
            else return true;
        });
    });
    console.log("filters", filtered);

    // else {
    //     console.log("not array");
    //     if (!!term) {
    //         console.log("inside");
    //         filtered = data.filter(row => {
    //             return row[col] == term;
    //         });
    //     }
    //     console.log("filters", filtered);
    // }

    // //works for array of inputs
    // const filtered = data.filter(row => {
    //     return term.includes(row[col]);
    // });

    console.log("FF ", filtered);
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
