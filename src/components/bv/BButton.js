import { h, mergeProps } from "vue";
import { functional } from "./helpers";

// For events that a disabled element still gets: dispatched by script on a button, any on a link.
function stopButton(event) {
    event.preventDefault();
    event.stopPropagation();
}
function stopLink(event) {
    stopButton(event);
    event.stopImmediatePropagation();
}
// href="#" is a button to the user: it leads nowhere, and Space presses it.
function stay(event) {
    event.preventDefault();
}
function pressOnSpace(event) {
    if (event.keyCode === 32) {
        event.preventDefault();
        event.currentTarget.click();
    }
}

export default functional(
    "b-button",
    function BButton(
        { disabled, href, pill, size, variant },
        { attrs, slots }
    ) {
        const look = {
            class: [
                "btn",
                `btn-${variant || "secondary"}`,
                { [`btn-${size}`]: size, "rounded-pill": pill, disabled },
            ],
        };
        if (!href) {
            const first = disabled ? { onClick: stopButton } : {};
            return h(
                "button",
                mergeProps(first, attrs, look, { type: "button", disabled }),
                slots.default?.()
            );
        }
        const hash = href === "#";
        const first = {};
        const last = {
            href,
            target: "_self",
            "aria-disabled": disabled ? "true" : null,
        };
        if (disabled) {
            first.onClick = stopLink;
            last.tabindex = "-1";
        } else if (hash) {
            first.onKeydown = pressOnSpace;
            last.tabindex = "0";
        }
        if (hash) {
            last.onClick = stay;
            last.role = "button";
        }
        return h("a", mergeProps(first, attrs, look, last), slots.default?.());
    },
    {
        props: {
            disabled: Boolean,
            href: String,
            pill: Boolean,
            size: String,
            variant: String,
        },
        inheritAttrs: false,
    },
    { attributes: ["name", "value"] }
);
