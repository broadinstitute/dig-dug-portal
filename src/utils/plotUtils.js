import Formatters from "@/utils/formatters.js";

let colors = ["#007bff75",
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


let renderDot = function (CTX, XPOS, YPOS, DOT_COLOR) {
    CTX.fillStyle = DOT_COLOR;
    CTX.lineWidth = 0;
    CTX.beginPath();
    CTX.arc(XPOS, YPOS, 8, 0, 2 * Math.PI);
    CTX.fill();
}

let connectDots = function (CTX, X1, Y1, X2, Y2, COLOR) {
    CTX.beginPath();
    CTX.lineWidth = 2;
    CTX.strokeStyle = COLOR;
    CTX.moveTo(X1, Y1);
    CTX.lineTo(X2, Y2);
    CTX.stroke();
}

let renderDashedLine = function (CTX, X1, Y1, X2, Y2, WIDTH, COLOR, DASH) {

    CTX.beginPath();
    CTX.lineWidth = !!WIDTH ? WIDTH : 2;
    CTX.strokeStyle = !!COLOR ? COLOR : "#FFAA00";
    let dash = !!DASH ? DASH : [20, 10];
    CTX.setLineDash(dash);
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
    MAX,
    DATA_LABEL
) {

    CTX.beginPath();
    CTX.lineWidth = 1;
    //CTX.strokeStyle = "#000000";
    CTX.font = "24px Arial";
    //CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where


    let dataGroupKeys = {};

    for (const [key, value] of Object.entries(DATA)) {
        dataGroupKeys[key] = [];
        for (const [vKey, vValue] of Object.entries(value)) {
            dataGroupKeys[key].push(vKey);
        }
    }


    let dataLength = null;

    for (const [key, value] of Object.entries(dataGroupKeys)) {
        dataLength = (dataLength == null) ? value.length : (value > dataLength) ? value.length : dataLength;
    }


    //let valueBump = (MAX - MIN) / TICK_NUM;
    let max = Math.ceil(MAX);
    let min = Math.floor(MIN);

    switch (DIRECTION) {
        case "x":
            let xStep = (WIDTH - MARGIN.left - MARGIN.right) / dataLength;
            let yStep = (HEIGHT - MARGIN.top - MARGIN.bottom) / (max - min);
            let yStart = HEIGHT - MARGIN.bottom;

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

                    let yPos = yStart - ((vValue - min) * yStep);

                    renderDot(CTX, xPos, yPos, colors[vIndex]);

                    if (previousX != null && previousY != null) {
                        connectDots(CTX, xPos, yPos, previousX, previousY, colors[vIndex]);
                    }

                    if (hIndex == 0) {


                        let lXPos, lYPos
                        if (!!DATA_LABEL) {
                            CTX.font = "28px Arial";
                            lXPos = xStep + MARGIN.left, lYPos = (20 * vIndex) + MARGIN.top + 28;
                            renderDot(CTX, lXPos, lYPos, colors[vIndex]);

                            lXPos += 20, lYPos += 10;

                        } else {
                            CTX.font = "24px Arial";
                            lXPos = xPos, lYPos = yPos - 14;
                        }

                        CTX.fillStyle = "#000000";
                        CTX.textAlign = "start";

                        CTX.fillText(key, lXPos, lYPos);
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

const renderPie = function (CTX, DATA, WIDTH, HEIGHT, COLOR) {
    let lastend = - Math.PI / 2;
    let valueTotal = 0; // Automatically calculated so don't touch
    let dataKeys = Object.keys(DATA);
    let w = WIDTH / 2
    let h = HEIGHT / 2
    let r = h / 2

    for (const [key, value] of Object.entries(DATA)) {
        valueTotal += value;
    }

    for (let i = 0; i < dataKeys.length; i++) {
        CTX.fillStyle = (COLOR == "single") ? colors[0] : colors[i % colors.length];
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

        CTX.font = "24px Arial";
        CTX.fillText(dataKeys[i], x, y - 14);

        CTX.font = "28px Arial";
        CTX.fillText(DATA[dataKeys[i]], x, y + 14);

        lastend += Math.PI * 2 * (DATA[dataKeys[i]] / valueTotal);
    }
}

const renderBars = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, TICK_NUM, DATA, MIN, MAX, SPACER, COLORS) {

    CTX.beginPath();
    CTX.lineWidth = 0.5;
    CTX.strokeStyle = "#000000";
    CTX.font = "24px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where


    let dataKeys = Object.keys(DATA);
    let dataLength = dataKeys.length;
    let barWidth = (WIDTH - MARGIN.left - MARGIN.right - (SPACER * (dataLength + 1))) / dataLength;
    //let valueBump = (MAX - MIN) / TICK_NUM;
    let max = Math.ceil(MAX);
    let min = Math.floor(MIN);

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

                CTX.font = "28px Arial";
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

const renderTicksByKeys = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, KEYS, SPACER, L_ANGLE) {
    CTX.beginPath();
    CTX.lineWidth = 1;
    CTX.strokeStyle = "#000000";
    CTX.font = "24px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":

            let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right - (SPACER * 2)) / KEYS.length;

            for (let i = 0; i < KEYS.length; i++) {
                let tickXPos1 = (MARGIN.left + SPACER) + i * xTickDistance;
                let tickXPos2 = (MARGIN.left + SPACER) + (i + 1) * xTickDistance;
                let tickXPos = tickXPos1 + ((tickXPos2 - tickXPos1) / 2);
                let adjTickXPos = Math.floor(tickXPos);
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
                if (L_ANGLE == null) {

                    CTX.fillText(
                        positionLabel,
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom + (MARGIN.bump * 4)
                    );

                } else {

                    CTX.save();
                    CTX.translate(adjTickXPos, HEIGHT - MARGIN.bottom + (MARGIN.bump * 4) - 12);
                    CTX.rotate((L_ANGLE * -Math.PI) / 180);
                    CTX.textAlign = "end";
                    CTX.fillText(positionLabel, 0, 0);
                    CTX.restore();
                }

            }
            break;
        case "y":

            let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom - (SPACER * 2)) / KEYS.length;

            for (let i = 0; i < KEYS.length; i++) {
                let tickYPos1 = (MARGIN.top + SPACER) + i * yTickDistance;
                let tickYPos2 = (MARGIN.top + SPACER) + (i + 1) * yTickDistance;
                let tickYPos = tickYPos1 + ((tickYPos2 - tickYPos1) / 2);
                let adjTickYPos = Math.floor(tickYPos);
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
                    adjTickYPos + 6,
                );
            }
            break;
    }
}

const renderAxis = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, WITH_TICKS, MIN, MAX) {

    let max = MAX;
    let min = MIN;
    let maxMinGap = max - min
    let decimal = maxMinGap <= 1 ? 2 : maxMinGap <= 10 ? 1 : 0;

    CTX.beginPath();
    CTX.lineWidth = 1;
    CTX.strokeStyle = "#000000";
    CTX.font = "24px Arial";
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
                let xStep = (max - min) / WITH_TICKS;
                let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right) / WITH_TICKS;

                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickXPos = MARGIN.left + i * xTickDistance;
                    let adjTickXPos = Math.floor(tickXPos);
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
                            ? Formatters.decimalFormatter(min + i * xStep, decimal)
                            : Formatters.decimalFormatter(max, decimal);

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

                let valueBump = (max - min) / WITH_TICKS;

                //max = Math.ceil(max + valueBump);
                //min = Math.floor(min - valueBump);

                // render Y ticks
                let yStep = (max - min) / WITH_TICKS;
                let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickYPos = MARGIN.top + i * yTickDistance;
                    let adjTickYPos = Math.floor(tickYPos);
                    CTX.moveTo(MARGIN.left, adjTickYPos);
                    CTX.lineTo(MARGIN.left - MARGIN.bump, adjTickYPos);
                    CTX.stroke();

                    CTX.textAlign = "right";

                    let tickValue =
                        i == WITH_TICKS
                            ? Formatters.decimalFormatter(min, decimal)
                            : Formatters.decimalFormatter(
                                max - i * yStep, decimal);

                    CTX.fillText(
                        tickValue,
                        MARGIN.left - MARGIN.bump * 2,
                        adjTickYPos + 6
                    );
                }
            }
            break;
    }

};

const renderAxisWBump = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, WITH_TICKS, MIN, MAX, LABEL) {
    //CTX, WIDTH, HEIGHT, MARGIN(left,right,top,bottom,bump in number), DIRECTION(x or y), 
    // WITH_TICKS(number of thicks. null for none), MIN, MAX

    let max = MAX;
    let min = MIN;
    let maxMinGap = max - min
    let decimal = maxMinGap <= HEIGHT / 100 ? 2 : maxMinGap <= HEIGHT / 10 ? 1 : 0;

    CTX.beginPath();
    CTX.lineWidth = 1;
    CTX.strokeStyle = "#000000";
    CTX.font = "24px Arial";
    CTX.fillStyle = "#000000";
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":
            // render x axis
            CTX.moveTo(MARGIN.left - MARGIN.bump, HEIGHT + MARGIN.bump - MARGIN.bottom);
            CTX.lineTo(WIDTH + MARGIN.bump - MARGIN.right, HEIGHT + MARGIN.bump - MARGIN.bottom);
            CTX.stroke();

            if (WITH_TICKS != null) {
                // X ticks
                let xStep = (max - min) / WITH_TICKS;
                let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right) / WITH_TICKS;

                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickXPos = MARGIN.left + i * xTickDistance;
                    let adjTickXPos = Math.floor(tickXPos); // .5 is needed to render crisp line
                    CTX.moveTo(
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom + MARGIN.bump
                    );
                    CTX.lineTo(
                        adjTickXPos,
                        (HEIGHT - MARGIN.bottom) + (MARGIN.bump * 2)
                    );
                    CTX.stroke();

                    CTX.textAlign = "center";

                    let positionLabel =
                        i < WITH_TICKS
                            ? Formatters.decimalFormatter(min + i * xStep, decimal)
                            : Formatters.decimalFormatter(max, decimal);

                    CTX.fillText(
                        positionLabel,
                        adjTickXPos,
                        HEIGHT - MARGIN.bottom + (MARGIN.bump * 5)
                    );
                }
            }

            if (LABEL != null) {
                let labelXPos = WIDTH / 2;
                let labelYPos = HEIGHT - (MARGIN.bump * 2);
                CTX.font = "24px Arial";
                CTX.fillStyle = "#000000";
                CTX.save();
                CTX.textAlign = "center";
                CTX.fillText(LABEL, labelXPos, labelYPos);
                CTX.restore();
            }
            break;
        case "y":
            // render y axis
            CTX.moveTo(MARGIN.left - MARGIN.bump, MARGIN.top - MARGIN.bump);
            CTX.lineTo(MARGIN.left - MARGIN.bump, HEIGHT + MARGIN.bump - MARGIN.bottom);
            CTX.stroke();

            if (WITH_TICKS != null) {

                // render Y ticks
                let yStep = (max - min) / WITH_TICKS;
                let yTickDistance = (HEIGHT - MARGIN.top - MARGIN.bottom) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickYPos = MARGIN.top + i * yTickDistance;
                    let adjTickYPos = Math.floor(tickYPos); // .5 is needed to render crisp line
                    CTX.moveTo(MARGIN.left - MARGIN.bump, adjTickYPos);
                    CTX.lineTo(MARGIN.left - MARGIN.bump * 2, adjTickYPos);
                    CTX.stroke();

                    CTX.textAlign = "right";

                    let tickValue =
                        i == WITH_TICKS
                            ? Formatters.decimalFormatter(min, decimal)
                            :
                            Formatters.decimalFormatter(max - i * yStep, decimal)
                        ;



                    CTX.fillText(
                        tickValue,
                        MARGIN.left - MARGIN.bump * 3,
                        adjTickYPos + 6
                    );
                }
            }

            if (LABEL != null) {
                let labelXPos = 30;
                let labelYPos = MARGIN.top + ((HEIGHT - MARGIN.top - MARGIN.bottom) / 2);
                CTX.font = "24px Arial";
                CTX.fillStyle = "#000000";
                CTX.save();
                CTX.translate(labelXPos, labelYPos);
                CTX.rotate((90 * -Math.PI) / 180);
                CTX.textAlign = "center";
                CTX.fillText(LABEL, 0, 0);
                CTX.restore();
            }
            break;
    }

};

const renderGuideLine = function (CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, WITH_TICKS, MIN, MAX) {


    CTX.beginPath();
    CTX.lineWidth = 1;
    CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

    switch (DIRECTION) {
        case "x":
            if (WITH_TICKS != null) {

                let xTickDistance = (WIDTH - MARGIN.left - MARGIN.right) / WITH_TICKS;
                for (let i = 0; i <= WITH_TICKS; i++) {
                    let tickXPos = MARGIN.left + i * xTickDistance;
                    let adjTickXPos = Math.floor(tickXPos);
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
                    let adjTickYPos = Math.floor(tickYPos);
                    CTX.moveTo(MARGIN.left, adjTickYPos);
                    CTX.lineTo(WIDTH - MARGIN.right, adjTickYPos);
                    CTX.strokeStyle = "#cccccc"
                    CTX.stroke();
                }
            }
            break;
    }

};

const renderStar = function (CTX, CX, CY, SPIKES, OR, IR, SCOLOR, FCOLOR) {
    let rot = Math.PI / 2 * 3;
    let x = CX;
    let y = CY;
    let step = Math.PI / SPIKES;

    CTX.beginPath();
    CTX.moveTo(CX, CY - OR)
    for (let i = 0; i < SPIKES; i++) {
        x = CX + Math.cos(rot) * OR;
        y = CY + Math.sin(rot) * OR;
        CTX.lineTo(x, y)
        rot += step

        x = CX + Math.cos(rot) * IR;
        y = CY + Math.sin(rot) * IR;
        CTX.lineTo(x, y)
        rot += step
    }
    CTX.lineTo(CX, CY - OR);
    CTX.closePath();
    CTX.lineWidth = 1;
    CTX.strokeStyle = SCOLOR;
    CTX.stroke();
    CTX.fillStyle = FCOLOR;
    CTX.fill();
}


const renderDots = function (CTX, WIDTH, HEIGHT, MARGIN, XMIN, XMAX, YMIN, YMAX, COLOR, DATA) {

    let plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    let plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    let xStep = plotWidth / (XMAX - XMIN);
    let yStep = plotHeight / (YMAX - YMIN);

    DATA.map(d => {
        let xVal = d.xValue ? d.xValue : d.x;
        let yVal = d.yValue ? d.yValue : d.y;
        let xPos = MARGIN.left + (xStep * (xVal - XMIN));
        let yPos = MARGIN.top + (plotHeight - (yVal - YMIN) * yStep)
        renderDot(CTX, xPos, yPos, COLOR);
    })
}

const renderBestFitLine = function (CTX, WIDTH, HEIGHT, MARGIN, XMIN, XMAX, YMIN, YMAX, COLOR, DATA) {
    //x,y must have same amount of data points
    //x,y cannot contain missing values

    //calculate best fit line
    const sum = [0, 0, 0, 0];
    let len = DATA.length;

    for (let n = 0; n < len; n++) {
        sum[0] += DATA[n].xValue;                   //x
        sum[1] += DATA[n].yValue;                   //y
        sum[2] += DATA[n].xValue * DATA[n].xValue;  //x^2
        sum[3] += DATA[n].xValue * DATA[n].yValue;  //x*y
    }

    const meanX = sum[0] / len;
    const meanY = sum[1] / len;
    const slope = (sum[3] - (sum[0] * meanY)) / (sum[2] - (sum[0] * meanX));
    const intcp = meanY - (slope * meanX);
    const sX = XMIN;
    const sY = slope * sX + intcp;
    const eX = XMAX;
    const eY = slope * eX + intcp

    //calculate line start/end coordinates based on plot dimentions
    let plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    let plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    let xStep = plotWidth / (XMAX - XMIN);
    let yStep = plotHeight / (YMAX - YMIN);

    const startX = MARGIN.left + (xStep * (sX - XMIN));
    const startY = MARGIN.top + (plotHeight - (sY - YMIN) * yStep);
    const endX = MARGIN.left + (xStep * (eX - XMIN));
    const endY = MARGIN.top + (plotHeight - (eY - YMIN) * yStep);

    //check if color is dimmed
    const dimmed = COLOR.length > 7 ? Number(COLOR.slice(-2)) < 20 ? true : false : false;

    //we're going to draw a black line, with colored dots at the ends
    //but since dot colors have transparency, the line overlaps the dots
    //we need to calculate the direction of the line
    //so we can shorten it without affecting its position
    // Calculate vector from start to end
    const dx = endX - startX;
    const dy = endY - startY;
    // Calculate unit vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const udx = dx / length;
    const udy = dy / length;
    // Calculate new start position
    const amountToSubtract = 8;
    const newStartX = startX + udx * amountToSubtract;
    const newStartY = startY + udy * amountToSubtract;

    //draw the line
    CTX.strokeStyle = dimmed ? '#00000005' : '#000000';
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.moveTo(newStartX, newStartY);
    CTX.lineTo(endX, endY);
    CTX.stroke();

    //draw dot at the start
    CTX.beginPath();
    CTX.arc(startX, startY, 10, 0, 2 * Math.PI);
    CTX.fillStyle = COLOR; //COLOR.substring(0, COLOR.length-2);
    CTX.fill();
    CTX.stroke();
}

const getDotsPosData = function (WIDTH, HEIGHT, MARGIN, XMIN, XMAX, YMIN, YMAX, DATA) {

    let posData = {}
    let plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    let plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    let xStep = plotWidth / (XMAX - XMIN);
    let yStep = plotHeight / (YMAX - YMIN);

    DATA.map(d => {
        let xVal = d.xValue;
        let yVal = d.yValue;

        let xPos = MARGIN.left + (xStep * (xVal - XMIN));
        let yPos = MARGIN.top + (plotHeight - (yVal - YMIN) * yStep)

        if (!posData[Math.round(yPos / 2)]) {
            posData[Math.round(yPos / 2)] = {};
        }
        if (!posData[Math.round(yPos / 2)][Math.round(xPos / 2)]) {
            posData[Math.round(yPos / 2)][Math.round(xPos / 2)] =
                [];
        }
        posData[Math.round(yPos / 2)][Math.round(xPos / 2)].push(
            { "key": d.key, "hover": d.hover }
        );
    })

    return posData;

}

const getDotsInPos = function (X, Y, DATA) {

    let dotsList = [];

    for (let h = -5; h <= 5; h++) {
        for (let v = -5; v <= 5; v++) {
            if (DATA[Y + h] != undefined) {
                if (DATA[Y + h][X + v] != undefined) {
                    dotsList = dotsList.concat(DATA[Y + h][X + v]);
                }
            }
        }
    }

    return dotsList;
}



export default {
    renderAxis,
    renderAxisWBump,
    renderTicksByKeys,
    renderBars,
    renderPie,
    renderGuideLine,
    renderLine,
    renderDashedLine,
    renderStar,
    renderDots,
    renderBestFitLine,
    getDotsPosData,
    getDotsInPos
};
