// panel ordering
// https://github.com/statgen/locuszoom/wiki/Panel#general
// https://github.com/statgen/locuszoom/wiki/Data-Layer#supported-layout-directives---allmost-data-layer-types
export const PANEL_ORDER = Object.freeze([
    // TODO: your ordering here
    'association','genes','intervals'
]);

export const BIO_INDEX_TYPE = Object.freeze({
    Associations: "Associations",
});

export const BIO_INDEX_TO_LZ = Object.freeze({
    [BIO_INDEX_TYPE.Associations]: "association",
});


