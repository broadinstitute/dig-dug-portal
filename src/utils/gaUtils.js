import queryString from "query-string";

const GA_TEST_EVENT_ACTION = "Google Analytics Test Action"

const GA_TEST_CATEGORY = "Google Analytics Test Category"
const GA_APPLICATION_ERROR_EVENT_CATEGORY = "Application Error"

const GA_TEST_LABEL = "Google Analytics Test Label"
const GA_MESSAGE_LABEL = "Message"

const ERROR_ENDPOINT_NAME = 'eventLog'
const EVENT_ENDPOINT_NAME = 'errorLog'

const logAnalyticsEvent = async function (category, action, params) {

    let qs = queryString.stringify({ action, category, ...params }, { skipNull: true });
    return await fetch(`/eventLog?${qs}`)
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

const logErrorEvent = async function (context, message, page) {
    let params = {
        page: page,
        label: message,
    }
    logAnalyticsEvent(
        GA_APPLICATION_ERROR_EVENT_CATEGORY,
        context,
        params
    );
}

const logPageView = async function (currentPage, previousPage) {
    const qs = queryString.stringify({ currentPage, previousPage }, { skipNull: true });
    return await fetch(`/pageview`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPage, previousPage }),
        })
        .then(response => {
            if (response) {
                return response.data
            } else {
                throw new Error("Unknown outcome of Google Analytics Pageview Logging?")
            }
        })
        .catch(error => {
            console.log(error)
        })
}

export default {
    logAnalyticsEvent,
    logErrorEvent,
    logPageView,
}
