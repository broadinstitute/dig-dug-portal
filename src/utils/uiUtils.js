let popOutElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("popped-out");
}

let showHideElement = function (ELEMENT) {
    console.log("wwwwww");
    let element = checkExist(ELEMENT);
    element.classList.toggle("hidden");
};

let checkExist = function (ELEMENT) {
    var element = document.getElementById(ELEMENT);
    if (typeof (element) == 'undefined' || element == null) {
        element = document.getElementsByClassName(ELEMENT)[0];
    }
    return element;
}


export default {
    popOutElement,
    showHideElement,
}
