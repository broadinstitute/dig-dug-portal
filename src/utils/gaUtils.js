import queryString from "query-string";

// Defined Actions
const GA_TEST_ACTION = "Google Analytics Test Action"

// Defined Categories
const GA_TEST_CATEGORY = "Google Analytics Test Category"

// Defined Labels
const GA_TEST_LABEL = "Google Analytics Test Label"

/**
 * Issue an Event Log notification for Google Analytics reporting, to the
 * dig-dug-server endpoint of form '/eventlog?action=<action>&category=<category>&label=<label>&value=<value>'
 *
 * where the <?> tokens are strings either constrained by the string constants defined in this file or free text.
 *
 * @param {string} [action]
 * @param {string} [category]
 * @param {string} [label]
 * @param {string} [value]
 * @return {string}
 * @public
 */
const logAnalyticsEvent = async function (action, category, label, value) {
    let queryParams = {
        action,
        category,
        label,
        value,
    };

    let qs = queryString.stringify(queryParams, { skipNull: true });
    let result = await fetch(`/eventlog?${qs}`)
        .then(response => {
            if (response) {
                return response.data
            } else {
                throw new Error("Unknown outcome of Google Analytics Events Logging?")
            }
        })
        .catch(error => {
            console.log(error)
        })

    return result
}

export default {
    logAnalyticsEvent
}
