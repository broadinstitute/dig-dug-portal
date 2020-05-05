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
 * For information about Event data, see
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 *
 * @param {string} [category] - typically the object that was interacted with (e.g. 'Video'), independent reporting tag
 * @param {string} [action] - The type of interaction (e.g. 'play'), independent reporting tag
 * @param {string} [label] - (Optional) Useful for categorizing events (e.g. 'Fall Campaign'), independent reporting tag
 * @param {number} [value] - (Optional) A numeric value associated with the event (e.g. 42, a timestamp, etc.)
 * @return {string}
 * @public
 */
const logAnalyticsEvent = async function (category, action, label, value) {

    if(isNaN(value)) {
        value = 1
    }

    let queryParams = {
        action,
        category,
        label,
        value
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
