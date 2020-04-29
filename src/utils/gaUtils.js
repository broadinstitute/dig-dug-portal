import axios from 'axios'

const ANALYTICS_EVENT_LOG_SERVICE = "mock/eventlog";

// Defined Actions
const ga_test_action = "Google Analytics Test Action"

// Defined Categories
const ga_test_category = "Google Analytics Test Category"

// Defined Labels
const ga_test_label = "Google Analytics Test Label"

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
    //const response = await axios.get(ANALYTICS_EVENT_LOG_SERVICE);
    //let ack = response.data;
    //return ack;
    throw Error("Not yet implemented!");
}

export default {
    logAnalyticsEvent,
}
