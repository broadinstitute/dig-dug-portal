import { functional } from "./helpers";
import { renderIcon } from "./icons";

export default functional(
    function BIconInfoCircleFill({ variant }, context) {
        return renderIcon(
            "b-icon-info-circle-fill",
            "info-circle-fill",
            variant,
            context
        );
    },
    { props: { variant: String }, inheritAttrs: false }
);
