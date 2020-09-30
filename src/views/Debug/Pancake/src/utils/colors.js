import * as d3 from "d3";
const white = "#ffffff",
        black = "#000000",
        grey = "rgb(220,220,220)",
        darkgrey = "rgba(100,100,100,.5)",
        red = "#c13122",
        darkred = "rgb(221, 0, 0)",
        orange = "#F26524",
        blue = "#008AB7",
        green = "#42A240",
        purple = "#93268F",
        yellow = "#F9A01B",
        teal = "#00A88E";

        const nodeStrokeColor = darkgrey;
        const baseNodeOpacity = 1;
        const nodeOpacity = 1;

        const binaryColorRange = [red, white];
        const binaryColorDomain = [true, undefined]
        
        const ordinalColorRange = [orange, purple, teal, yellow, green]
        // const ordinalColorDomain = ["ABC", "DNASE", "H3K27AC", "CHiCAGO", "ChromHMM"]
        const ordinalColorDomain = ["ABC", "DNASE", "H3K27AC", "CHiCAGO", "ChromHMM"]
        

        const lineOfEvidenceColorScale = mapColors(ordinalColorDomain, ordinalColorRange);
        const t2DColorScale = mapColors(binaryColorDomain, binaryColorRange);
        
        function mapColors(domain, range){
            let map = d3.map()
            for (let i = 0; i < domain.length; i++){
                for (let j = 0; j< range.length; j++){
                map.set(domain[i], range[i])
                }
            }
            return map
        }

        const colorScales = [
            {
               scale: lineOfEvidenceColorScale,
               attribute: "lineOfEvidence",
               label: "Line of Evidence",
               active: true 
            }, {
                scale: t2DColorScale,
                attribute: "tissue",
                label: "T2D-related Tissues",
                active: false 
             }
          ]
        


        export {
            white,
            black,
            grey,
            darkgrey,
            red,
            darkred,
            orange,
            blue,
            green,
            purple,
            yellow,
            teal,
            colorScales,
            lineOfEvidenceColorScale,
            t2DColorScale,
            nodeStrokeColor,
            baseNodeOpacity,
            nodeOpacity

        }