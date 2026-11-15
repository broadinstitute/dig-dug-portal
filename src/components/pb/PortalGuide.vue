<template>
    <div class="pb-portal-guide">
        <button ref="trigger" type="button" class="pb-guide-trigger" :class="{ 'pb-guide-trigger-front': front }"
                :style="scaleStyle" aria-haspopup="dialog" aria-controls="pb-guide-dialog" :aria-expanded="String(isOpen)"
                aria-label="Open quick guide" @click.stop="openGuide">
            <svg v-if="!front" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v15M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /></svg>
            <span>Guide</span>
            <img v-if="front" src="/guides/quick_guide_en_preview.png" alt="Preview of the five-page navigation guide" width="140" height="99" />
        </button>
        <dialog id="pb-guide-dialog" ref="dialog" class="pb-guide-dialog" :style="dialogStyle"
                aria-labelledby="pb-guide-heading" @cancel.prevent="closeGuide" @close="onClosed" @click="backdropClick">
            <div class="pb-guide-dialog-content">
                <header class="pb-guide-dialog-header">
                    <h2 id="pb-guide-heading">Quick guide</h2>
                    <a :href="pdfUrl" target="_blank" rel="noopener noreferrer">Open PDF <span aria-hidden="true">↗</span></a>
                    <button ref="close" type="button" aria-label="Close guide" @click="closeGuide">×</button>
                </header>
                <iframe v-if="isOpen" :src="pdfUrl + '#view=Fit&toolbar=0&navpanes=0'" title="CRDC quick guide PDF" class="pb-guide-pdf" />
                <p class="pb-guide-dialog-footer">Five pages, one guide. If the preview does not appear, select <a :href="pdfUrl" target="_blank" rel="noopener noreferrer">Open PDF</a>.</p>
            </div>
        </dialog>
    </div>
</template>
<script>
export default {
    name: 'PortalGuide',
    props: { front: { type: Boolean, default: false } },
    data: () => ({ isOpen: false, pdfUrl: '/guides/quick_guide_en.pdf', scale: 1, viewportWidth: 1200, viewportHeight: 800 }),
    computed: {
        scaleStyle() { return { zoom: 1 / this.scale }; },
        dialogStyle() { return { ...this.scaleStyle, width: `${Math.min(1280, this.viewportWidth - 48)}px`, height: `${this.viewportHeight - 48}px` }; },
    },
    mounted() {
        this.resize();
        // Keep the native modal outside page-specific positioning and scrolling containers.
        document.body.appendChild(this.$refs.dialog);
        window.addEventListener('resize', this.resize);
    },
    beforeDestroy() {
        this.closeGuide();
        window.removeEventListener('resize', this.resize);
        const dialog = this.$refs.dialog;
        if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
    },
    methods: {
        resize() {
            this.scale = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
        },
        openGuide() {
            this.resize();
            this.isOpen = true;
            this.previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            this.$refs.dialog.showModal();
            this.$nextTick(() => this.$refs.close && this.$refs.close.focus());
        },
        closeGuide() { if (this.$refs.dialog && this.$refs.dialog.open) this.$refs.dialog.close(); this.onClosed(); },
        onClosed() {
            if (!this.isOpen) return;
            this.isOpen = false;
            document.body.style.overflow = this.previousOverflow || '';
            this.$nextTick(() => this.$refs.trigger && this.$refs.trigger.focus());
        },
        backdropClick(event) {
            if (event.target !== this.$refs.dialog) return;
            const bounds = this.$refs.dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.closeGuide();
        },
    },
};
</script>
<style>
/* Reserve a slim gutter only when the page does not already reserve a wider help rail. */
.pb-guide-page > .pbg-page:not(.pg2-info-reserved):not(.pbv-info-reserved),
.pb-guide-page > .pbp-page:not(.pbp-info-reserved) { padding-right: 104px; }
.pb-guide-trigger { position:fixed; z-index:1060; top:120px; right:12px; width:58px; display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 5px; color:#225788; background:#fff; border:1px solid #becddd; border-radius:7px; font:400 14px/1.3 Arial,Helvetica,sans-serif; cursor:pointer; box-shadow:0 2px 6px #24334a0a; }
.pb-guide-trigger:hover { background:#f1f6fb; border-color:#7b9bbd; }
.pb-guide-trigger:focus-visible, .pb-guide-dialog button:focus-visible, .pb-guide-dialog a:focus-visible { outline:3px solid #0b66d8; outline-offset:3px; }
.pb-guide-trigger.pb-guide-trigger-front { top:24px; right:24px; width:156px; padding:10px 7px 7px; gap:8px; font-size:16px; }
.pb-guide-trigger-front img { display:block; width:140px; height:auto; border:1px solid #e0e5ea; border-radius:2px; }
.crdc-front.pb-guide-front .crdc-front-main h1 { padding-right:190px; }
.pb-guide-dialog { box-sizing:border-box; padding:0; max-width:none; max-height:none; margin:auto; border:1px solid #c5d0dc; border-radius:10px; background:#fff; color:#24334a; overflow:hidden; box-shadow:0 20px 70px #14213d33; font:400 15px/1.4 Arial,Helvetica,sans-serif; }
.pb-guide-dialog::backdrop { background:rgba(20,33,50,.48); }
.pb-guide-dialog-content { height:100%; display:flex; flex-direction:column; }
.pb-guide-dialog-header { display:flex; flex:none; align-items:center; gap:20px; padding:12px 18px; border-bottom:1px solid #dce3eb; }
.pb-guide-dialog-header h2 { margin:0; font-size:20px; font-weight:600; flex:1; }
.pb-guide-dialog a { color:#0867bb; text-decoration:underline; }
.pb-guide-dialog-header button { width:36px; height:36px; padding:0; display:grid; place-items:center; color:#24334a; background:#f5f7fa; border:1px solid #c5d0dc; border-radius:5px; font:400 28px/1 Arial,sans-serif; cursor:pointer; }
.pb-guide-pdf { width:100%; min-height:0; flex:1; border:0; background:#e9edf2; }
.pb-guide-dialog-footer { flex:none; margin:0; padding:9px 18px; font-size:13px; color:#526071; border-top:1px solid #dce3eb; }
</style>
