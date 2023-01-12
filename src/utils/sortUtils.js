let sort = function (data, key, isNumeric, isAscending) {
    return data.sort(function (a, b) {
        let x = (isNumeric) ? a[key] : a[key].toLowerCase();
        let y = (isNumeric) ? b[key] : b[key].toLowerCase();

        if (isNumeric) {
            if (typeof x == 'string') {
                x = Number(x.replace(/\,/g, ""));
            }

            if (typeof y == 'string') {
                y = Number(y.replace(/\,/g, ""));
            }
        }

        if (isAscending) {
            return x < y ? -1 : x > y ? 1 : 0;
        } else {
            return x > y ? -1 : x < y ? 1 : 0;
        }
    });
}

let sortEGLTableData = function (data, key, isNumeric, isAscending) {
    return data.sort(function (a, b) {
        let A = (isNumeric) ? a[key] : a[key].toLowerCase();
        let B = (isNumeric) ? b[key] : b[key].toLowerCase();

        let comparison = 0;
        if (A > B) {
            comparison = 1;
        } else if (A < B) {
            comparison = -1;
        }

        return (isAscending) ? (isNumeric) ? (comparison * -1) : comparison : (isNumeric) ? comparison : (comparison * -1);

    });
}

const uniqBy = (arr, predicate) => {
    const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];

    return [...arr.reduce((map, item) => {
        const key = (item === null || item === undefined) ?
            item : cb(item);

        map.has(key) || map.set(key, item);

        return map;
    }, new Map()).values()];
};

/// Sort array of objects by a property (data, property, sorting value type, direction)
const sortArrOfObjects = (DATA, PRPT, TYPE, DIRECTION) => {

    let sorted;
    if (TYPE == 'number') {
        sorted = (DIRECTION == "asc") ? DATA.sort((a, b) => a[PRPT] - b[PRPT]) :
            DATA.sort((a, b) => b[PRPT] - a[PRPT]);
    }

    if (TYPE == 'alphabetical') {
        sorted = (DIRECTION == "asc") ? DATA.sort((a, b) => (a[PRPT] > b[PRPT]) ? 1 : ((b[PRPT] > a[PRPT]) ? -1 : 0)) :
            DATA.sort((a, b) => (a[PRPT] < b[PRPT]) ? 1 : ((b[PRPT] < a[PRPT]) ? -1 : 0));
    }

    return sorted;
}

export default {
    sort,
    sortEGLTableData,
    uniqBy,
    sortArrOfObjects,
}
