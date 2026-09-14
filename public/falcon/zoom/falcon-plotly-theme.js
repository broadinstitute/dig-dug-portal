/* ============================================================
   FalconPlotTheme — shared Plotly presentation for a consistent,
   on-brand look across every plot. Presentation only; spread the
   result into an existing layout object — never changes plot logic.

   Usage:
     const layout = Object.assign({}, FalconPlotTheme.layout(), { ...specifics });
     Plotly.newPlot(el, data, layout, FalconPlotTheme.config);
   ============================================================ */
window.FalconPlotTheme = {
  // Categorical colorway (logo palette, blue-rich, muted warms) — for clumps / grouped traces
  palette: ['#2a4269', '#5b7fb0', '#d9813a', '#0f9d6b', '#8aa8cf', '#6d4bd8', '#35507d', '#e2be3f', '#f15b51', '#b6cce6'],

  // Evidence-class colors (match .evidence-badge)
  evidence: { Clinical: '#d0891f', Effector: '#0f9d6b', Novel: '#6d4bd8', Repurposable: '#f15b51', Associated: '#2a4269' },

  // Theme-aware variant of the above. Returns literal hex (not var() tokens)
  // because callers both feed Plotly and build `${c}22` alpha suffixes, neither
  // of which can resolve a CSS custom property. Mirrors the --ev-* tokens.
  evidenceColors() {
    return this.isDark()
      ? { Clinical: '#f0ad4e', Effector: '#34d399', Novel: '#a78bfa', Repurposable: '#fb8177', Associated: '#8aa8cf' }
      : { Clinical: '#e08a12', Effector: '#0f9d6b', Novel: '#6d4bd8', Repurposable: '#f15b51', Associated: '#2a4269' };
  },

  // Continuous scale for -log10(p): ice → light blue → muted gold → muted orange
  continuous: [[0, '#cae5e8'], [0.35, '#8aa8cf'], [0.68, '#e2be3f'], [1, '#d4772e']],

  font: { family: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', size: 13, color: '#33445f' },

  // True once the page has opted into dark mode (see theme.js) — read live
  // rather than cached, since layout() is called again on every re-render.
  isDark() { return document.documentElement.dataset.theme === 'dark'; },

  // Theme-resolved colors for one-off trace/annotation/legend styling. Plotly
  // can't read CSS custom properties, so these mirror the design tokens in JS.
  colors() {
    const dark = this.isDark();
    return {
      ink:        dark ? '#eef3fb'               : '#111827',
      ink2:       dark ? '#b9c6dc'               : '#374151',
      line:       dark ? 'rgba(210,222,244,.24)' : '#d1d5db',
      mutedFill:  dark ? 'rgba(210,222,244,.16)' : '#e5e7eb',
      panelBg:    dark ? 'rgba(20,32,54,.82)'    : 'rgba(255,255,255,0.8)',
      zeroFill:   dark ? 'rgba(12,28,52,0)'      : '#ffffff'
    };
  },

  layout(overrides) {
    const dark = this.isDark();
    const ink = dark ? '#eef3fb' : '#0c1c34';
    const ink2 = dark ? '#b9c6dc' : '#33445f';
    const tick = dark ? '#8fa3c4' : '#7989a0';
    const grid = dark ? 'rgba(232,238,248,.10)' : 'rgba(12,28,52,.07)';
    const zeroline = dark ? 'rgba(232,238,248,.18)' : 'rgba(12,28,52,.12)';
    const axisLine = dark ? 'rgba(232,238,248,.22)' : 'rgba(12,28,52,.15)';
    const legendBg = dark ? 'rgba(20,32,54,.82)' : 'rgba(255,255,255,.6)';
    const legendBorder = dark ? 'rgba(232,238,248,.14)' : 'rgba(12,28,52,.10)';
    const hoverBg = dark ? 'rgba(24,36,58,.96)' : 'rgba(255,255,255,.94)';
    const hoverBorder = dark ? 'rgba(232,238,248,.18)' : 'rgba(12,28,52,.12)';
    const base = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: this.font.family, size: this.font.size, color: ink2 },
      colorway: this.palette,
      title: { font: { size: 16, color: ink }, x: 0.02, xanchor: 'left' },
      margin: { t: 44, r: 20, b: 56, l: 56 },
      xaxis: { gridcolor: grid, zerolinecolor: zeroline, linecolor: axisLine, tickfont: { color: tick } },
      yaxis: { gridcolor: grid, zerolinecolor: zeroline, linecolor: axisLine, tickfont: { color: tick } },
      legend: { bgcolor: legendBg, bordercolor: legendBorder, borderwidth: 1, font: { size: 12, color: ink2 } },
      hoverlabel: { bgcolor: hoverBg, bordercolor: hoverBorder, font: { family: this.font.family, size: 12, color: ink } }
    };
    return Object.assign(base, overrides || {});
  },

  config: { responsive: true, displaylogo: false, displayModeBar: false }
};
