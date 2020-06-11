import Formatters from "@/utils/formatters";

function filterDropdown(data, filters) {
    const filtered = data.filter(row => {
        return Object.keys(filters).every(key => {
            if (filters[key] != "") return filters[key].includes(row[key]);
            else return true;
        });
    });
    return filtered.length > 0 ? filtered : data;
}

function filterTissue(data, col, term) {
    const filtered = data.filter(row => {
        return term.includes(Formatters.tissueFormatter(row[col]));
    });

    return filtered.length > 0 ? filtered : data;
}

function filterBeta(data, value, key) {
    if (value == "n")
        //negative
        return data.filter(row => {
            return Number(row[key]) < 0;
        });
    else if (value == "p") {
        //positive
        return data.filter(row => {
            return Number(row[key]) > 0;
        });
    } else {
        //all
        return data;
    }
}

function filterPValue(data, value, key = "pValue") {
    if (!!value)
        return data.filter(row => {
            return row[key] <= value;
        });
    else return data;
}

function filterPhenotype(data, value, key = "phenotype") {
    const filtered = data.filter(row => {
        return value.includes(row[key].description);
    });
    return filtered.length > 0 ? filtered : data;
}

function filterTable(data, value, key) {
    const filtered = data.filter(row => {
        return value.includes(row[key]);
    });
    return filtered.length > 0 ? filtered : data;
}

function filterRegion(data, value, key) {
    let filtered = "";
    if (key == "annotation") {
        filtered = data.filter(row => {
            return value.includes(Formatters.capitalizedFormatter(row[key]));
        });
    } else if (key == "tissue") {
        filtered = data.filter(row => {
            return value.includes(Formatters.tissueFormatter(row[key]));
        });
    } else {
        //methods
        filtered = data.filter(row => {
            return value.includes(Formatters.capitalizedFormatter(row[key]));
        });
    }
    return filtered.length > 0 ? filtered : data;
}

function filterDataset(data, value, key) {
    let filtered = "";
    if (key == "ancestry") {
        filtered = data.filter(row => {
            return value.includes(Formatters.ancestryFormatter(row[key]));
        });
    } else {
        //techs
        filtered = data.filter(row => {
            return value.includes(row[key]);
        });
    }
    return filtered.length > 0 ? filtered : data;
}

export default {
    filterDropdown,
    filterTissue,
    filterBeta,
    filterPValue,
    filterPhenotype,
    filterTable,
    filterRegion,
    filterDataset
};
