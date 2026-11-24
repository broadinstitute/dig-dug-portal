import { h, mergeProps } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-skeleton-wrapper",
    function BSkeletonWrapper({ loading }, { attrs, slots }) {
        // the content has no element around it: class, style and attributes belong to the placeholder
        if (!loading) {
            return slots.default?.();
        }
        const own = {
            class: "b-skeleton-wrapper",
            role: "alert",
            "aria-live": "polite",
            "aria-busy": "true",
        };
        return h("div", mergeProps(attrs, own), slots.loading?.());
    },
    { props: { loading: Boolean }, inheritAttrs: false },
    { slots: ["default", "loading"] }
);
