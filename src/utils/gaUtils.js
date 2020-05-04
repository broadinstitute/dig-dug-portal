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
 * where the <?> tokens are strings either constrained by the string constants defined in this file or free text.
 *
 * @param {string} [action]
 * @param {string} [category]
 * @param {string} [label]
 * @param {string} [value]
 * @return null
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
    logAnalyticsEvent(
        GA_APPLICATION_ERROR_EVENT_ACTION,
        context,
        GA_MESSAGE_LABEL,
        message
    );
}


export default {
    logAnalyticsEvent,
    logErrorEvent,
}
