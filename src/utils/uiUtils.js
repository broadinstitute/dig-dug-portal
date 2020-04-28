let popOutElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("popped-out");
}

let showHideElement = function (ELEMENT, SEARCHBOX) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("hidden");
    if (element.classList.contains("hidden") == false && SEARCHBOX != null) {
        let searchInput = checkExist(SEARCHBOX);
        searchInput.focus();
    }
};

let switchViews = function (VIEWS) {
    let x = VIEWS.length;
    var currentElement;

    for (let i = 0; i < x; i++) {
        let element = checkExist(VIEWS[i]);
        if (element.classList.contains("hidden") == false) {
            element.classList.add("hidden");
            currentElement = (i + 1 == x) ? 0 : i + 1;
        };
    }

    let celement = checkExist(VIEWS[currentElement]);
    celement.classList.remove("hidden");
}

let openPage = function (PAGE, PARAMETERS) {

    let redirectURL = "./" + PAGE + "?";

    for (let [key, value] of Object.entries(PARAMETERS)) {
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

    let element = document.getElementsByClassName(CLASS);
    let x = element.length;

    for (let i = 0; i <= x; i++) {
        element[i].classList.toggle("hidden");
    }
};


export default {
    popOutElement,
    showHideElement,
    openPage,
    showHideByClass,
    switchViews,
}
