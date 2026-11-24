import { h, mergeProps } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BSkeletonImg({ height, noAspect }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse(
                "b-skeleton-img",
                { attrs, slots },
                { listeners: true, slots: [] }
            );
        }
        const own = {
            class: "b-skeleton b-skeleton-img b-skeleton-animate-wave",
            style: { height },
        };
        const image = h("div", mergeProps(own, attrs));
        if (noAspect) {
            return image;
        }
        // 16:9
        return h("div", { class: "b-aspect d-flex" }, [
            h("div", {
                class: "b-aspect-sizer flex-grow-1",
                style: { paddingBottom: "56.25%", height: 0 },
            }),
            h(
                "div",
                {
                    class: "b-aspect-content flex-grow-1 w-100 mw-100",
                    style: { marginLeft: "-100%" },
                },
                [image]
            ),
        ]);
    },
    { props: { height: String, noAspect: Boolean }, inheritAttrs: false }
);
