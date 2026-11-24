import { h, mergeProps } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BSkeletonWrapper({ loading }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse(
                "b-skeleton-wrapper",
                { attrs, slots },
                { listeners: true, slots: ["default", "loading"] }
            );
        }
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
    { props: { loading: Boolean }, inheritAttrs: false }
);
