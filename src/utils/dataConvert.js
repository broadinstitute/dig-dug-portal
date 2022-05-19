let convertData = function (CONVERT, DATA) {
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

                    case "raw":
                        tempObj[c["field name"]] = d[c["raw field"]];
                        break;

                    case "score columns":
                        tempObj[c["field name"]] = scoreColumns(c["fields to score"], c["score by"], d);
                        break;
                }
            })

            convertedData.push(tempObj);
        });
    } else {
        convertedData = DATA;
    }

    return convertedData;
};


export default {
    convertData,
};
