import { PANEL_ORDER } from "./lzConstants";
import {findLeastStart, findMostEnd, majorFormat} from "../bioIndexUtils";

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

export const calcLog = function (values) {
    if (values instanceof Array) {
        return values.map(Math.log).map(data => (-1)*data);
    } else {
        return (-1)*Math.log(values);
    }
};

export function dataFilter(format, propertyName) {
    return function(propertyValue) {
        return function (pointData) {
            if (format === "r") {
                return pointData.filter(datum => datum[propertyName] == propertyValue);  // we want casting
            } else if (format === "c") {
                if (pointData[propertyName]) {
                    // initialize a tempData object
                    let tempData = {};
                    Object.keys(pointData).forEach(property => {
                        tempData[propertyName] = [];
                    });

                    const columnFilterSeed =
                        pointData[propertyName]
                            .map(datum => (datum == propertyValue))
                            .map((datum, index) => { if (datum) { return index } })
                            .filter(x => typeof x !== "undefined");

                    // fill tempData object with data that's matched the filter
                    columnFilterSeed.forEach(index => {
                        Object.keys(pointData).forEach(property => {
                            tempData[propertyName][index] = pointData[propertyName][index];
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

