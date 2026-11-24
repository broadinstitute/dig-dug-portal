import { callWithAsyncErrorHandling, ErrorCodes } from "vue";

// What `new Vue()` gave as a bus: $emit calls the handlers in the order they were added, logs an error in one and still
// calls the others, and does not see a handler that is added or removed meanwhile.
const handlers = new Map();
const handlersOf = (event) => handlers.get(event) || [];

const EventBus = {
    $on(event, handler) {
        handlers.set(event, [...handlersOf(event), handler]);
    },
    $once(event, handler) {
        const once = (...args) => {
            EventBus.$off(event, once);
            return handler(...args);
        };
        once.handler = handler;
        EventBus.$on(event, once);
    },
    // without a handler all of the event's, without an event all there are
    $off(event, handler) {
        if (!event) {
            handlers.clear();
        } else if (!handler) {
            handlers.delete(event);
        } else {
            handlers.set(
                event,
                handlersOf(event).filter((h) => h !== handler && h.handler !== handler)
            );
        }
    },
    $emit(event, ...args) {
        callWithAsyncErrorHandling(handlersOf(event), null, ErrorCodes.COMPONENT_EVENT_HANDLER, args);
    },
};

export default EventBus;
