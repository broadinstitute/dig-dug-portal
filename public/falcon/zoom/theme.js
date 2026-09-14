/* ============================================================
   FalconTheme — light/dark mode, shared across every page.
   Each page (loaded standalone or inside the shell's iframes) sets
   its own <html data-theme="..."> since design-system.css keys off
   that attribute per-document. Persisted in localStorage so a toggle
   fired from the shell reaches every other same-origin iframe via
   the native 'storage' event, with no cross-frame messaging needed.
   Must load as early as possible in <head> (before first paint) so
   there's no flash of the wrong theme.
   ============================================================ */
(function () {
  var KEY = 'falconTheme';

  function systemPref() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  // Existing Plotly charts don't repaint themselves on an attribute change —
  // nudge their axis/legend/hover colors after a theme switch so a chart
  // already on screen doesn't strand dark navy text on a dark background.
  function relayoutPlots() {
    if (typeof Plotly === 'undefined' || !window.FalconPlotTheme) return;
    var c = window.FalconPlotTheme.layout();
    document.querySelectorAll('.js-plotly-plot').forEach(function (el) {
      try {
        Plotly.relayout(el, {
          'font.color': c.font.color,
          'title.font.color': c.title.font.color,
          'xaxis.gridcolor': c.xaxis.gridcolor,
          'xaxis.zerolinecolor': c.xaxis.zerolinecolor,
          'xaxis.linecolor': c.xaxis.linecolor,
          'xaxis.tickfont.color': c.xaxis.tickfont.color,
          'yaxis.gridcolor': c.yaxis.gridcolor,
          'yaxis.zerolinecolor': c.yaxis.zerolinecolor,
          'yaxis.linecolor': c.yaxis.linecolor,
          'yaxis.tickfont.color': c.yaxis.tickfont.color,
          'legend.bgcolor': c.legend.bgcolor,
          'legend.bordercolor': c.legend.bordercolor,
          'legend.font.color': c.legend.font.color,
          'hoverlabel.bgcolor': c.hoverlabel.bgcolor,
          'hoverlabel.bordercolor': c.hoverlabel.bordercolor,
          'hoverlabel.font.color': c.hoverlabel.font.color
        });
      } catch (e) { /* not a real plot div (yet), ignore */ }
    });
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    relayoutPlots();
    // Notify same-document listeners (e.g. the shell's toggle icon). A 'storage'
    // event never fires in the document that wrote the value, so relying on that
    // alone would leave any in-page UI stale whenever set() is called locally.
    window.dispatchEvent(new CustomEvent('falcontheme', { detail: { theme: theme } }));
  }

  var FalconTheme = {
    get: function () { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; },
    set: function (theme) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* private browsing, etc. */ }
      apply(theme);
    },
    toggle: function () { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
    init: function () {
      apply(stored() || systemPref());
      window.addEventListener('storage', function (e) {
        if (e.key === KEY && e.newValue) apply(e.newValue);
      });
    }
  };

  window.FalconTheme = FalconTheme;
  FalconTheme.init();
})();
