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

let addRemoveClass = function (ELEMENT, CLASS) {
    let element = checkExist(ELEMENT);

    if (!!element) {
        if (element.classList.contains(CLASS)) {
            element.classList.remove(CLASS);
        } else {
            element.classList.add(CLASS);
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

let saveByorCsv = function (DATA, FILENAME) {
    let topRows = [];
    let features = {};
    const downloadFilename = FILENAME || "download";

    DATA.map((d) => {
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
                    if (!features[fKey]) {
                        features[fKey] = [];
                    }

                    for (let [fVKey, fVValue] of Object.entries(fValue[0])) {
                        if (!features[fKey].includes(fVKey)) {
                            features[fKey].push(fVKey);
                        }
                    }
                }
            }
        }
    });

    let csvData = [];

    if (Object.keys(features).length > 0) {
        DATA.map((d) => {
            for (let [fKey, fValue] of Object.entries(features)) {
                for (let i = 0; i < d.features[fKey].length; i++) {
                    let dArr = [];

                    topRows.map((t) => {
                        let path = t.split("__");
                        if (path.length == 2) {
                            let cValue =
                                d[path[0]][path[1]] !== null
                                    ? d[path[0]][path[1]] === 0
                                        ? 0
                                        : d[path[0]][path[1]]
                                    : "";
                            dArr.push(cValue);
                        } else {
                            let cValue =
                                d[path[0]] !== null
                                    ? d[path[0]] === 0
                                        ? 0
                                        : d[path[0]]
                                    : "";
                            dArr.push(cValue);
                        }
                    });

                    for (let [fRKey, fRValue] of Object.entries(features)) {
                        if (fRKey == fKey) {
                            features[fRKey].map((cKey) => {
                                dArr.push(d.features[fRKey][i][cKey]);
                            });
                        } else {
                            features[fRKey].map((cKey) => {
                                dArr.push("");
                            });
                        }
                    }
                    csvData.push(dArr);
                }
            }
        });
    } else if (Object.keys(features).length == 0) {
        DATA.map((d) => {
            let dArr = [];
            topRows.map((t) => {
                let path = t.split("__");
                if (path.length == 2) {
                    let cValue =
                        d[path[0]][path[1]] !== null
                            ? d[path[0]][path[1]] === 0
                                ? 0
                                : d[path[0]][path[1]]
                            : "";
                    dArr.push(cValue);
                } else {
                    let cValue =
                        d[path[0]] !== null
                            ? d[path[0]] === 0
                                ? 0
                                : d[path[0]]
                            : "";
                    dArr.push(cValue);
                }
            });
            csvData.push(dArr);
        });
    }

    let header = topRows;

    for (let [fKey, fValue] of Object.entries(features)) {
        fValue.map((fCKey) => {
            header.push("feature__" + fKey + "__" + fCKey);
        });
    }

    let csv = [
        header.join(","), // header row first
        ...csvData.map((row) => row.join(",")),
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

let saveByorTsv = function (DATA, FILENAME) {
    let topRows = [];
    let features = {};
    const downloadFilename = FILENAME || "download";

    DATA.map((d) => {
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
                    if (!features[fKey]) {
                        features[fKey] = [];
                    }

                    for (let [fVKey, fVValue] of Object.entries(fValue[0])) {
                        if (!features[fKey].includes(fVKey)) {
                            features[fKey].push(fVKey);
                        }
                    }
                }
            }
        }
    });

    let csvData = [];

    if (Object.keys(features).length > 0) {
        DATA.map((d) => {
            for (let [fKey, fValue] of Object.entries(features)) {
                for (let i = 0; i < d.features[fKey].length; i++) {
                    let dArr = [];

                    topRows.map((t) => {
                        let path = t.split("__");
                        if (path.length == 2) {
                            let cValue =
                                d[path[0]][path[1]] !== null
                                    ? d[path[0]][path[1]] === 0
                                        ? 0
                                        : d[path[0]][path[1]]
                                    : "";
                            dArr.push(cValue);
                        } else {
                            let cValue =
                                d[path[0]] !== null
                                    ? d[path[0]] === 0
                                        ? 0
                                        : d[path[0]]
                                    : "";
                            dArr.push(cValue);
                        }
                    });

                    for (let [fRKey, fRValue] of Object.entries(features)) {
                        if (fRKey == fKey) {
                            features[fRKey].map((cKey) => {
                                dArr.push(d.features[fRKey][i][cKey]);
                            });
                        } else {
                            features[fRKey].map((cKey) => {
                                dArr.push("");
                            });
                        }
                    }
                    csvData.push(dArr);
                }
            }
        });
    } else if (Object.keys(features).length == 0) {
        DATA.map((d) => {
            let dArr = [];
            topRows.map((t) => {
                let path = t.split("__");
                if (path.length == 2) {
                    let cValue =
                        d[path[0]][path[1]] !== null
                            ? d[path[0]][path[1]] === 0
                                ? 0
                                : d[path[0]][path[1]]
                            : "";
                    dArr.push(cValue);
                } else {
                    let cValue =
                        d[path[0]] !== null
                            ? d[path[0]] === 0
                                ? 0
                                : d[path[0]]
                            : "";
                    dArr.push(cValue);
                }
            });
            csvData.push(dArr);
        });
    }

    let header = topRows;

    for (let [fKey, fValue] of Object.entries(features)) {
        fValue.map((fCKey) => {
            header.push("feature__" + fKey + "__" + fCKey);
        });
    }

    let csv = [
        header.join("\t"), // header row first
        ...csvData.map((row) => row.join("\t")),
    ].join("\r\n");

    let downloadLink = document.createElement("a");
    let blob = new Blob(["\ufeff", csv]);
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = downloadFilename + ".tsv"; //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

let convertJson2Csv = function (DATA, FILENAME) {
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

const convertJson2Tsv = function (DATA, FILENAME) {
    const items = DATA;
    const downloadFilename = FILENAME || "download";
    const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    const tsv = [
        header.join("\t"), // header row first
        ...items.map((row) =>
            header
                .map((fieldName) => JSON.stringify(row[fieldName], replacer))
                .join("\t")
        ),
    ].join("\r\n");

    let downloadLink = document.createElement("a");
    let blob = new Blob(["\ufeff", tsv]);
    let url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = downloadFilename + ".tsv"; //Name the file here
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

function checkIfNumeric(VALUE) {
    let checkNumbers = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "e",
        "E",
        "-",
        ".",
    ];
    let ifNumber = true;

    if (typeof VALUE == "string") {
        VALUE.split("").map((d) => {
            if (!checkNumbers.includes(d)) {
                ifNumber = false;
            }
        });
    }

    return ifNumber;
}

let setTabActive = function (
    TARGETTAB,
    UIWRAPPERID,
    TARGETCONTENT,
    CONTENTWRAPPERID,
    IF_PLOT
) {
    // Set IF_PLOT parameter true if function calling tab is in Plots group
    let tabsWrapper = document.getElementById(UIWRAPPERID),
        tabsChildren = tabsWrapper.getElementsByClassName("tab-ui-tab");
    for (let i = 0; i < tabsChildren.length; i++) {
        let tab = tabsChildren[i];
        let classes = tab.getAttribute("class");

        classes.includes("loading")
            ? tab.setAttribute("class", "tab-ui-tab loading")
            : tab.setAttribute("class", "tab-ui-tab");
    }

    document
        .getElementById(TARGETTAB)
        .setAttribute("class", "tab-ui-tab active");

    let contentsWrapper = document.getElementById(CONTENTWRAPPERID),
        contentsChildren = !!IF_PLOT
            ? contentsWrapper.getElementsByClassName("plot-tab-content-wrapper")
            : contentsWrapper.getElementsByClassName("tab-content-wrapper");
    for (let i = 0; i < contentsChildren.length; i++) {
        let tab = contentsChildren[i];
        !!IF_PLOT
            ? tab.setAttribute(
                "class",
                "plot-tab-content-wrapper hidden-content"
            )
            : tab.setAttribute("class", "tab-content-wrapper hidden-content");
    }

    !!IF_PLOT
        ? document
            .getElementById(TARGETCONTENT)
            .setAttribute("class", "plot-tab-content-wrapper")
        : document
            .getElementById(TARGETCONTENT)
            .setAttribute("class", "tab-content-wrapper");
};

let toggleFixedSummarySection = function (UIWRAPPERID) {
    const tabsGroup = document
        .getElementById(UIWRAPPERID)
        .closest(".tabgroup-fixed-bottom");
    if (tabsGroup.classList.contains("open")) {
        tabsGroup.classList.remove("open");
    } else {
        tabsGroup.classList.add("open");
        tabsGroup
            .querySelector(".fixed-group-toggle")
            .classList.remove("has-updates");
    }
};

let showHidePanel = function (PANEL) {
    console.log(PANEL);
    let wrapper = document.querySelector(PANEL);
    if (wrapper.classList.contains("hidden")) {
        wrapper.classList.remove("hidden");
    } else {
        wrapper.classList.add("hidden");
    }
};

let downloadImg = function (ID, name, type, svgImage) {

    let imgElement = document.getElementById(ID)
    let link = document.createElement('a');
    let dataURL;

    if (type == 'svg') {
        //ref.renderBoxPlot(); // firstly, render the svg image

        let newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let attributesToCopy = ["width", "height", "viewBox"];
        for (const attr of attributesToCopy) {
            if (imgElement.hasAttribute(attr)) {
                newSVG.setAttribute(attr, imgElement.getAttribute(attr));
            }
        }

        for (const child of imgElement.children) {
            if (child.nodeName.toLowerCase() !== "script") {
                newSVG.appendChild(child.cloneNode(true));
            }
        }

        let svgData = new XMLSerializer().serializeToString(newSVG);

        dataURL = new Blob([svgData], { type: "image/svg+xml" });

    } else if (type == 'png') {

        dataURL = imgElement.toDataURL("image/png");
    }
    link.href = (type == 'svg') ? URL.createObjectURL(dataURL) : dataURL;
    link.download = (type == 'svg') ? name + '.svg' : name + ".png";
    link.click();
    URL.revokeObjectURL(link.href);

    if (type == 'svg') {
        let svgImg = document.getElementById(svgImage);
        svgImg.remove();
    }
}

let downloadChart = function (URL, FILENAME) {
    // Create a link element and programmatically click it to start the download
    const link = document.createElement("a");
    link.href = URL;
    link.download = FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

let copy2Clipboard = function (CONTENT) {
    window.navigator.clipboard.writeText(CONTENT);
}

let copyCanvasToDiv = function (CANVAS, divId, title) {

    // Get the canvas element
    const canvasId = CANVAS.id;
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas element with ID '" + canvasId + "' not found.");
        return;
    }

    // Get the div element
    const div = document.getElementById(divId + '_wrapper');
    if (!div) {
        console.error("Div element with ID '" + divId + "' not found.");
        return;
    } else {
        //Create a wrapper div to hold the image
        const wrapperId = canvasId + "_wrapper"
        let imgWrapper = document.getElementById(wrapperId);
        if (!imgWrapper) {
            imgWrapper = document.createElement('div');
            imgWrapper.setAttribute("id", wrapperId);
        }
        imgWrapper.innerHTML = "";

        /*
        const titleWrapper = document.createElement('div');
        titleWrapper.innerHTML = "<h6>" + title + "</h6>"

        imgWrapper.appendChild(titleWrapper)

        */

        // Create a temporary canvas to hold the image data. This is important to avoid issues with modifying the original canvas.
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Convert the canvas content to a data URL (PNG by default)
        const dataURL = tempCanvas.toDataURL(); // Or toDataURL('image/jpeg', 0.9); for JPEG with quality 0.9

        // Create an image element
        const img = document.createElement('img');
        img.setAttribute("width", CANVAS.width);
        img.setAttribute("height", CANVAS.height);
        img.src = dataURL;
        img.alt = "Canvas Image"; // Set an alt attribute for accessibility

        // Clear the wrapper's content and append the image.  This removes any existing content in the div.

        imgWrapper.appendChild(img);

        div.innerHTML = "";

        div.appendChild(imgWrapper);
    }

}

let moveElement = function (element, destinationDivId) {
    // Get the element
    const ELEMENT = document.getElementById(element);
    if (!ELEMENT) {
        console.error("Element with ID '" + element + "' not found.");
        return;
    }
    // Get the source and destination divs
    //const sourceDiv = document.getElementById(sourceDivId);
    const destinationDiv = document.getElementById(destinationDivId);

    // Check if the element is already a child of the destination div
    if (ELEMENT.parentNode === destinationDiv) {
        console.warn("Element is already in the destination div.");
        return; // Or you could optionally move it back to the source
    }

    // Remove the element from its current parent (if it has one)
    if (ELEMENT.parentNode) {
        ELEMENT.parentNode.removeChild(ELEMENT);
    }

    // Append the element to the destination div
    destinationDiv.appendChild(ELEMENT);

}

export default {
    addRemoveClass,
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
    convertJson2Tsv,
    saveByorCsv,
    saveByorTsv,
    saveJson,
    getAxisTicks,
    showTabContent,
    removeOnMouseOut,
    isIdFixed,
    biDomain,
    getUrl,
    checkIfNumeric,
    setTabActive,
    toggleFixedSummarySection,
    showHidePanel,
    downloadImg,
    downloadChart,
    copy2Clipboard,
    copyCanvasToDiv,
    moveElement
};
