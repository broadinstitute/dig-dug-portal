const FOCUS_STORAGE_KEY = "krClinicalFocus.v1";
const FOCUS_EVENT = "kr-clinical-focus-change";

function canUseStorage() {
    return typeof window !== "undefined" && window.sessionStorage;
}

export function readClinicalFocus() {
    if (!canUseStorage()) return null;

    try {
        const raw = window.sessionStorage.getItem(FOCUS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

export function writeClinicalFocus(focus) {
    if (!canUseStorage()) return;

    window.sessionStorage.setItem(
        FOCUS_STORAGE_KEY,
        JSON.stringify({
            ...focus,
            updatedAt: new Date().toISOString(),
        }),
    );
    window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: readClinicalFocus() }));
}

export function clearClinicalFocus() {
    if (!canUseStorage()) return;

    window.sessionStorage.removeItem(FOCUS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: null }));
}

export function onClinicalFocusChange(callback) {
    if (typeof window === "undefined") return () => {};

    const listener = (event) => callback(event.detail || readClinicalFocus());
    window.addEventListener(FOCUS_EVENT, listener);
    return () => window.removeEventListener(FOCUS_EVENT, listener);
}

