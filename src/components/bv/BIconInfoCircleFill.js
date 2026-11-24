import { functional } from "./helpers";
import { renderIcon, SUPPORTED } from "./icons";

export default functional(
    "b-icon-info-circle-fill",
    function BIconInfoCircleFill({ variant }, { attrs }) {
        return renderIcon("info-circle-fill", variant, attrs);
    },
    { props: { variant: String }, inheritAttrs: false },
    SUPPORTED
);
