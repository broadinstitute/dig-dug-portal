import { createContext } from "vue-context-api";

export const makeFilterContext = reducer => {
    return { Provider, Consumer } = createContext(reducer);
};

// The argument passed to createContext is the default context value
export const { Provider, Consumer } = createContext(id => true);