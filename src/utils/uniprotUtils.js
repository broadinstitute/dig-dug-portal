

function traverse_it(obj) {
    for (let prop in obj) {
        if (typeof obj[prop] == 'object') {
            // object
            traverse_it(obj[prop[i]]);
        } else {
            // something else
            alert('The value of ' + prop + ' is ' + obj[prop] + '.');
        }
    }
}

function traverseUniprotObject(obj) {
    let listOfMaps = []
    for (let i in obj) {
        let innerMap = {}
        innerMap[obj[i].name] = _.get(obj[i], 'elements', 'text');
        for (let j in innerMap.values) {
            
        }
        console.log(innerMap)
        listOfMaps.push(innerMap)
    }
    return listOfMaps
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}



export default {
    traverseUniprotObject,
    getElementByXpath
}

