import { PANEL_ORDER } from "./lzConstants";

export function sortPanels (panels) {
    // _.invert swaps keys and values, i.e. [ "val" ] === { 0: "val" } => { "val": 0 }
    const panelOrderMap = _.invert(PANEL_ORDER);
    return panels.sort(function(x, y) {
        if (panelOrderMap[x] < panelOrderMap[y]) {
            return -1;
        }
        if (panelOrderMap[x] > panelOrderMap[y]) {
            return 1;
        }
        return 0;
    });
}

export function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

export function findLeastStart(start, end, indexSearch) {
    let startIndex = -1;
    let k = start;
    while (true) {
        startIndex = indexSearch(k);
        if (startIndex == -1 && k < end) {
            k++;
        } else {
            break;
        }
    }
    return startIndex;
}

export function findMostEnd(start, end, indexSearch) {
    let endIndex = -1;
    let j = end;
    while (true) {
        endIndex = indexSearch(j);
        if (endIndex == -1 && j > start) {
            j--;
        } else {
            break;
        }
    }
    return endIndex;
}

export function majorFormat(data){
    // https://stackoverflow.com/a/51285298
    if (data.constructor == Object) {
        return 'c'
    } else if (data instanceof Array) {
        return 'r'
    }
}

export function dataFilter(format, filter) {
    const firstProperty = Object.keys(filter)[0];
    return function (pointData, property=firstProperty) {
        if (format === "r") {
            return pointData.filter(datum => datum[property] == filter[property]);  // we want casting
        } else if (format === "c") {
            if (pointData[property]) {
                // initialize a tempData object
                let tempData = {};
                Object.keys(pointData).forEach(property => {
                    tempData[property] = [];
                });

                const columnFilterSeed =
                    pointData[property]
                        .map(datum => (datum == filter[property]))
                        .map((datum, index) => { if (datum) { return index } })
                        .filter(x => typeof x !== "undefined");

                // fill tempData object with data that's matched the filter
                columnFilterSeed.forEach(index => {
                    Object.keys(pointData).forEach(property => {
                        tempData[property][index] = pointData[property][index];
                    });
                });
                return tempData;
            }
            // column first filtering
            // get only elements of array with positions in array
            // find indecies of elements satisfying property
            return pointData;

        }
    };
};

export function dataRangeFilter(format, property) {
    return function (start, end) {
        return function (rangedData) {

            let startIndex = findLeastStart(start, end,
                point => (rangedData[property] || rangedData.map(item => item[property])).indexOf(point));
            let endIndex = findMostEnd(start, end,
                point => (rangedData[property] || rangedData.map(item => item[property])).lastIndexOf(point));

            if (format === "r") {

                if (startIndex !== -1 && endIndex !== -1) {
                    const value =  rangedData.slice(startIndex, endIndex !== -1 ? endIndex + 1 : rangedData.length);
                    return value;
                }
                return [];

            } else if (format === "c") {

                // initialize a tempData object
                let tempData = {};
                Object.keys(rangedData).forEach(property => {
                    tempData[property] = [];
                });
                if (startIndex !== -1 && endIndex !== -1) {

                    Object.keys(rangedData).forEach(property => {
                        tempData[property] = rangedData[property].slice(
                            startIndex,
                            endIndex !== -1 ? endIndex + 1 : rangedData[property].length + 1
                        );
                    });
                }
                return tempData;

            }

        }

    }
}
