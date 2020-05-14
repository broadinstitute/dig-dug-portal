import queryString from "query-string";

// Defined Actions
const GA_TEST_EVENT_ACTION = "Google Analytics Test Action"
const GA_APPLICATION_ERROR_EVENT_ACTION = "Application Error"

// Defined Categories
const GA_TEST_CATEGORY = "Google Analytics Test Category"

// Defined Labels
const GA_TEST_LABEL = "Google Analytics Test Label"
const GA_MESSAGE_LABEL = "Message"

/**
 * Issue an Event Log notification for Google Analytics reporting, to the
 * dig-dug-server endpoint of form '/eventlog?action=<action>&category=<category>&label=<label>&value=<value>'
 *
 * For information about Event data, see
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 *
 * TODO: this function should capture the local portal page context of the event for forwarding to the /eventlog service
 *
 * @param {string} [category] - typically the object that was interacted with (e.g. 'Video'), independent reporting tag
 * @param {string} [action] - The type of interaction (e.g. 'play'), independent reporting tag
 * @param {string} [label] - (Optional) Useful for categorizing events (e.g. 'Fall Campaign'), independent reporting tag
 * @param {number} [value] - (Optional) A numeric value associated with the event (e.g. 42, a timestamp, etc.)
 * @return null
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
    return await fetch(`/eventlog?${qs}`)
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
}

/**
 * Issue an Application Error Event Log notification for Google Analytics (GA) reporting, to the server.
 * The "context" of the event specifies the GA event "category" and the message is sent as the
 * GA event value for a hard coded label "message".
 *
 * @param {string} [context]
 * @param {string} [message]
 * @return null
 * @public
 */
const logErrorEvent = async function (context, message) {
    if (process.env.NODE_ENV !== 'development') {
        logAnalyticsEvent(
            GA_APPLICATION_ERROR_EVENT_ACTION,
            context,
            GA_MESSAGE_LABEL,
            message
        );
    }
}


export default {
    logAnalyticsEvent,
    logErrorEvent,
}
