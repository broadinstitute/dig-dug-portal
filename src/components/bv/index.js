// What PanKbase uses of BootstrapVue 2.23, for Vue 3: the same tags and markup, on Bootstrap 4 and BootstrapVue's stylesheet.
import BAlert from "./BAlert.vue";
import BBadge from "./BBadge";
import BButton from "./BButton";
import BCard from "./BCard";
import BCardBody from "./BCardBody";
import BCardText from "./BCardText";
import BCol from "./BCol";
import BContainer from "./BContainer";
import BDropdown from "./BDropdown.vue";
import BDropdownDivider from "./BDropdownDivider";
import BDropdownItem from "./BDropdownItem.vue";
import BDropdownText from "./BDropdownText";
import BFormInput from "./BFormInput.vue";
import BFormRadio from "./BFormRadio.vue";
import BFormRadioGroup from "./BFormRadioGroup.vue";
import BIcon from "./BIcon";
import BIconInfoCircleFill from "./BIconInfoCircleFill";
import BIconPlusCircleFill from "./BIconPlusCircleFill";
import BPagination from "./BPagination.vue";
import BRow from "./BRow";
import BSkeletonImg from "./BSkeletonImg";
import BSkeletonWrapper from "./BSkeletonWrapper";
import BSpinner from "./BSpinner";
import BTab from "./BTab.vue";
import BTabs from "./BTabs.vue";
import BTh from "./BTh.vue";

const plugin = (components) => ({
    install(app) {
        for (const [name, component] of Object.entries(components)) {
            app.component(name, component);
        }
    },
});

export const BootstrapVue = plugin({
    BAlert,
    BBadge,
    BButton,
    BCard,
    BCardBody,
    BCardText,
    BCol,
    BContainer,
    BDropdown,
    BDropdownDivider,
    BDropdownItem,
    BDropdownText,
    BFormInput,
    BFormRadio,
    BFormRadioGroup,
    BPagination,
    BRow,
    BSkeletonImg,
    BSkeletonWrapper,
    BSpinner,
    BTab,
    BTabs,
    BTh,
});

export const BootstrapVueIcons = plugin({
    BIcon,
    BIconInfoCircleFill,
    BIconPlusCircleFill,
});
