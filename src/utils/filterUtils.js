let applyFilters = function (FILTERS, DATA) {
    let returnData = [];
    let filterData = DATA;

    filterData.map(d => {
        let meetFilters = true;

        FILTERS.map(filter => {
            let filterValue = (filter.value == 'search parameter') ?
                document.getElementById('search_param_' + filter.parameter).value : filter.value;

            if (!!d[filter.field] && d[filter.field] != undefined && meetFilters == true) {
                let filterVals;
                switch (filter.type) {
                    case 'search':

                        meetFilters = d[filter.field] == filterValue ? true : false;

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

export default {
    applyFilters,
};
