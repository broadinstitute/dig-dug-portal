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

    if (CONVERT != "no convert") {
        DATA.map(d => {
            let tempObj = d;
            CONVERT.map(c => {

                let cType = c.type;


                switch (cType) {
                    case "join":
                        tempObj[c["field name"]] = joinValues(c["fields to join"], c["join by"], d);
                        break;

                    case "join multi":
                        tempObj[c["field name"]] = joinMultiValues(c["fields to join"], c["join by"], d);
                        break;

                    case "split":

                        let newFields = c["field name"];
                        let newFieldValues = [];
                        let string2Split = d;
                        let loopIndex = 1;
                        c["split by"].map(s => {

                            let splittedValue = string2Split.split(s)

                            if (loopIndex < c["split by"].length) {
                                newFieldValues.push(splittedValue[0])
                                splittedValue = splittedValue[1]
                            } else if (loopIndex = c["split by"].length) {
                                newFieldValues.push(splittedValue[0])
                                newFieldValues.push(splittedValue[1])
                            }
                            loopIndex++;
                        })

                        loopIndex = 0;

                        newFields.map(f => {
                            tempObj[f] = newFieldValues[loopIndex];
                            loopIndex++;
                        })

                        break;

                    case "get locus":
                        tempObj[c["field name"]] = formatLocus(c["chromosome"], c["start"], c["end"], d);
                        break;

                    case "calculate":

                        let calType = c["calculation type"];

                        switch (calType) {
                            case "-log10":
                                tempObj[c["field name"]] = -Math.log10(d[c["raw field"]]);
                                break;
                        }
                        break;
                    case "js math":
                        let calFunc = c["method"];
                        tempObj[c["field name"]] = Math[calFunc](d[c["raw field"]]);
                        break;

                    case "raw":
                        tempObj[c["field name"]] = d[c["raw field"]];
                        break;

                    case "string to number":
                        tempObj[c["field name"]] = Number(d[c["raw field"]]);
                        break;

                    case "score columns":
                        tempObj[c["field name"]] = scoreColumns(c["fields to score"], c["score by"], d);
                        break;

                    case "array to string":
                        tempObj[c["field name"]] = array2String(d[c["raw field"]], c["separate by"]);
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
                        break;

                    case "kp phenotype name":

                        let pID = d[c["raw field"]]

                        tempObj[c["field name"]] = (!!PHENOTYPE_MAP[pID] ? PHENOTYPE_MAP[pID].description : pID);
                        break;

                }
            })

            convertedData.push(tempObj);
        });
    } else {
        convertedData = DATA;
    }

    console.log("convertedData", convertedData)

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


export default {
    convertData,
    csv2Json,
};
