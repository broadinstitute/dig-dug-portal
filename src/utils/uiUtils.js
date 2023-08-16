import parseUrl from "url-parse";

let popOutElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    element.classList.toggle("popped-out");
};

let hideElement = function (ELEMENT) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        element.classList.add("hidden");
    }
};

let showElement = function (ELEMENT, SEARCHBOX) {
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
let showHideSvg = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    if (!!element) {
        if (element.classList.contains("hidden-svg")) {
            showSvg(ELEMENT);
        } else {
            hideSvg(ELEMENT);
        }
    }
};
let showSvg = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    if (!!element) {
        element.classList.remove("hidden-svg");
    }
};
let hideSvg = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    if (!!element) {
        element.classList.add("hidden-svg");
    }
};
let showHideElement = function (ELEMENT, SEARCHBOX) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        if (element.classList.contains("hidden")) {
            showElement(ELEMENT, SEARCHBOX);
        } else {
            hideElement(ELEMENT);
        }
    }
};

let showHideHelpContent = function (ELEMENT) {
    let element = checkExist(ELEMENT);
    if (element.classList.contains("hidden")) {
        element.classList.remove("hidden");
    } else {
        element.classList.add("hidden");
    }
    getToolTipPosition(ELEMENT);
};

let getToolTipPosition = function (ELEMENT) {
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

let getOffset = function (ELEMENT) {
    let _x = 0;
    let _y = 0;
    while (ELEMENT && !isNaN(ELEMENT.offsetLeft) && !isNaN(ELEMENT.offsetTop)) {
        _x += ELEMENT.offsetLeft - ELEMENT.scrollLeft;
        _y += ELEMENT.offsetTop - ELEMENT.scrollTop;
        ELEMENT = ELEMENT.offsetParent;
    }
    return { top: _y, left: _x };
};

let switchViews = function (VIEWS, BUTTONTEXT) {
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

let switchPlotViews = function (VIEWS, BUTTONTEXT) {
    let x = VIEWS.length;
    var currentElement;

    for (let i = 0; i < x; i++) {
        let element = checkExist(VIEWS[i]);
        if (element.classList.contains("hidden-svg") == false) {
            element.classList.add("hidden-svg");
            currentElement = i + 1 == x ? 0 : i + 1;
        }
    }

    let celement = checkExist(VIEWS[currentElement]);
    event.target.innerHTML = BUTTONTEXT[currentElement];
    celement.classList.remove("hidden-svg");
};

let openPage = function (PAGE, PARAMETERS) {
    let redirectURL = "./" + PAGE + "?";

    for (let [key, value] of Object.entries(PARAMETERS)) {
        redirectURL += key + "=" + value + "&";
    }
    window.location.href = redirectURL;
};

let checkExist = function (ELEMENT) {
    var element = document.getElementById(ELEMENT);
    if (typeof element == "undefined" || element == null) {
        element = document.getElementsByClassName(ELEMENT)[0];
    }
    return element;
};

let showHideByClass = function (CLASS) {
    let element = document.getElementsByClassName(CLASS);
    let x = element.length;

    for (let i = 0; i <= x; i++) {
        element[i].classList.toggle("hidden");
    }
};

let onScroll = function (e) {
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

let convertJson2Csv = function (DATA, FILENAME) {
    console.log("j2c data", DATA);
    let topRows = [];
    let features = [];
    let fColumnKeys = []
    DATA.map(d => {
        for (let [key, value] of Object.entries(d)) {
            if (key != "features") {

                if (typeof value == "object" && !value.length) {
                    for (let [vKey, vValue] of Object.entries(value)) {
                        let headerKey = key + "__" + vKey;
                        if (!topRows.includes(headerKey)) {
                            topRows.push(headerKey);
                        }

                    }
                } else {
                    if (!topRows.includes(key)) {
                        topRows.push(key);
                    }
                }
            } else {
                for (let [fKey, fValue] of Object.entries(value)) {

                    if (!features.includes(fKey)) {
                        features.push(fKey);
                    }

                    for (let [fVKey, fVValue] of Object.entries(fValue[0])) {
                        let headerFKey = "features" + "__" + fKey + "__" + fVKey;

                        if (!fColumnKeys.includes(headerFKey)) {
                            fColumnKeys.push(headerFKey);
                        }

                    }
                }
            }
        }
    })


    console.log(topRows, features, fColumnKeys);
    let csvData = [];

    DATA.map(d => {


        let fMaxLength = null;

        features.map(f => {
            fMaxLength = !fMaxLength ? d.features[f].length : fMaxLength >= d.features[f].length ? fMaxLength : d.features[f].length;
        })

        console.log("fMaxLength", fMaxLength);

        for (let i = 0; i < fMaxLength; i++) {
            let dArr = [];

        }

    })
};

let convertJson2Csv2 = function (DATA, FILENAME) {
    const items = DATA;
    const downloadFilename = FILENAME || "download";
    const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    const csv = [
        header.join(","), // header row first
        ...items.map((row) =>
            header
                .map((fieldName) => JSON.stringify(row[fieldName], replacer))
                .join(",")
        ),
    ].join("\r\n");

    let downloadLink = document.createElement("a");
    let blob = new Blob(["\ufeff", csv]);
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = downloadFilename + ".csv"; //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

let saveJson = function (DATA, FILENAME) {
    const downloadFilename = FILENAME || "download";

    let downloadLink = document.createElement("a");
    let blob = new Blob(["\ufeff", JSON.stringify(DATA), null, 4]);
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = downloadFilename + ".json"; //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

let getAxisTicks = function (lo, hi) {
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

let showTabContent = function (TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER) {
    let tabList = document.querySelectorAll(
        ".kp-tabs#" + TAB_WRAPPER + " .kp-tab"
    );
    let contentList = document.querySelectorAll(
        ".kp-tabs-contents#" + CONTENT_WRAPPER + " .kp-tab-content"
    );

    for (let i = 0; i < tabList.length; i++) {
        tabList[i].classList.remove("active");
    }

    for (let i = 0; i < contentList.length; i++) {
        contentList[i].classList.remove("active");
    }

    document.getElementById(TAB).classList.add("active");
    document.getElementById(CONTENT).classList.add("active");
};

let removeOnMouseOut = function (BOXID, TIME) {
    let wrapper = document.getElementById(BOXID);
    setTimeout(function () {
        wrapper.classList.remove("fixed");
        wrapper.classList.add("hidden");
    }, TIME);
};

let isIdFixed = function (ID) {
    let element = document.querySelector(ID);

    let isFixed =
        !!element && element.getAttribute("class").includes("fixed") == true
            ? true
            : false;
    return isFixed;
};

function biDomain() {
    let url = parseUrl(window.location.href);

    let content =
        url.port == ""
            ? "https://bioindex.hugeamp.org"
            : "https://bioindex-dev.hugeamp.org";

    return content;
}

function getUrl() {
    let url = parseUrl(window.location.href);
    return url;
}

export default {
    popOutElement,
    hideElement,
    showElement,
    showHideElement,
    showHideSvg,
    showHideHelpContent,
    openPage,
    showHideByClass,
    switchViews,
    switchPlotViews,
    getToolTipPosition,
    onScroll,
    convertJson2Csv,
    saveJson,
    getAxisTicks,
    showTabContent,
    removeOnMouseOut,
    isIdFixed,
    biDomain,
    getUrl,
};
