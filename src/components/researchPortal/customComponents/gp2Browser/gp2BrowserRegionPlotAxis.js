/**
 * Compact (20%-height, searching-region) canvas axis renderer shared by
 * GP2 Browser's region plot components (Associations, QTL evidences).
 */

/**
 * Draw the compact axis used by GP2 Browser's 20%-height searching-region
 * plots: left y-axis ticks (min/max only), an optional right-side secondary
 * axis (recombination rate, for tracks that plot one), and bottom x-axis
 * ticks.
 */
export function renderCompactSearchingPlotAxis(ctx, options) {
    const {
        margin,
        plotWidth,
        plotHeight,
        yMin,
        yMax,
        xMin,
        xMax,
        utils,
        showSecondaryAxis = true,
    } = options;

    const bump = margin.bump ?? 10;
    const recomXpos = Math.round(margin.left + plotWidth + bump);
    const yMaxMinGap = yMax - yMin;
    const yDecimal = yMaxMinGap <= 1 ? 2 : yMaxMinGap <= 50 ? 1 : 0;
    const xMaxMinGap = xMax - xMin;
    const xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

    const formatVal = (val, dec) => {
        if (utils?.Formatters?.decimalFormatter) {
            return utils.Formatters.decimalFormatter(val, dec);
        }
        return String(Math.round(val));
    };

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.font = "22px Arial";
    ctx.fillStyle = "#000000";
    ctx.setLineDash([]);

    // Left Y axis
    ctx.moveTo(margin.left - bump, margin.top);
    ctx.lineTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.stroke();

    if (showSecondaryAxis) {
        // Right Recomb axis
        ctx.moveTo(recomXpos, margin.top);
        ctx.lineTo(recomXpos, plotHeight + margin.top + bump);
        ctx.stroke();
    }

    // Bottom X axis
    ctx.moveTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.lineTo(
        showSecondaryAxis ? plotWidth + margin.left + bump : plotWidth + margin.left,
        plotHeight + margin.top + bump
    );
    ctx.stroke();

    // Compact Y ticks: bottom (yMin) and top (yMax)
    const yTicks = [
        { val: yMin, y: margin.top + plotHeight },
        { val: yMax, y: margin.top },
    ];
    yTicks.forEach(({ val, y }) => {
        const adjY = Math.floor(y);
        ctx.beginPath();
        ctx.moveTo(margin.left - bump * 2, adjY);
        ctx.lineTo(margin.left - bump, adjY);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(
            formatVal(val, yDecimal),
            margin.left - bump * 3,
            adjY + 7
        );
    });

    if (showSecondaryAxis) {
        // Compact right recomb ticks: 0 and 100
        [
            { label: "0", y: margin.top + plotHeight },
            { label: "100", y: margin.top },
        ].forEach(({ label, y }) => {
            const adjY = Math.floor(y);
            ctx.beginPath();
            ctx.moveTo(recomXpos, adjY);
            ctx.lineTo(recomXpos + bump, adjY);
            ctx.stroke();
            ctx.textAlign = "left";
            ctx.fillText(label, margin.left + plotWidth + bump * 3, adjY + 7);
        });
    }

    // X ticks
    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    for (let i = 0; i < 6; i += 1) {
        const tickXPos = margin.left + i * xTickDistance;
        const adjTickXPos = Math.floor(tickXPos);
        ctx.beginPath();
        ctx.moveTo(adjTickXPos, margin.top + plotHeight + bump);
        ctx.lineTo(adjTickXPos, margin.top + plotHeight + bump * 2);
        ctx.stroke();

        ctx.textAlign = "center";
        let positionLabel = formatVal(xMin + i * xStep, xDecimal);
        if (Number(positionLabel) >= 100000) {
            positionLabel = `${Math.round(Number(positionLabel) * 0.001)}k`;
        }
        ctx.fillText(
            positionLabel,
            adjTickXPos,
            margin.top + plotHeight + bump * 4
        );
    }

    ctx.restore();
}

/**
 * Full-height (100%, 50 kb viewing-region) axis for tracks that have no
 * secondary (recombination-rate) axis to show, such as QTL evidences. Mirrors
 * `renderPlotAxis({ type: "asso" })` in `variantSifterPlotShared.js` minus the
 * right-hand axis and its "Recombination Rate" label.
 */
export function renderGp2FullPlotAxisNoSecondary(ctx, options) {
    const {
        margin,
        plotWidth,
        plotHeight,
        yMin,
        yMax,
        xMin,
        xMax,
        utils,
        yAxisLabel = "-log10(p-value)",
        xAxisLabel = "",
    } = options;

    const bump = margin.bump ?? 10;
    const yMaxMinGap = yMax - yMin;
    const yDecimal = yMaxMinGap <= 1 ? 2 : yMaxMinGap <= 50 ? 1 : 0;
    const xMaxMinGap = xMax - xMin;
    const xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

    const formatVal = (val, dec) => {
        if (utils?.Formatters?.decimalFormatter) {
            return utils.Formatters.decimalFormatter(val, dec);
        }
        return String(Math.round(val));
    };

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.font = "24px Arial";
    ctx.fillStyle = "#000000";
    ctx.setLineDash([]);

    ctx.moveTo(margin.left - bump, margin.top);
    ctx.lineTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.stroke();

    ctx.moveTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.lineTo(plotWidth + margin.left, plotHeight + margin.top + bump);
    ctx.stroke();

    const yStep = (yMax - yMin) / 5;
    const yTickDistance = plotHeight / 5;
    for (let i = 0; i < 6; i += 1) {
        const tickYPos = margin.top + i * yTickDistance;
        const adjTickYPos = Math.floor(tickYPos);
        ctx.moveTo(margin.left - bump * 2, adjTickYPos);
        ctx.lineTo(margin.left - bump, adjTickYPos);
        ctx.stroke();

        ctx.textAlign = "right";
        let tickValue = formatVal(yMin + i * yStep, yDecimal);
        if (yMaxMinGap >= 100000) {
            tickValue += "k";
        }
        ctx.fillText(
            tickValue,
            margin.left - bump * 3,
            margin.top + plotHeight + bump - i * yTickDistance
        );
    }

    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    for (let i = 0; i < 6; i += 1) {
        const tickXPos = margin.left + i * xTickDistance;
        const adjTickXPos = Math.floor(tickXPos);
        ctx.moveTo(adjTickXPos, margin.top + plotHeight + bump);
        ctx.lineTo(adjTickXPos, margin.top + plotHeight + bump * 2);
        ctx.stroke();

        ctx.textAlign = "center";
        let positionLabel = formatVal(xMin + i * xStep, xDecimal);
        if (Number(positionLabel) >= 100000) {
            positionLabel = `${Math.round(Number(positionLabel) * 0.001)}k`;
        }
        ctx.fillText(
            positionLabel,
            adjTickXPos,
            margin.top + plotHeight + bump * 4
        );
    }

    ctx.textAlign = "center";
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, -(margin.top + plotHeight / 2), bump + 24);
    ctx.rotate((-Math.PI * 3) / 2);

    if (xAxisLabel) {
        ctx.fillText(
            xAxisLabel,
            plotWidth / 2 + margin.left,
            margin.top + margin.bottom + plotHeight - 24
        );
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
