export const PLOT_MARGIN = {
    top: 20,
    bottom: 100,
    left: 100,
    right: 0,
    bump: 0,
    middleSpacing: 0,
    legendSpacing: 35
}

export function getVolcanoConfig(xGreater, xLower, yCondition, height=300){
  let plotWidth = 600;
  let config = {
      "type": "volcano plot",
      "label": "This is a Test",
      "legend": "This is a Test",
      "render by": "gene",
      "x axis field": "logFoldChange",
      "x axis label": "log2 Fold Change",
      "y axis field": "-log10P",
      "y axis label": "-log10(FDR adj. p)",
      "width": plotWidth,
      "height": height,
      "x condition": { 
          "combination": "or", 
          "greater than": xGreater, 
          "lower than": xLower },
      //combination for condition can be "greater than", "lower than", "or" and "and."
      "y condition": { 
          "combination": "greater than", 
          "greater than": parseFloat(yCondition) },
      "dot label score": 2
      //number of conditions that the value of each dot to meet to have labeled
  };
  return config;
}