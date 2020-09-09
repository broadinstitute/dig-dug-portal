import { createContext } from "vue-context-api";

// The argument passed to createContext is the default context value
export const { Provider, Consumer } = createContext(id => true);