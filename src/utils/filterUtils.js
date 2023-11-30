let applyFilters = function (FILTERS, DATA, PARAMS) {
    let returnData = [];
    let filterData = DATA;

    filterData.map(d => {
        let meetFilters = true;

        FILTERS.map(filter => {

            let filterValue = !!PARAMS[filter.parameter] ? PARAMS[filter.parameter] : filter.value;

            if (!!d[filter.field] && d[filter.field] != undefined && meetFilters == true && !!filterValue) {
                let filterVals;
                switch (filter.type) {
                    case 'search':

                        meetFilters = !!d[filter.field].toLowerCase().includes(filterValue.toLowerCase()) ? true : false;

                        break;

                    case "search greater than":

                        meetFilters = typeof d[filter.field] == 'number' && d[filter.field] >= filterValue ? true : false;

                        break;

                    case "search lower than":
                        meetFilters = typeof d[filter.field] == 'number' && d[filter.field] <= filterValue ? true : false;
                        break;

                    case "search or":
                        filterVals = filterValue.split(",");
                        meetFilters = typeof d[filter.field] == 'number' &&
                            (d[filter.field] <= filterVals[0].trim() || d[filter.field] >= filterVals[1].trim()) ? true : false;
                        break;

                    case "search and":
                        filterVals = filterValue.split(",");
                        meetFilters = typeof d[filter.field] == 'number' &&
                            (d[filter.field] >= filterVals[0].trim() && d[filter.field] <= filterVals[1].trim()) ? true : false;

                        break;
                }
            } else {
                meetFilters = false;
            }
        })

        if (meetFilters == true) {
            returnData.push(d);
        }
    })

    return returnData;
}

/// complete for the multi-section BYOR
let filterMulti2Multi = function (FilterKey, TargetKey, TYPE, FilterData, TargetData) {

    let returnData = TargetData;

    if (!!FilterData && FilterData.length > 0) {
        switch (TYPE) {
            case "search":
                let filterValues = [...new Set(FilterData.map(d => d[FilterKey].toLowerCase()))];
                returnData = [...new Set(TargetData.filter(d => !!filterValues.includes(d[TargetKey].toLowerCase())))];

                break;
        }

    }

    return returnData;
}

export default {
    applyFilters,
    filterMulti2Multi,
};
