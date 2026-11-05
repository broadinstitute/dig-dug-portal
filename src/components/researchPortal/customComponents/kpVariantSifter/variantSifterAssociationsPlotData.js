/**
 * Convert formatted association table rows into plot row objects for VS canvas plots.
 */
export function associationRowsToPlotData(rows) {
    if (!Array.isArray(rows) || !rows.length) {
        return null;
    }

    const plotRows = rows
        .map((row) => {
            const pValue = row["P-Value"];
            const negLog10 =
                row["-log10(P-Value)"] ??
                (typeof pValue === "number" && pValue > 0
                    ? -Math.log10(pValue)
                    : null);

            return {
                "Variant ID": row["Variant ID"],
                Position: row.Position,
                "P-Value": pValue,
                "-log10(P-Value)": negLog10,
                Beta: row.Beta,
                "Z Score": row["Z Score"],
                ref: row.ref,
                alt: row.alt,
                LDS: row.LDS,
            };
        })
        .filter(
            (row) =>
                row["Variant ID"] &&
                row.Position != null &&
                row["-log10(P-Value)"] != null &&
                !Number.isNaN(row["-log10(P-Value)"])
        );

    return plotRows.length ? plotRows : null;
}
