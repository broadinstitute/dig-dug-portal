import { tooltipPosition } from './tooltipPosition';

let nextId = 0;
let active = null;

export default {
    inserted(el, binding) {
        const state = { text: String(binding.value || ''), panel: null, timer: null };
        const describedBy = () => (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        const close = () => {
            clearTimeout(state.timer);
            if (!state.panel) return;
            const ids = describedBy().filter(id => id !== state.panel.id);
            if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
            state.panel.remove(); state.panel = null;
            if (active === state) active = null;
        };
        const place = () => {
            const panel = state.panel;
            if (!panel) return;
            const anchor = el.getBoundingClientRect();
            if (!anchor.width || anchor.bottom <= 0 || anchor.top >= window.innerHeight || anchor.right <= 0 || anchor.left >= window.innerWidth) return close();
            panel.style.left = '0px'; panel.style.top = '0px';
            const origin = panel.getBoundingClientRect();
            const scale = origin.width / panel.offsetWidth || 1;
            panel.style.maxWidth = `${Math.min(480, (window.innerWidth - 24) / scale)}px`;
            panel.style.maxHeight = `${(window.innerHeight - 24) / scale}px`;
            panel.firstChild.style.maxHeight = `${Math.max(40, (window.innerHeight - 24) / scale - 32)}px`;
            const rect = panel.getBoundingClientRect();
            const position = tooltipPosition(anchor, rect, { width: window.innerWidth, height: window.innerHeight });
            panel.style.left = `${(position.left - origin.left) / scale}px`;
            panel.style.top = `${(position.top - origin.top) / scale}px`;
            panel.style.setProperty('--pbs-tooltip-arrow', `${position.arrow / scale}px`);
            panel.dataset.placement = position.placement;
        };
        const cancel = () => clearTimeout(state.timer);
        const leave = () => { cancel(); state.timer = setTimeout(() => { if (document.activeElement !== el) close(); }, 160); };
        const open = () => {
            cancel(); if (!state.text) return;
            if (active && active !== state) active.close();
            active = state;
            if (!state.panel) {
                const panel = document.createElement('div');
                panel.id = `pbs-hover-${++nextId}`; panel.className = 'pbs-hover-tooltip'; panel.setAttribute('role', 'tooltip');
                const text = document.createElement('span'); text.textContent = state.text; panel.appendChild(text);
                const arrow = document.createElement('i'); arrow.className = 'pbs-tooltip-arrow'; arrow.setAttribute('aria-hidden', 'true'); panel.appendChild(arrow);
                panel.addEventListener('mouseenter', cancel); panel.addEventListener('mouseleave', leave);
                document.body.appendChild(panel); state.panel = panel;
                el.setAttribute('aria-describedby', [...describedBy(), panel.id].join(' '));
            }
            place();
        };
        const outside = event => { if (state.panel && !el.contains(event.target) && !state.panel.contains(event.target)) close(); };
        const keydown = event => { if (event.key === 'Escape') close(); };
        state.close = close;
        state.update = value => { state.text = String(value || ''); if (state.panel) { state.panel.firstChild.textContent = state.text; place(); } };
        state.destroy = () => {
            close(); el.removeEventListener('mouseenter', open); el.removeEventListener('mouseleave', leave); el.removeEventListener('focus', open); el.removeEventListener('blur', leave);
            window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', keydown);
        };
        el.addEventListener('mouseenter', open); el.addEventListener('mouseleave', leave); el.addEventListener('focus', open); el.addEventListener('blur', leave);
        window.addEventListener('resize', place); window.addEventListener('scroll', place, true); document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', keydown);
        el._pbsTooltip = state;
    },
    componentUpdated(el, binding) { el._pbsTooltip?.update(binding.value); },
    unbind(el) { el._pbsTooltip?.destroy(); delete el._pbsTooltip; },
};
