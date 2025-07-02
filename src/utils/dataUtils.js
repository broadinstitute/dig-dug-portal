let buildSummary = function (DATA, TYPES) {
    let summary = {};

    TYPES.forEach(type => {
        // types can be 'extream value sampling', 'group sampling'
        /* example config
        [{
            "type": "extream value sampling",
            "key": "column name",
            "direction":
        }
        }]
        */
        switch (type.type) {
            case 'extream value sampling':
                let summary = buildExtreamValueSampling(DATA);

                if (summary['sampling']) {
                    if (!!summary['sampling'][key]) {

                    }

                    break;
            case 'box':
                summary[type] = {};
                break;
        }
    });


    return summary;
}

export default {
    buildSummary,
};