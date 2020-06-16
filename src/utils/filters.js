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

function filterFormatted(data, value, key) {
    if (!value || !key) return data;

    let filtered = data.filter(row => {
        switch (key) {
            case "annotation":
                return value.includes(Formatters.annotationFormatter(row[key]));
            case "tissue":
                return value.includes(Formatters.tissueFormatter(row[key]));
            case "consequence":
                return value.includes(
                    Formatters.consequenceFormatter(row[key])
                );
            case "ancestry":
                return value.includes(Formatters.ancestryFormatter(row[key]));
            default:
                return value.includes(
                    Formatters.capitalizedFormatter(row[key])
                );
        }
    });

    return filtered;
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
    if (!value || !key) return data;
    const filtered = data.filter(row => {
        return value.includes(row[key].description);
    });
    return filtered;
}

function filterTable(data, value, key) {
    if (!value || !key) return data;
    const filtered = data.filter(row => {
        return value.includes(row[key]);
    });
    return filtered;
}

export default {
    filterDropdown,
    filterFormatted,
    filterBeta,
    filterPValue,
    filterPhenotype,
    filterTable
};
