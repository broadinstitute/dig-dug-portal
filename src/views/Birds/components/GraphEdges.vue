<g id="edges" class="stat-only">
    <!-- Direct genetic support: annotations combine with associations upstream of the genes -->
    <path d="M302.08 229.5 L475.1 224.07 L475.21 227.56 L487.02 221.19 L474.84 215.57 L474.95 219.07 L301.92 224.5 Z" class="edge falcon supportHigh" data-method="falcon"/>
    <path d="M301.89 265.85 L583.01 282.81 L582.76 286.96 L595.1 281.69 L583.48 274.98 L583.23 279.12 L302.11 262.15 Z" class="edge falcon supportMedium" data-method="falcon"/>
    
    <!-- Indirect support: associated genes and gene annotations -> relevant genes -->
    <path d="M523.95 258 L523.95 350 L519 350 L525 362 L531 350 L526.05 350 L526.05 258 Z" class="edge pigean" data-method="pigean"/>
    <path d="M302.55 452.44 L476.76 413.38 L477.52 416.79 L487.92 408.31 L474.9 405.08 L475.66 408.5 L301.45 447.56 Z" class="edge dataEdge pigean supportHigh" data-method="pigean"/>
    <path d="M302.51 442.14 L589.37 313.55 L591.31 317.88 L599.81 307.5 L586.41 306.93 L588.35 311.27 L301.49 439.86 Z" class="edge dataEdge pigean supportLow" data-method="pigean"/>          
    
    <!-- Latent genetic factors: associated and relevant genes -> latent factors -->
    <path d="M562.86 224.14 L759.47 232.11 L759.34 235.51 L771.57 230 L759.82 223.52 L759.69 226.92 L563.07 218.94 Z" class="edge eaggl membershipEdge loadingStrong" data-method="eaggl"/>
    <path d="M561.28 388.59 L784.28 307.65 L785.77 311.73 L795 302 L781.67 300.45 L783.16 304.54 L560.16 385.48 Z" class="edge eaggl membershipEdge loadingMedium" data-method="eaggl"/>
    <path d="M697.58 312.68 L778.6 355.67 L776.8 359.08 L790.21 359.4 L782.42 348.48 L780.62 351.88 L699.59 308.88 Z" class="edge eaggl membershipEdge loadingHigh" data-method="eaggl"/>
    <path d="M558.05 418.8 L768.86 530.4 L766.59 534.69 L780 535 L772.2 524.08 L769.93 528.37 L559.12 416.76 Z" class="edge eaggl membershipEdge loadingLow" data-method="eaggl"/>
</g>