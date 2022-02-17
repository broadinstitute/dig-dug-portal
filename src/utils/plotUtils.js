import Formatters from "@/utils/formatters.js";

var colors = ["#007bff75",
    "#04884575",
    "#8490C875",
    "#BF61A575",
    "#EE312475",
    "#FCD70075",
    "#5555FF75",
    "#7aaa1c75",
    "#9F78AC75",
    "#F8808475",
    "#F5A4C775",
    "#CEE6C175",
    "#cccc0075",
    "#6FC7B675",
    "#D5A76875",
    "#d4d4d475"]


var renderDot = function (CTX, XPOS, YPOS, DOT_COLOR) {
    CTX.fillStyle = DOT_COLOR;
    CTX.lineWidth = 0;
    CTX.beginPath();
    CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);
    CTX.fill();
}

var connectDots = function (CTX, X1, Y1, X2, Y2, COLOR) {
    CTX.beginPath();
    CTX.lineWidth = 1;
    CTX.strokeStyle = COLOR;
    CTX.moveTo(X1, Y1);
    CTX.lineTo(X2, Y2);
    CTX.stroke();
}

const renderLine = function (
    CTX,
    WIDTH,
    HEIGHT,
    MARGIN,
    DIRECTION,
    TICK_NUM,
    DATA,
    MIN,
    MAX
) {

    CTX.beginPath();
    CTX.lineWidth = 0.5;
    //CTX.strokeStyle = "#000000";
    CTX.font = "12px Arial";
    //CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where


    var dataGroupKeys = {};

    for (const [key, value] of Object.entries(DATA)) {
        dataGroupKeys[key] = [];
        for (const [vKey, vValue] of Object.entries(value)) {
            dataGroupKeys[key].push(vKey);
        }
    }


    var dataLength = null;

    for (const [key, value] of Object.entries(dataGroupKeys)) {
        dataLength = (dataLength == null) ? value.length : (value > dataLength) ? value.length : dataLength;
    }


    var valueBump = (MAX - MIN) / TICK_NUM;
    var max = Math.round(MAX + valueBump);
    var min = Math.round(MIN - valueBump);

    switch (DIRECTION) {
        case "x":
            var xStep = (WIDTH - MARGIN.left - MARGIN.right) / dataLength;

            let vIndex = 0

            for (const [key, value] of Object.entries(DATA)) {

                let hIndex = 0;
                CTX.strokeStyle = colors[vIndex];
                CTX.fillStyle = colors[vIndex];

                let previousX = null;
                let previousY = null;

                for (const [vKey, vValue] of Object.entries(value)) {
                    let xPos1 = MARGIN.left + hIndex * xStep;
                    let xPos2 = MARGIN.left + (hIndex + 1) * xStep;
                    let xPos = xPos1 + ((xPos2 - xPos1) / 2);

                    let yPos = ((vValue - min) / (max - min)) * (HEIGHT - MARGIN.top - MARGIN.bottom);

                    renderDot(CTX, xPos, yPos, colors[vIndex]);

                    if (previousX != null && previousY != null) {
                        connectDots(CTX, xPos, yPos, previousX, previousY, colors[vIndex]);
                    }

                    previousX = xPos;
                    previousY = yPos;

                    hIndex++;
                }
                vIndex++;
            }

            break;

        case "y":
            break;
    }

}

const renderPie = function (CTX, DATA, WIDTH, HEIGHT) {
    var lastend = - Math.PI / 2;
    var valueTotal = 0; // Automatically calculated so don't touch
    var dataKeys = Object.keys(DATA);
    var w = WIDTH / 2
    var h = HEIGHT / 2
    var r = h / 2

    for (const [key, value] of Object.entries(DATA)) {
        valueTotal += value;
    }

    for (var i = 0; i < dataKeys.length; i++) {
        CTX.fillStyle = colors[i % colors.length];
        CTX.strokeStyle = 'white';
        CTX.lineWidth = 1;
        CTX.beginPath();
        CTX.moveTo(w, h);
        // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
        CTX.arc(
            w,
            h,
            h,
            lastend,
            lastend + Math.PI * 2 * (DATA[dataKeys[i]] / valueTotal),
            false
        );
        CTX.lineTo(w, h);
        CTX.fill();
        CTX.stroke();

        CTX.fillStyle = '#000000';
        CTX.textAlign = "center";
        CTX.textBaseline = "middle";

        let len = (DATA[dataKeys[i]] / valueTotal) * 2 * Math.PI
        let mid = lastend + len / 2
        let x = w + Math.cos(mid) * (h / 1.5);
        let y = h + Math.sin(mid) * (h / 1.5)

        CTX.font = "12px Arial";
        CTX.fillText(dataKeys[i], x, y - 7);

        CTX.font = "14px Arial";
        CTX.fillText(DATA[dataKeys[i]], x, y + 7);

        lastend += Math.PI * 2 * (DATA[dataKeys[i]] / valueTotal);
    }
}

const renderBars = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, TICK_NUM, DATA, MIN, MAX, SPACER, COLORS) {

    CTX.beginPath();
    CTX.lineWidth = 0.5;
    CTX.strokeStyle = "#000000";
    CTX.font = "12px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where


    let dataKeys = Object.keys(DATA);
    let dataLength = dataKeys.length;
    let barWidth = (WIDTH - MARGIN.left - MARGIN.right - (SPACER * (dataLength + 1))) / dataLength;
    var valueBump = (MAX - MIN) / TICK_NUM;
    var max = Math.round(MAX + valueBump);
    var min = Math.round(MIN - valueBump);

    switch (DIRECTION) {
        case "x":
            let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right - (SPACER * 2)) / dataLength;

            for (let i = 0; i < dataLength; i++) {
                let tickXPos1 = (MARGIN.left + SPACER) + i * xTickDistance;
                let tickXPos2 = (MARGIN.left + SPACER) + (i + 1) * xTickDistance;
                let tickXPos = tickXPos1 + ((tickXPos2 - tickXPos1) / 2);
                let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line

                CTX.fillStyle = (COLORS == "single") ? colors[0] : colors[i % colors.length];

                let barHeight = ((DATA[dataKeys[i]] - min) / (max - min)) * (HEIGHT - MARGIN.top - MARGIN.bottom);
                CTX.fillRect(adjTickXPos - (barWidth / 2), HEIGHT - MARGIN.bottom - barHeight, barWidth, barHeight
                );

                CTX.font = "14px Arial";
                CTX.fillStyle = "#000000";

                CTX.fillText(
                    DATA[dataKeys[i]],
                    adjTickXPos,
                    HEIGHT - MARGIN.bottom - barHeight - MARGIN.bump
                );
            }
            break;
        case "y":
            break;
    }

}

const renderTicksByKeys = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, KEYS, SPACER) {
    CTX.beginPath();
    CTX.lineWidth = 0.5;
    CTX.strokeStyle = "#000000";
    CTX.font = "12px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":

            let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right - (SPACER * 2)) / KEYS.length;

            for (let i = 0; i < KEYS.length; i++) {
                let tickXPos1 = (MARGIN.left + SPACER) + i * xTickDistance;
                let tickXPos2 = (MARGIN.left + SPACER) + (i + 1) * xTickDistance;
                let tickXPos = tickXPos1 + ((tickXPos2 - tickXPos1) / 2);
                let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                CTX.moveTo(
                    adjTickXPos,
                    HEIGHT - MARGIN.bottom
                );
                CTX.lineTo(
                    adjTickXPos,
                    HEIGHT - MARGIN.bottom + MARGIN.bump
                );
                CTX.stroke();

                CTX.textAlign = "center";
                let positionLabel = KEYS[i];

                CTX.fillText(
                    positionLabel,
                    adjTickXPos,
                    HEIGHT - MARGIN.bottom + (MARGIN.bump * 4)
                );
            }
            break;
        case "y":

            let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom - (SPACER * 2)) / KEYS.length;

            for (let i = 0; i < KEYS.length; i++) {
                let tickYPos1 = (MARGIN.top + SPACER) + i * yTickDistance;
                let tickYPos2 = (MARGIN.top + SPACER) + (i + 1) * yTickDistance;
                let tickYPos = tickYPos1 + ((tickYPos2 - tickYPos1) / 2);
                let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                CTX.moveTo(

                    MARGIN.left,
                    adjTickYPos
                );
                CTX.lineTo(
                    MARGIN.left - MARGIN.bump,
                    adjTickYPos
                );
                CTX.stroke();

                CTX.textAlign = "right";
                let positionLabel = KEYS[i];

                CTX.fillText(
                    positionLabel,
                    MARGIN.left - (MARGIN.bump * 2),
                    adjTickYPos + 3,
                );
            }
            break;
    }
}

const renderAxis = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, WITH_TICKS, MIN, MAX) {
    //CTX, WIDTH, HEIGHT, MARGIN(left,right,top,bottom,bump in number), DIRECTION(x or y), 
    // WITH_TICKS(number of thicks. null for none), MIN, MAX


    CTX.beginPath();
    CTX.lineWidth = 0.5;
    CTX.strokeStyle = "#000000";
    CTX.font = "12px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":
            // render x axis
            CTX.moveTo(MARGIN.left, HEIGHT - MARGIN.bottom);
            CTX.lineTo(WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom);
            CTX.stroke();

            if (WITH_TICKS != null) {
                // X ticks
                let xStep = (MAX - MIN) / WITH_TICKS;
                let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right) / WITH_TICKS;

                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickXPos = MARGIN.left + i * xTickDistance;
                    let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                    CTX.moveTo(
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom
                    );
                    CTX.lineTo(
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom + MARGIN.bump
                    );
                    CTX.stroke();

                    CTX.textAlign = "center";
                    let positionLabel =
                        i < WITH_TICKS
                            ? Math.round(MIN + i * xStep)
                            : Math.round(MAX);

                    CTX.fillText(
                        positionLabel,
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom + (MARGIN.bump * 4)
                    );
                }
            }
            break;
        case "y":
            // render y axis
            CTX.moveTo(MARGIN.left, MARGIN.top);
            CTX.lineTo(MARGIN.left, HEIGHT - MARGIN.bottom);
            CTX.stroke();

            if (WITH_TICKS != null) {
                var valueBump = (MAX - MIN) / WITH_TICKS;

                var max = Math.round(MAX + valueBump);
                var min = Math.round(MIN - valueBump);

                // render Y ticks
                let yStep = (max - min) / WITH_TICKS;
                let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickYPos = MARGIN.top + i * yTickDistance;
                    let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                    CTX.moveTo(MARGIN.left, adjTickYPos);
                    CTX.lineTo(MARGIN.left - MARGIN.bump, adjTickYPos);
                    CTX.stroke();

                    CTX.textAlign = "right";

                    let tickValue =
                        i == WITH_TICKS
                            ? min
                            : Formatters.floatFormatter(
                                max - i * yStep
                            );

                    CTX.fillText(
                        tickValue,
                        MARGIN.left - MARGIN.bump * 2,
                        adjTickYPos + 3
                    );
                }
            }
            break;
    }

};

const renderGuideLine = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, WITH_TICKS, MIN, MAX) {
    //CTX, WIDTH, HEIGHT, MARGIN(left,right,top,bottom,bump in number), DIRECTION(x or y), 
    // WITH_TICKS(number of thicks. null for none), MIN, MAX


    CTX.beginPath();
    CTX.lineWidth = 0.5;
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":
            if (WITH_TICKS != null) {

                let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickXPos = MARGIN.left + i * xTickDistance;
                    let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                    CTX.moveTo(adjTickXPos, MARGIN.top);
                    CTX.lineTo(adjTickXPos, HEIGHT - MARGIN.bottom);
                    CTX.strokeStyle = "#cccccc"
                    CTX.stroke();
                }
            }
            break;
        case "y":

            if (WITH_TICKS != null) {

                let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickYPos = MARGIN.top + i * yTickDistance;
                    let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                    CTX.moveTo(MARGIN.left, adjTickYPos);
                    CTX.lineTo(WIDTH - MARGIN.right, adjTickYPos);
                    CTX.strokeStyle = "#cccccc"
                    CTX.stroke();
                }
            }
            break;
    }

};



export default {
    renderAxis,
    renderTicksByKeys,
    renderBars,
    renderPie,
    renderGuideLine,
    renderLine
};
