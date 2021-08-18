let sort = function (data, key, isNumeric, isAscending) {
    return data.sort(function (a, b) {
        var x = a[key].toLowerCase();
        var y = b[key].toLowerCase();

        if (isNumeric) {
            x = Number(x.replace(/\,/g, ""));
            y = Number(y.replace(/\,/g, ""));
        }

        if (isAscending) {
            return x < y ? -1 : x > y ? 1 : 0;
        } else {
            return x > y ? -1 : x < y ? 1 : 0;
        }
    });
}

let sortEGLTableData = function (data, key, isNumeric, isAscending) {
    let hasObjectField = false;
    for (const [key, value] of Object.entries(
        data[0]
    )) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            hasObjectField = true;
        }
    }

    let sortingData;

    if (hasObjectField == true) {

        sortingData = data;
        return sortingData.sort(function (a, b) {
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

    } else {
        sortingData = data;
        return sortingData.sort(function (a, b) {
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

export default {
    sort,
    sortEGLTableData,
    uniqBy,
}
