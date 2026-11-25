<template>
    <div :id="ownId" class="tabs">
        <div :class="card ? 'card-header' : ''">
            <ul
                :id="`${ownId}__BV_tab_controls_`"
                class="nav nav-tabs"
                :class="{ 'card-header-tabs': card }"
                role="tablist"
            >
                <li
                    v-for="(tab, index) in tabs"
                    :key="tab.ownId"
                    class="nav-item"
                    role="presentation"
                >
                    <a
                        :id="tab.buttonId"
                        ref="buttons"
                        class="nav-link"
                        :class="{ active: tab.shown }"
                        role="tab"
                        href="#"
                        target="_self"
                        :tabindex="index === Math.max(active, 0) ? null : -1"
                        :aria-selected="tab.shown ? 'true' : 'false'"
                        :aria-setsize="tabs.length"
                        :aria-posinset="index + 1"
                        :aria-controls="tab.ownId"
                        @click="pick(tab, $event)"
                        @keydown="press(tab, $event)"
                        >{{ tab.title }}</a
                    >
                </li>
            </ul>
        </div>
        <div :id="`${ownId}__BV_tab_container_`" class="tab-content">
            <slot
                ><div
                    class="tab-pane active"
                    :class="{ 'card-body': card }"
                ></div
            ></slot>
        </div>
    </div>
</template>

<script>
import { focusOn, stopEvent } from "./dom";
import { checksUse, nextId } from "./helpers";

// by key code
const SPACE = 32;
const TO_START = [36, 37, 38];
const TO_END = [35, 39, 40];
const [HOME, END] = [36, 35];

export default {
    name: "BTabs",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-tabs", { not: ["id"] }),
    provide() {
        return { bvTabs: this };
    },
    props: {
        card: Boolean,
    },
    data() {
        return {
            ownId: nextId(),
            // the <b-tab>s as they came, and in the order of the page
            known: [],
            tabs: [],
            // the index in `tabs` of the one that is shown
            active: -1,
        };
    },
    watch: {
        known: "update",
    },
    updated() {
        // the slot may have changed the order
        this.update();
    },
    methods: {
        add(tab) {
            this.known = [...this.known, tab];
        },
        remove(tab) {
            this.known = this.known.filter((other) => other !== tab);
        },
        update() {
            const tabs = [...this.known].sort((a, b) =>
                a.$el.compareDocumentPosition(b.$el) &
                Node.DOCUMENT_POSITION_FOLLOWING
                    ? -1
                    : 1
            );
            const { length } = tabs;
            if (
                length === this.tabs.length &&
                tabs.every((tab, index) => tab === this.tabs[index])
            ) {
                return;
            }
            let index = tabs.map((tab) => tab.shown).lastIndexOf(true);
            if (index < 0) {
                // the next one takes the place of one that went
                index = Math.min(Math.max(this.active, 0), length - 1);
            }
            this.tabs = tabs;
            this.show(index);
        },
        show(index) {
            this.active = index;
            this.tabs.forEach((tab, i) => {
                tab.shown = i === index;
            });
        },
        activate(tab) {
            const index = this.tabs.indexOf(tab);
            if (index >= 0) {
                this.show(index);
            }
        },
        pick(tab, event) {
            stopEvent(event);
            this.activate(tab);
            tab.$emit("click", event);
        },
        press(tab, event) {
            const { keyCode, shiftKey } = event;
            if (keyCode === SPACE) {
                this.pick(tab, event);
                return;
            }
            const { active, tabs } = this;
            let index;
            if (TO_START.includes(keyCode)) {
                index = shiftKey || keyCode === HOME ? 0 : active - 1;
            } else if (TO_END.includes(keyCode)) {
                const last = tabs.length - 1;
                index = shiftKey || keyCode === END ? last : active + 1;
            } else {
                return;
            }
            stopEvent(event);
            const next = tabs[index];
            if (!next || index === active) {
                return;
            }
            this.show(index);
            this.$nextTick(() => {
                focusOn(
                    this.$refs.buttons.find((el) => el.id === next.buttonId)
                );
            });
            next.$emit("click", event);
        },
    },
};
</script>
