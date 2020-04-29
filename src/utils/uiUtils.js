let popOutElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("popped-out");
}

let showHideElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("hidden");
};

let openPage = function (PAGE, PARAMETERS) {

    let redirectURL = "./" + PAGE + "?";

    for (let [key, value] of Object.entries(PARAMETERS)) {
        console.log(`${key}: ${value}`);
        redirectURL += key + "=" + value + "&";
    }
    window.location.href = redirectURL;
};

let checkExist = function (ELEMENT) {
    var element = document.getElementById(ELEMENT);
    if (typeof (element) == 'undefined' || element == null) {
        element = document.getElementsByClassName(ELEMENT)[0];
    }
    return element;
}

let showHideByClass = function (CLASS) {
    let elements = document.getElementsByClassName(CLASS);

    for (let i = 0; i < elements.length; i++) {
        let e = elements.item(i);

        if (!!e.classList) {
            e.classList.toggle("hidden");
        }
    }
}


export default {
    popOutElement,
    showHideElement,
    openPage,
    showHideByClass,
}
