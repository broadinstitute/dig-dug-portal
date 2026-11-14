// Keep the source annotation intact; use one display name across portal pages.
function clinvarDisplayLabel(value) {
    const text = value == null ? '' : String(value);
    return /conflict/i.test(text) ? 'Conflict' : text;
}

module.exports = { clinvarDisplayLabel };
