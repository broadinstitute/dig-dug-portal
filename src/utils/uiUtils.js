let popOutElement = function(ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("popped-out");
};

let hideElement = function(ELEMENT) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        element.classList.add("hidden");
    }
};

let showElement = function(ELEMENT, SEARCHBOX) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        element.classList.remove("hidden");

        if (!!SEARCHBOX) {
            let searchInput = checkExist(SEARCHBOX);

            if (!!searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    }
};

let showHideElement = function(ELEMENT, SEARCHBOX) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        if (element.classList.contains("hidden")) {
            showElement(ELEMENT, SEARCHBOX);
        } else {
            hideElement(ELEMENT);
        }
    }
};

let showHideHelpContent = function(ELEMENT) {
    let element = checkExist(ELEMENT);
    if (element.classList.contains("hidden")) {
        element.classList.remove("hidden");
    } else {
        element.classList.add("hidden");
    }
    getToolTipPosition(ELEMENT);
};

let getToolTipPosition = function(ELEMENT) {
    let caller = document.getElementsByClassName(ELEMENT)[0];
    let viewer = document.getElementById(ELEMENT);
    let intViewportWidth = window.innerWidth;
    let elementWidth = viewer.offsetWidth;

    let location = getOffset(caller);

    let elementLeft =
        location.left > intViewportWidth - elementWidth
            ? -elementWidth + "px"
            : "1.0em";

    viewer.style.setProperty("left", elementLeft);
    /*
        console.log(ELEMENT);
        console.log(" intViewportWidth: " + intViewportWidth);
        console.log(" elementWidth: " + elementWidth);
        console.log(" locatin.left: " + location.left);
        */
};

let getOffset = function(ELEMENT) {
    let _x = 0;
    let _y = 0;
    while (ELEMENT && !isNaN(ELEMENT.offsetLeft) && !isNaN(ELEMENT.offsetTop)) {
        _x += ELEMENT.offsetLeft - ELEMENT.scrollLeft;
        _y += ELEMENT.offsetTop - ELEMENT.scrollTop;
        ELEMENT = ELEMENT.offsetParent;
    }
    return { top: _y, left: _x };
};

let switchViews = function(VIEWS, BUTTONTEXT) {
    let x = VIEWS.length;
    var currentElement;

    for (let i = 0; i < x; i++) {
        let element = checkExist(VIEWS[i]);
        if (element.classList.contains("hidden") == false) {
            element.classList.add("hidden");
            currentElement = i + 1 == x ? 0 : i + 1;
        }
    }

    let celement = checkExist(VIEWS[currentElement]);
    event.target.innerHTML = BUTTONTEXT[currentElement];
    celement.classList.remove("hidden");
};

let openPage = function(PAGE, PARAMETERS) {
    let redirectURL = "./" + PAGE + "?";

    for (let [key, value] of Object.entries(PARAMETERS)) {
        redirectURL += key + "=" + value + "&";
    }
    window.location.href = redirectURL;
};

let checkExist = function(ELEMENT) {
    var element = document.getElementById(ELEMENT);
    if (typeof element == "undefined" || element == null) {
        element = document.getElementsByClassName(ELEMENT)[0];
    }
    return element;
};

let showHideByClass = function(CLASS) {
    let element = document.getElementsByClassName(CLASS);
    let x = element.length;

    for (let i = 0; i <= x; i++) {
        element[i].classList.toggle("hidden");
    }
};

let onScroll = function(e) {
    let windowTop = window.top.scrollY;

    let element = document.getElementsByClassName("search-header")[0];
    if (windowTop > this.tableTop) {
        if (!element.classList.contains("fixed-header")) {
            element.classList.add("fixed-header");
        }
    } else {
        if (element.classList.contains("fixed-header")) {
            element.classList.remove("fixed-header");
        }
    }
};

let convertJson2Csv = function(DATA, FILENAME) {
    const items = DATA;
    const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    const csv = [
        header.join(","), // header row first
        ...items.map(row =>
            header
                .map(fieldName => JSON.stringify(row[fieldName], replacer))
                .join(",")
        )
    ].join("\r\n");

    let downloadLink = document.createElement("a");
    let blob = new Blob(["\ufeff", csv]);
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = FILENAME + ".csv"; //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

let getAxisTicks = function(lo, hi) {
    let step = 10 ** (Math.round(Math.log10(hi - lo)) - 1);
    let value = (Math.floor((lo + step) / step) - 1) * step;
    let halfStep = step / 2;
    //console.log("step", step, "half", halfStep);
    let ticks = {};
    // update the actual lo to be the initial value
    lo = value;
    // adjust the step so there's only 5 ticks
    step =
        Math.floor(
            ((Math.floor((hi - value) / step) / 5) * step + halfStep) / halfStep
        ) * halfStep;
    // adjust the hi value to extend to the next step if needed
    hi = Math.floor((hi + halfStep) / step) * step;
    do {
        ticks[value] = (value - lo) / (hi - lo);
        value += step;
    } while (value <= hi + halfStep);
    return { lo, hi, step, ticks };
};

export default {
    popOutElement,
    hideElement,
    showElement,
    showHideElement,
    showHideHelpContent,
    openPage,
    showHideByClass,
    switchViews,
    getToolTipPosition,
    onScroll,
    convertJson2Csv,
    getAxisTicks
};
