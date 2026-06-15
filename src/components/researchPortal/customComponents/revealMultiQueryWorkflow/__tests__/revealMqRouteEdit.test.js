import {
    buildRouteEditRowsFromRoutes,
    getRouteEditRow,
    patchRoutesFromEditRows,
    ROUTE_ROW_EDIT_FIELDS,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqRouteEdit.js";

describe("revealMqRouteEdit", () => {
    const routes = [
        {
            route_id: "r1",
            category: "Expression",
            biological_query_variation: "liver expression",
            extracted_terms: {
                phenotype_terms: ["T2D"],
                mechanism_terms: ["insulin"],
                genes_of_interest: ["APOE"],
                tissues: ["liver"],
                cell_types: ["hepatocyte"],
            },
        },
    ];

    test("ROUTE_ROW_EDIT_FIELDS defines editable columns", () => {
        expect(ROUTE_ROW_EDIT_FIELDS.map((f) => f.key)).toEqual([
            "phenotype_term",
            "mechanism_term",
            "genes_of_interest",
            "tissues",
            "cell_types",
        ]);
    });

    test("buildRouteEditRowsFromRoutes flattens extracted terms", () => {
        const rows = buildRouteEditRowsFromRoutes(routes);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            route_id: "r1",
            phenotype_term: "T2D",
            mechanism_term: "insulin",
            genes_of_interest: "APOE",
            tissues: "liver",
            cell_types: "hepatocyte",
        });
    });

    test("getRouteEditRow finds row by route_id", () => {
        const rows = buildRouteEditRowsFromRoutes(routes);
        expect(getRouteEditRow({ route_id: "r1" }, rows).phenotype_term).toBe("T2D");
        expect(getRouteEditRow({ route_id: "missing" }, rows)).toBeNull();
    });

    test("patchRoutesFromEditRows applies comma-separated edits", () => {
        const rows = buildRouteEditRowsFromRoutes(routes);
        rows[0].phenotype_term = "T2D, obesity";
        rows[0].genes_of_interest = "APOE, TREM2";

        const patched = patchRoutesFromEditRows(routes, rows);
        expect(patched[0].extracted_terms.phenotype_terms).toEqual(["T2D", "obesity"]);
        expect(patched[0].extracted_terms.genes_of_interest).toEqual(["APOE", "TREM2"]);
        expect(patched).not.toBe(routes);
    });
});
