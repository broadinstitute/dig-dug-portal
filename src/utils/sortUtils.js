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

    let direction = (isAscending) ? "asc" : "desc";

    if (isNumeric) {
        return sortArrOfObjects(data, key, 'number', direction)
    } else {
        let withNumbers = [];
        let withStrings = [];
        let withNoValue = [];

        data.map(d => {
            if (!d[key]) {
                withNoValue.push(d)
            } else {
                console.log("d[key]: ", d[key], typeof d[key])
                if (typeof d[key] == "number" || d[key] === 0) {
                    withNumbers.push(d);
                } else if (typeof d[key] == "string") {
                    withStrings.push(d);
                }
            }
        })

        let wNumbersSorted = sortArrOfObjects(withNumbers, key, 'number', direction)
        let wStringsSorted = sortArrOfObjects(withStrings, key, 'alphabetical', direction)

        if (direction == "asc") {
            return wNumbersSorted.concat(wStringsSorted).concat(withNoValue);
        } else {
            return wStringsSorted.concat(wNumbersSorted).concat(withNoValue);
        }
    }

}

const sortLocusField = (data, key, isAscending) => {
    let direction = (isAscending) ? "asc" : "desc";

    data.map(function (g) {
        let locusArr = g[key].split(":");
        let chrNum = locusArr[0].trim();
        let bpNum;
        if (!!locusArr[1]) {
            bpNum =
                locusArr[1].includes("-") == true
                    ? (Number(locusArr[1].split("-")[0].trim()) +
                        Number(
                            locusArr[1].split("-")[1].trim()
                        )) /
                    2
                    : Number(locusArr[1]);
        } else {
            bpNum = 0;
        }

        g["chr"] =
            chrNum != "X" && chrNum != "Y"
                ? Number(chrNum)
                : chrNum == "X"
                    ? 23
                    : 24;

        g["bp"] = bpNum;
    });

    sortEGLTableData(data, "bp", true, direction);
    sortEGLTableData(
        data,
        "chr",
        true,
        direction
    );
    return data;
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
    sortLocusField,
    uniqBy,
    sortArrOfObjects,
}
