# Prototype Note#1
Branch: BCH-kyuryung

## Goal
Phase 1 focused on porting the three mockup pages into the existing Vue 2 portal structure as static prototype pages.

## Implemented
### KrFront
- Landing page mockup ported into Template.vue
- Basic search UI renders
- Navigation partially working

### KrPhenotype
- Main sections render
- Partial information hierarchy applied

### KrVariant
- Layout largely matches mockup
- Acceptable for prototype demo

## Current Issues
### KrFront
- Outer spacing and left padding still insufficient
- Panels feel too close to screen edges

### KrPhenotype
- Layout partially fixed but still needs refinement

### KrVariant
- Density toggle not interactive
- Background grid not aligned with genomic scale

## Not Implemented Yet
- No backend/API integration
- Static data only
- No dynamic behavior

## Design Intent
- Front page should have more outer margin and inner padding
- Variant density should support All / Affected / Proband toggle
- Background grid should reflect genomic coordinate scale
- Phenotype page should emphasize hierarchy (query → cohort → gene → disease → phenotype)

## Next Steps
1. Fix KrFront spacing
2. Improve KrPhenotype layout
3. Implement density toggle behavior
4. Build local backend
5. Connect API

## Files Modified
- src/views/KrFront/Template.vue
- src/views/KrPhenotype/Template.vue
- src/views/KrVariant/Template.vue

