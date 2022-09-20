let content = {};

async function loadData(URL, DOMAIN, CONTINUE) {
    let jsonContent = await fetch(URL).then((resp) =>
        resp.json()
    );

    if (jsonContent.error == null) {

        if (Object.keys(content).length == 0) {
            content == jsonContent;
        }

        return jsonContent;
        /*if (!!jsonContent.continuation) {
            let dataArr = content.data
            let continueURL = DOMAIN + 
            loadData(continueURL, DOMAIN, CONTINUE)
        } else {

            if (content == null) {

            } else {

            }
        }*/
    }
}

function joinDataArr(DATA) {
    let newContent = content.data.concat(DATA);

    return newContent;
}

export default {
    loadData
};
