import { createContext } from "vue-context-api";

// The argument passed to createContext is the default context value
// for `id => true`, letting everything through by default amounts to no filter, and vice-versa, so set it as default
export const { Provider, Consumer } = createContext(id => true); 