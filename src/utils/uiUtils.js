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
    console.log(CLASS);
    let element = document.getElementsByClassName(CLASS);
    let x = element.length;

    console.log(x);
    for (let i = 0; i <= x; i++) {
        element[i].classList.toggle("hidden");
    }
};


export default {
    popOutElement,
    showHideElement,
    openPage,
    showHideByClass,
}
