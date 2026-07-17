<template>
    <div
        v-if="open"
        ref="menu"
        class="vks-ge-tissue-dot-menu"
        :style="menuStyle"
        role="menu"
        @mousedown.stop
    >
        <p class="vks-ge-tissue-dot-menu-title">{{ tissue }}</p>
        <p class="vks-ge-tissue-dot-menu-subtitle">{{ annotation }}</p>
        <button
            type="button"
            class="vks-ge-tissue-dot-menu-btn"
            @click="$emit('toggle-select')"
        >
            {{ isSelected ? "Deselect tissue" : "Select tissue" }}
        </button>
    </div>
</template>

<script>
import {
    clampAnchoredPopupPosition,
    resolvePopupContainerBounds,
} from "./variantSifterPopupPosition.js";

export default {
    name: "VariantSifterGeTissueDotMenu",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        tissue: {
            type: String,
            default: "",
        },
        annotation: {
            type: String,
            default: "",
        },
        isSelected: {
            type: Boolean,
            default: false,
        },
        anchorX: {
            type: Number,
            default: 0,
        },
        anchorY: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            clampedX: 0,
            clampedY: 0,
        };
    },
    computed: {
        menuStyle() {
            return {
                left: `${this.clampedX}px`,
                top: `${this.clampedY}px`,
            };
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.updateClampedPosition();
            }
        },
        anchorX() {
            this.updateClampedPosition();
        },
        anchorY() {
            this.updateClampedPosition();
        },
        isSelected() {
            this.updateClampedPosition();
        },
    },
    methods: {
        updateClampedPosition() {
            this.$nextTick(() => {
                const menu = this.$refs.menu;
                const bounds = resolvePopupContainerBounds(menu);
                const { x, y } = clampAnchoredPopupPosition({
                    containerWidth: bounds.width,
                    containerHeight: bounds.height,
                    anchorX: this.anchorX,
                    anchorY: this.anchorY,
                    popupWidth: menu?.offsetWidth || 216,
                    popupHeight: menu?.offsetHeight || 90,
                });
                this.clampedX = x;
                this.clampedY = y;
            });
        },
    },
};
</script>

<style scoped>
.vks-ge-tissue-dot-menu {
    position: absolute;
    z-index: 8;
    min-width: 200px;
    padding: 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(20, 22, 30, 0.12);
}

.vks-ge-tissue-dot-menu-title {
    margin: 0 0 2px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    word-break: break-word;
}

.vks-ge-tissue-dot-menu-subtitle {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    word-break: break-word;
}

.vks-ge-tissue-dot-menu-btn {
    display: block;
    width: 100%;
    margin: 0;
    padding: 7px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
}

.vks-ge-tissue-dot-menu-btn:hover {
    background: var(--cfde-orange-soft, #fbeee3);
    border-color: var(--cfde-orange, #e07b39);
}
</style>
