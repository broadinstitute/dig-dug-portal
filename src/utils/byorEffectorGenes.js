/**
 * This is the module to get data from BYOR effector genes list page
 */

import dataConvert from "@/utils/dataConvert";

const getEglsList = function (phenotype) {
    let dataPoint =
        "https://hugeampkpncms.org/rest/data?pageid=egl_241";

    let contJson = await fetch(dataPoint).then((resp) => resp.json());
    let eglList = [];

    if (contJson.error == null) {
        let data = dataConvert.csv2Json(
            contJson[0]["field_data_points"]
        );

        data.map((e) => {
            if (
                !!e["Trait ID"] &&
                !!e["Trait ID"].includes(phenotype.name)
            ) {
                eglList.push(e);
            }
        });
    }

    return eglList;

}

export default {
    getEglsList,
};