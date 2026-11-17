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

    let applyConvert = function (d, CONVERT, PHENOTYPE_MAP) {
        let tempObj = {};

        CONVERT.map(c => {

            let cType = c.type;

            switch (cType) {
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
                    let string2Split = d[c["field to split"]];
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
                                let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e : (typeof e === 'number') ? e : d[e];
                                calcString += eValue;
                            });

                            tempObj[c["field name"]] = eval(calcString);
                            d[c["field name"]] = tempObj[c["field name"]];

                    }
                    break;
                case "js math":
                    let calFunc = c["method"];
                    tempObj[c["field name"]] = Math[calFunc](d[c["raw field"]]);
                    d[c["field name"]] = tempObj[c["field name"]];
                    break;

                case "raw":
                    let rawValue = (!!d[c["raw field"]]) ? d[c["raw field"]] : (!!c["if no value"]) ? c["if no value"] : null;
                    tempObj[c["field name"]] = rawValue;
                    d[c["field name"]] = tempObj[c["field name"]];
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

            }
        })
        return tempObj;
    }

    if (CONVERT != "no convert") {
        DATA.map(d => {

            let tempObj = applyConvert(d, CONVERT, PHENOTYPE_MAP);

            let dKeys = Object.keys(tempObj);

            let newTempObj = {};

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
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    var arrData = [[]];

    var arrMatches = null;


    while (arrMatches = objPattern.exec(strData)) {

        var strMatchedDelimiter = arrMatches[1];

        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            arrData.push([]);

        }

        var strMatchedValue;

        if (arrMatches[2]) {

            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {
            strMatchedValue = arrMatches[3];

        }


        arrData[arrData.length - 1].push(strMatchedValue);
    }

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
    object2Array
};
