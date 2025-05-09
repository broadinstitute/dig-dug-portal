let convertData = function (CONVERT, DATA, PHENOTYPE_MAP) {

    let convertedData = [];
    let joinValues = function (FIELDS, jBy, fData) {

        let fieldValue = "";
        let fieldsLength = FIELDS.length;

        for (let i = 0; i < fieldsLength; i++) {
            if (i < fieldsLength - 1) {
                fieldValue += fData[FIELDS[i]] + jBy;
            } else {
                fieldValue += fData[FIELDS[i]];
            }

        }
        return fieldValue;
    }

    let joinMultiValues = function (FIELDS, jBy, fData) {

        let fieldValue = "";
        let fieldsLength = FIELDS.length;

        for (let i = 0; i < fieldsLength; i++) {
            if (i < fieldsLength - 1) {
                fieldValue += fData[FIELDS[i]] + jBy[i];
            } else {
                fieldValue += fData[FIELDS[i]];
            }
        }

        if (jBy.length >= FIELDS.length) {
            let startIndex = jBy.length - ((jBy.length - FIELDS.length) + 1);
            for (let i = startIndex; i < jBy.length; i++) {
                fieldValue += jBy[i];
            }
        }
        return fieldValue;
    }

    let scoreColumns = function (FIELDS, scoreBy, fData) {

        let fieldValue = 0;
        let fieldsLength = FIELDS.length;

        FIELDS.map(fName => {
            let scoreType = scoreBy[fName].type;
            switch (scoreType) {
                case "boolean":
                    let value2Score = scoreBy[fName]["value to score"][fData[fName]];
                    fieldValue += value2Score;
                    break;
            }
        });

        return fieldValue / fieldsLength;
    }

    let formatLocus = function (CHR, START, END, fData) {
        let locus = fData[CHR] + ':';
        locus += Math.ceil((fData[START] + fData[END]) / 2);
        return locus;
    }

    let array2String = function (CONTENT, SEPARATOR) {
        let string = "";
        CONTENT.map(c => {
            string += c + SEPARATOR;
        })

        return string.slice(0, -1)
    }

    let getParameterByName = function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    let applyConvert = function (d, CONVERT, PHENOTYPE_MAP) {
        let tempObj = {};

        CONVERT.map(c => {

            let cType = c.type;

            let rawValue = (!!d[c["raw field"]]) ? d[c["raw field"]] : (!!c["if no value"]) ? c["if no value"] : null;

            if (d[c["raw field"]] === 0) {
                rawValue = "0";
            }

            switch (cType) {
                case "from parameter":
                    let param = c["parameter"];

                    tempObj[c["field name"]] = getParameterByName(param);

                    d[c["field name"]] = tempObj[c["field name"]];

                    break;

                case "sub to top":

                    let subList = d;

                    if (!!c["sub path"]) {
                        c["sub path"].map(path => {
                            subList = subList[path];
                        })
                    }

                    if (!!subList) {
                        let subRow;

                        if (!!c["copy by"]) {

                            switch (c["copy by"]) {

                                case "condition":

                                    if (c["condition"]["type"] == "equal to") {

                                        subList.map(row => {

                                            if (row[c["condition"]["field"]] == c["condition"]["value"]) {
                                                subRow = row
                                            }
                                        })
                                    }

                                    break;
                            }
                        }

                        tempObj[c["field name"]] = subRow[c["raw field"]];
                    }

                    break;

                case "join":
                    tempObj[c["field name"]] = joinValues(c["fields to join"], c["join by"], d);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "join multi":
                    tempObj[c["field name"]] = joinMultiValues(c["fields to join"], c["join by"], d);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "split":

                    let newFields = c["field name"];
                    let newFieldValues = [];
                    let string2Split = (!!tempObj[c["field to split"]]) ? tempObj[c["field to split"]] : d[c["field to split"]];

                    if (!!string2Split) {
                        let loopIndex = 1;
                        c["split by"].map(s => {

                            let [key, ...rest] = string2Split.split(s);
                            string2Split = rest.join(s)

                            if (loopIndex < c["split by"].length) {
                                newFieldValues.push(key)
                            } else if (loopIndex = c["split by"].length) {
                                newFieldValues.push(key)
                                newFieldValues.push(rest.join(s))
                            }
                            loopIndex++;
                        })

                        loopIndex = 0;
                        newFields.map(f => {
                            tempObj[f] = newFieldValues[loopIndex];
                            d[f] = tempObj[f];

                            loopIndex++;
                        })

                        //console.log(tempObj);
                    }



                    break;

                case "get locus":
                    tempObj[c["field name"]] = formatLocus(c["chromosome"], c["start"], c["end"], d);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "calculate":

                    let calType = c["calculation type"];

                    switch (calType) {
                        case "-log10":
                            tempObj[c["field name"]] = -Math.log10(d[c["raw field"]]);
                            d[c["field name"]] = tempObj[c["field name"]];
                            break;

                        case "math":

                            let calcString = "";

                            c["expression"].map(e => {
                                let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e : (typeof e === 'number') ? e :
                                    (!!tempObj[e] || tempObj[e] === 0) ? (tempObj[e] === 0) ? 0 : tempObj[e] : (d[e] === 0) ? 0 : d[e];
                                calcString += eValue;
                            });

                            tempObj[c["field name"]] = eval(calcString);


                            if ((!!c['min number'] || c['min number'] === 0) && tempObj[c["field name"]] < c['min number']) {

                                tempObj[c["field name"]] = c['min number']
                            }

                            if ((!!c['max number'] || c['max number'] === 0) && tempObj[c["field name"]] > c['max number']) {
                                tempObj[c["field name"]] = c['max number']
                            }

                            d[c["field name"]] = tempObj[c["field name"]];

                    }
                    break;
                case "js math":
                    let calFunc = c["method"];
                    tempObj[c["field name"]] = Math[calFunc](d[c["raw field"]]);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "raw":

                    if (!!rawValue) {
                        tempObj[c["field name"]] = rawValue;
                        d[c["field name"]] = tempObj[c["field name"]];
                    }

                    break;

                case "map name":

                    tempObj[c["field name"]] = c["map"][rawValue];

                    break;

                case "string to number":
                    tempObj[c["field name"]] = Number(d[c["raw field"]]);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "score columns":
                    tempObj[c["field name"]] = scoreColumns(c["fields to score"], c["score by"], d);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "array to string":
                    tempObj[c["field name"]] = array2String(d[c["raw field"]], c["separate by"]);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "string to array":
                    let sArray = d[c["raw field"]].split(c["separate by"]);

                    let takeIndex = (c["take index"] === 0 || !!c["take index"]) ? sArray[c["take index"]] : null;

                    if (takeIndex) {
                        tempObj[c["field name"]] = sArray[c["take index"]]
                    } else {
                        tempObj[c["field name"]] = sArray
                    }
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "replace characters":
                    let replaceArr = c["replace"]
                    let rawString = d[c["raw field"]];
                    let newString = "";
                    let sIndex = 0;

                    replaceArr.map(r => {

                        newString = (sIndex == 0) ? rawString : newString;

                        if (!!rawString) {
                            newString = newString.replaceAll(r.from, r.to);
                        }
                        sIndex++;
                    })

                    tempObj[c["field name"]] = newString;
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "kp phenotype name":

                    let pID = d[c["raw field"]]

                    tempObj[c["field name"]] = (!!PHENOTYPE_MAP[pID] ? PHENOTYPE_MAP[pID].description : pID);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "boolean to string":
                    let value = d[c["raw field"]] === true || d[c["raw field"]] == 1 ? "true" :
                        d[c["raw field"]] === false || d[c["raw field"]] === 0 ? "false" : ""

                    tempObj[c["field name"]] = value;

                    break;

                case "phenotype probability": /// this is only for CFDE mouse 2 human phenotype mapping feature

                    let background = (!!c["rare"].includes(d[c["group"]])) ? 0.005 : (!!c["common"].includes(d[c["group"]])) ? 0.05 : 0;
                    let beta = d[c["beta"]];

                    let probability = Math.exp(beta + Math.log(background / (1 - background))) / (1 + Math.exp(beta + Math.log(background / (1 - background))));

                    tempObj[c["field name"]] = probability;


                    break;

            }
        })
        return tempObj;
    }

    let flatten = (obj, path = '') => {
        if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj };

        return Object.keys(obj).reduce((output, key) => {
            return obj instanceof Array ?
                { ...output, ...flatten(obj[key], path + '[' + key + '].') } :
                { ...output, ...flatten(obj[key], path + key + '.') };
        }, {});
    }

    if (CONVERT != "no convert") {
        let data2Rows = CONVERT.filter(c => c.type == "data to rows");

        if (data2Rows.length > 0) {

            let rowsData = [];
            data2Rows.map(f => {
                DATA.map(d => {
                    let row = d[f["raw field"]];
                    let orgList = f["group by"];

                    if (!!row) {
                        let rowData = {};
                        orgList.map((field, fIndex) => {
                            rowData[field] = [];
                            rowData["_key" + fIndex] = []
                        })
                        // first, flatten data, then get the list of flatten keys
                        let flattenRow = flatten(row);
                        let flattenKeys = Object.keys(flattenRow);

                        flattenKeys.map(key => {
                            orgList.map((field, fIndex) => {
                                if (!!key.includes(field)) {
                                    rowData[field].push(flattenRow[key]);
                                    rowData["_key" + fIndex].push(key)
                                }
                            })
                        })



                        let rowsLength = rowData[orgList[0]].length;

                        for (let i = 0; i < rowsLength; i++) {
                            let tempObj = {};
                            orgList.map((field, fIndex) => {
                                tempObj[field] = rowData[field][i];
                                tempObj["_key" + fIndex] = rowData["_key" + fIndex][i];
                            })

                            rowsData.push(tempObj);
                        }
                    }
                })
            })

            DATA = rowsData;
        }



        DATA.map(d => {

            let tempObj = applyConvert(d, CONVERT, PHENOTYPE_MAP);

            // Apply data convert to feature data level
            let dKeys = Object.keys(tempObj);

            let newTempObj = {};

            // here is the problem
            dKeys.map((dKey) => {
                if (
                    typeof tempObj[dKey] == "object" &&
                    (Array.isArray(tempObj[dKey]) == true && tempObj[dKey].length > 0)
                ) {

                    let tempArr = [];

                    tempObj[dKey].map((fd) => {
                        if (typeof fd == "object" && Array.isArray(fd) == false) {

                            let tempFDObj = applyConvert(
                                fd,
                                CONVERT,
                                PHENOTYPE_MAP
                            );
                            tempArr.push(tempFDObj);
                        }
                    });

                    newTempObj[dKey] = tempArr;
                } else {
                    newTempObj[dKey] = tempObj[dKey];
                }
            });

            convertedData.push(tempObj);
        });
    } else {
        convertedData = DATA;
    }

    return convertedData;
};

let csv2Json = function (DATA) {

    let csvArr = CSVToArray(DATA, ",");


    let jsonHeader = csvArr[0]
    csvArr.shift();

    let jsonData = []

    csvArr.map(i => {
        if (i.length > 1) {
            let tempObj = {};

            for (let h = 0; h < i.length; h++) {

                tempObj[jsonHeader[h]] = (testNumber(i[h]) == true) ? Number(i[h]) : breakLines(i[h]);
            }
            jsonData.push(tempObj);
        }
    });


    return jsonData;
};

let tsv2Json = function (DATA) {
    const lines = DATA.split('\n');
    const headers = lines.shift().split('\t');
    const jsonArray = [];
    const ifNumber = (str) => {
        return !isNaN(str) && str.trim() !== '' ? Number(str) : str;
    }
    lines.forEach(line => {
        const values = line.split('\t');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = ifNumber(values[index]);
        });
        jsonArray.push(obj);
    });
    return jsonArray;
}

let flatJson = function (DATA) {

    /// first wrap values with comma

    let wrappedData = []

    DATA.map(row => {

        let wrappedObj = {}

        for (const [dKey, dValue] of Object.entries(row)) {

            if (typeof dValue == 'string' && dValue.includes(',')) {
                wrappedObj[dKey] = '"' + dValue + '"';
            } else if (typeof dValue == 'object') {

                let obj2Sting = JSON.stringify(dValue)

                obj2Sting = obj2Sting.replaceAll('"', '');

                if (obj2Sting.includes(',')) {

                    obj2Sting = '"' + obj2Sting + '"';
                }

                wrappedObj[dKey] = obj2Sting;
            }
            else {
                wrappedObj[dKey] = dValue;
            }

        }
        wrappedData.push(wrappedObj);
    })

    let flatJson = [];

    wrappedData.map(row => {
        let flatObj = flatten(row);
        flatJson.push(flatObj);
    })

    return flatJson;

}

let flatten = function (obj, path = '') {
    if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj };

    return Object.keys(obj).reduce((output, key) => {
        return obj instanceof Array ?
            { ...output, ...flatten(obj[key], path + '[' + key + '].') } :
            { ...output, ...flatten(obj[key], path + key + '.') };
    }, {});
}

let testNumber = function (STR) {
    let reg = /^-?[\d.]+(?:e-?\d+)?$/;
    return reg.test(STR);
}

let breakLines = function (STR) {
    if (!!STR) {
        let cleanText = STR.replaceAll("\n", "<br>");
        return cleanText;
    }
}

let CSVToArray = function (strData, strDelimiter) {
    strDelimiter = (strDelimiter || ",");

    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
};

const object2Array = function (DATASET, COMPARECONFIG, KEY) {
    let arrayedObject = [];
    let groupField = COMPARECONFIG["fields to compare"][0];
    let comapredF = COMPARECONFIG["fields to compare"];

    for (const [dKey, dValue] of Object.entries(DATASET)) {

        let groups = Object.keys(dValue[groupField]);

        groups.map(group => {

            let tempObj = {};

            for (const [iKey, iValue] of Object.entries(dValue)) {
                if (!!comapredF.includes(iKey)) {
                    tempObj[iKey] = iValue[group]
                } else {
                    tempObj[iKey] = iValue
                }
            }
            arrayedObject.push(tempObj)
        })
    }
    return arrayedObject;
}


export default {
    convertData,
    csv2Json,
    tsv2Json,
    object2Array,
    flatJson
};
