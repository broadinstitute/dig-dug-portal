import { HIERARCHY_LAYERS, hierarchyLayerIndex } from "./revealKgGraphColors.js";

/** Gene sets and traits (layers 1 & 3) are staggered to reduce edge overlap on labels. */
const STAGGERED_LAYERS = new Set([1, 3]);

export function layerStaggerOffset(layer, nodeGap) {
  return STAGGERED_LAYERS.has(layer) ? nodeGap * 0.5 : 0;
}

export function layerColumnOffset(layer, nodeVerticalGap) {
  return layerStaggerOffset(layer, nodeVerticalGap);
}

export function layerRowOffset(layer, nodeHorizontalGap) {
  return layerStaggerOffset(layer, nodeHorizontalGap);
}

function edgeWeight(edge) {
  const score = edge?.normalized_score ?? edge?.weight ?? edge?.score;
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return 0;
  }
  return Number(score);
}

/** Node ids that appear as source or target on at least one edge. */
export function connectedNodeIdSet(edges) {
  const ids = new Set();
  for (const edge of edges || []) {
    if (edge?.source) {
      ids.add(edge.source);
    }
    if (edge?.target) {
      ids.add(edge.target);
    }
  }
  return ids;
}

/** Keep only nodes that have at least one edge in `edges`. */
export function filterNodesWithConnectedEdges(nodes, edges) {
  const connected = connectedNodeIdSet(edges);
  return (nodes || []).filter((node) => node?.id && connected.has(node.id));
}

/** Count incident edges per node in the visible graph. */
export function buildNodeDegreeMap(visibleEdges) {
  const degrees = new Map();
  for (const edge of visibleEdges || []) {
    if (!edge?.source || !edge?.target) {
      continue;
    }
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  }
  return degrees;
}

/**
 * Order row nodes so the most connected sit near the center and less connected toward the ends.
 */
export function orderRowNodesCenterOut(bucket, degrees) {
  const sorted = [...bucket].sort((a, b) => {
    const degreeA = degrees.get(a.id) || 0;
    const degreeB = degrees.get(b.id) || 0;
    if (degreeA !== degreeB) {
      return degreeB - degreeA;
    }
    return String(a.label).localeCompare(String(b.label));
  });

  const count = sorted.length;
  if (count <= 1) {
    return sorted;
  }

  const ordered = new Array(count);
  let left = Math.floor((count - 1) / 2);
  let right = left;
  ordered[left] = sorted[0];

  for (let index = 1; index < count; index += 1) {
    if (index % 2 === 1) {
      right += 1;
      ordered[right] = sorted[index];
    } else {
      left -= 1;
      ordered[left] = sorted[index];
    }
  }

  return ordered;
}

/** Order row nodes left-to-right by label (case-insensitive). */
export function orderRowNodesAlphabetical(bucket) {
  return [...bucket].sort((a, b) => {
    const labelCmp = String(a.label || a.id).localeCompare(String(b.label || b.id), undefined, {
      sensitivity: "base",
    });
    if (labelCmp !== 0) {
      return labelCmp;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

function normalizeGraphNode(node) {
  const layer = hierarchyLayerIndex(node);
  if (layer < 0) {
    return null;
  }
  return {
    id: node.id,
    label: node.label || node.id,
    subtitle: node.subtitle || "",
    nodeType: node.type || node.node_type,
    layer,
    isAnchor: Boolean(node.is_anchor),
    originTags: node.origin_tags || [],
    childIds: new Set(),
  };
}

function registerChild(parentMap, parentId, childId, weight) {
  if (!parentMap.has(parentId)) {
    parentMap.set(parentId, []);
  }
  parentMap.get(parentId).push({ childId, weight });
}

function buildAdjacency(visibleNodes, visibleEdges) {
  const nodeById = new Map();
  for (const node of visibleNodes || []) {
    const normalized = normalizeGraphNode(node);
    if (normalized) {
      nodeById.set(normalized.id, normalized);
    }
  }

  const childCandidates = new Map();
  for (const edge of visibleEdges || []) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target || source.layer === target.layer) {
      continue;
    }
    if (source.layer < target.layer) {
      registerChild(childCandidates, source.id, target.id, edgeWeight(edge));
    } else {
      registerChild(childCandidates, target.id, source.id, edgeWeight(edge));
    }
  }

  const parentByChild = new Map();
  for (const [parentId, candidates] of childCandidates.entries()) {
    const sorted = [...candidates].sort((a, b) => b.weight - a.weight);
    for (const entry of sorted) {
      if (!parentByChild.has(entry.childId)) {
        parentByChild.set(entry.childId, parentId);
      }
    }
  }

  for (const [parentId, candidates] of childCandidates.entries()) {
    const parent = nodeById.get(parentId);
    if (!parent) {
      continue;
    }
    for (const entry of candidates) {
      if (parentByChild.get(entry.childId) === parentId) {
        parent.childIds.add(entry.childId);
      }
    }
  }

  return { nodeById, parentByChild, childCandidates };
}

/**
 * Column layout: Genes → Gene sets → Mechanisms → Traits (left to right).
 */
export function buildColumnLayout(visibleNodes, visibleEdges, options = {}) {
  const columnWidth = options.columnWidth ?? 220;
  const marginLeft = options.marginLeft ?? 120;
  const marginTop = options.marginTop ?? 52;
  const nodeVerticalGap = options.nodeVerticalGap ?? 30;

  const { nodeById } = buildAdjacency(visibleNodes, visibleEdges);
  if (!nodeById.size) {
    return null;
  }

  const layerBuckets = [[], [], [], []];

  for (const meta of nodeById.values()) {
    layerBuckets[meta.layer].push(meta);
  }

  const positions = new Map();
  let maxColumnCount = 0;
  layerBuckets.forEach((bucket, layer) => {
    bucket.sort((a, b) => String(a.label).localeCompare(String(b.label)));
    maxColumnCount = Math.max(maxColumnCount, bucket.length);
    const columnOffset = layerColumnOffset(layer, nodeVerticalGap);
    bucket.forEach((meta, index) => {
      positions.set(meta.id, {
        x: layer * columnWidth + marginLeft,
        y: marginTop + columnOffset + index * nodeVerticalGap,
        layer: meta.layer,
        meta,
      });
    });
  });

  const nodeMetaById = new Map(
    Array.from(nodeById.entries()).map(([id, meta]) => [
      id,
      {
        layer: meta.layer,
        isAnchor: meta.isAnchor,
        label: meta.label,
        nodeType: meta.nodeType,
        subtitle: meta.subtitle,
        originTags: meta.originTags,
      },
    ])
  );

  const hierarchyEdges = collectHierarchyEdges(visibleEdges, nodeMetaById, options.contextualEdgeIds);

  const contentHeight = marginTop + Math.max(maxColumnCount, 1) * nodeVerticalGap + 40;
  const contentWidth = marginLeft + columnWidth * 3 + 160;

  return {
    positions,
    hierarchyEdges,
    nodeMetaById,
    contentWidth,
    contentHeight,
    nodeCount: positions.size,
  };
}

const GENE_LAYER = 0;
const GENE_SET_LAYER = 1;
const MECHANISM_LAYER = 2;
const TRAIT_LAYER = 3;

/**
 * Cumulative vertical offset for a row at `compactIndex` among populated rows.
 * Gap after row 0 → 1 uses firstGap; later gaps use defaultGap.
 */
export function treeRowYOffset(compactIndex, rowGaps = {}) {
  if (compactIndex <= 0) {
    return 0;
  }
  const firstGap = rowGaps.firstGap ?? 100;
  const defaultGap = rowGaps.defaultGap ?? 200;
  let offset = 0;
  for (let i = 0; i < compactIndex; i += 1) {
    offset += i === 0 ? firstGap : defaultGap;
  }
  return offset;
}

/** Vertical center Y for a hierarchy row. */
export function treeRowY(layer, marginTop, rowHeight, populatedLayerIndices, rowGaps = null) {
  const populated = populatedLayerIndices || [];
  const compactIndex = populated.indexOf(layer);
  const gaps = rowGaps || { firstGap: rowHeight, defaultGap: rowHeight };
  if (compactIndex < 0) {
    const fallbackGap = gaps.defaultGap ?? rowHeight ?? 200;
    return marginTop + layer * fallbackGap;
  }
  return marginTop + treeRowYOffset(compactIndex, gaps);
}

/**
 * Row layout: Genes → Gene sets → Mechanisms → Traits (top to bottom).
 */
export function buildRowLayout(visibleNodes, visibleEdges, options = {}) {
  const rowHeight = options.rowHeight ?? 220;
  const rowGaps = options.rowGaps ?? null;
  const marginLeft = options.marginLeft ?? 120;
  const marginTop = options.marginTop ?? 52;
  const nodeHorizontalGap = options.nodeHorizontalGap ?? 60;

  const { nodeById } = buildAdjacency(visibleNodes, visibleEdges);
  if (!nodeById.size) {
    return null;
  }

  const layerBuckets = [[], [], [], []];

  for (const meta of nodeById.values()) {
    layerBuckets[meta.layer].push(meta);
  }

  const populatedLayerIndices = layerBuckets
    .map((bucket, layer) => (bucket.length > 0 ? layer : -1))
    .filter((layer) => layer >= 0);
  const visibleRowLayers = populatedLayerIndices.map((layer) => ({
    ...HIERARCHY_LAYERS[layer],
    layer,
  }));

  const positions = new Map();
  const fixedNodeHorizontalGap = options.fixedNodeHorizontalGap;
  const useFixedSpacing = fixedNodeHorizontalGap != null && fixedNodeHorizontalGap > 0;

  let maxRowSpan = 0;
  if (useFixedSpacing) {
    layerBuckets.forEach((bucket) => {
      if (!bucket.length) {
        return;
      }
      const rowSpan = Math.max(bucket.length - 1, 0) * fixedNodeHorizontalGap;
      maxRowSpan = Math.max(maxRowSpan, rowSpan);
    });
  } else {
    maxRowSpan = options.rowBandWidth;
    if (maxRowSpan == null || maxRowSpan <= 0) {
      maxRowSpan = 0;
      layerBuckets.forEach((bucket, layer) => {
        if (!bucket.length) {
          return;
        }
        const rowOffset = layerRowOffset(layer, nodeHorizontalGap);
        const rowSpan = rowOffset + Math.max(bucket.length - 1, 0) * nodeHorizontalGap;
        maxRowSpan = Math.max(maxRowSpan, rowSpan);
      });
    }
  }

  const bandStart = marginLeft;
  const bandEnd = marginLeft + maxRowSpan;
  const sortEdges = options.sortEdges ?? visibleEdges;
  const nodeDegrees = buildNodeDegreeMap(sortEdges);

  layerBuckets.forEach((bucket, layer) => {
    const orderedBucket = orderRowNodesCenterOut(bucket, nodeDegrees);
    const count = orderedBucket.length;
    if (!count) {
      return;
    }
    const rowOffset = layerRowOffset(layer, nodeHorizontalGap);
    orderedBucket.forEach((meta, index) => {
      let x;
      if (useFixedSpacing) {
        const rowWidth = Math.max(0, (count - 1) * fixedNodeHorizontalGap);
        const rowStart = bandStart + (maxRowSpan - rowWidth) / 2;
        x = rowStart + index * fixedNodeHorizontalGap;
      } else if (count === 1) {
        x = bandStart + maxRowSpan / 2;
      } else {
        const innerStart = bandStart + rowOffset;
        x = innerStart + (index * (bandEnd - innerStart)) / (count - 1);
      }
      positions.set(meta.id, {
        x,
        y: treeRowY(layer, marginTop, rowHeight, populatedLayerIndices, rowGaps),
        layer: meta.layer,
        meta,
      });
    });
  });

  const nodeMetaById = new Map(
    Array.from(nodeById.entries()).map(([id, meta]) => [
      id,
      {
        layer: meta.layer,
        isAnchor: meta.isAnchor,
        label: meta.label,
        nodeType: meta.nodeType,
        subtitle: meta.subtitle,
        originTags: meta.originTags,
      },
    ])
  );

  const hierarchyEdges = collectHierarchyEdges(visibleEdges, nodeMetaById, options.contextualEdgeIds);

  const contentWidth =
    marginLeft + Math.max(maxRowSpan, useFixedSpacing ? fixedNodeHorizontalGap : nodeHorizontalGap) + 160;
  const populatedRowCount = Math.max(populatedLayerIndices.length, 1);
  const rowSpan = rowGaps
    ? treeRowYOffset(Math.max(populatedLayerIndices.length - 1, 0), rowGaps)
    : rowHeight * (populatedRowCount - 1);
  const contentHeight = marginTop + rowSpan + 40;

  return {
    positions,
    hierarchyEdges,
    nodeMetaById,
    visibleRowLayers,
    populatedLayerIndices,
    contentWidth,
    contentHeight,
    nodeCount: positions.size,
  };
}

export function populatedHierarchyLayers(nodeMetaById) {
  const populated = new Set();
  for (const meta of nodeMetaById?.values() || []) {
    if (meta?.layer >= 0) {
      populated.add(meta.layer);
    }
  }
  return populated;
}

/**
 * True when the edge skips a layer that currently has visible nodes (e.g. gene → trait
 * with gene sets present). If an intermediate layer is empty, the link is not treated
 * as jumping (e.g. gene → mechanism when there are no gene sets).
 */
export function isLayerSpanJumping(sourceLayer, targetLayer, populatedLayers) {
  const minLayer = Math.min(sourceLayer, targetLayer);
  const maxLayer = Math.max(sourceLayer, targetLayer);
  if (maxLayer - minLayer <= 1) {
    return false;
  }
  for (let layer = minLayer + 1; layer < maxLayer; layer += 1) {
    if (populatedLayers.has(layer)) {
      return true;
    }
  }
  return false;
}

/** Edges flowing left-to-right across hierarchy columns (any span, not only adjacent). */
export function collectHierarchyEdges(visibleEdges, nodeMetaById, contextualEdgeIds = null) {
  const edges = [];
  const seen = new Set();
  const contextualIds = contextualEdgeIds instanceof Set ? contextualEdgeIds : new Set(contextualEdgeIds || []);
  const populatedLayers = populatedHierarchyLayers(nodeMetaById);

  for (const edge of visibleEdges || []) {
    if (!edge?.source || !edge?.target) {
      continue;
    }
    const source = nodeMetaById.get(edge.source);
    const target = nodeMetaById.get(edge.target);
    if (!source || !target || source.layer === target.layer) {
      continue;
    }

    const leftToRight = source.layer < target.layer;
    const sourceId = leftToRight ? edge.source : edge.target;
    const targetId = leftToRight ? edge.target : edge.source;
    const key = `${sourceId}→${targetId}:${edge.id || edge.family || ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    edges.push({
      edge,
      sourceId,
      targetId,
      isContextual: contextualIds.has(edge.id),
      isJumping: isLayerSpanJumping(source.layer, target.layer, populatedLayers),
    });
  }
  return edges;
}

export function hierarchyEdgeKey(entry) {
  return `${entry.sourceId}→${entry.targetId}:${entry.edge?.id || ""}`;
}

/** Jumping edges skip at least one populated hierarchy layer. */
export function isJumpingHierarchyEdge(entry) {
  return Boolean(entry?.isJumping);
}

/** True when the edge is under the pointer (node or edge hover). */
export function isHierarchyEdgeHighlighted(entry, highlight = null, hoveredNodeId = null) {
  if (highlight?.edgeKey === hierarchyEdgeKey(entry)) {
    return true;
  }
  const activeNodeId = highlight?.nodeId || hoveredNodeId || null;
  if (activeNodeId && (entry.sourceId === activeNodeId || entry.targetId === activeNodeId)) {
    return true;
  }
  return false;
}

export function isJumpingHierarchyEdgeVisible(
  entry,
  hideJumpingEdges,
  highlight = null,
  hoveredNodeId = null
) {
  if (!isJumpingHierarchyEdge(entry)) {
    return true;
  }
  if (isHierarchyEdgeHighlighted(entry, highlight, hoveredNodeId)) {
    return true;
  }
  if (!hideJumpingEdges) {
    return true;
  }
  return false;
}

/**
 * Graph options (checked = hide). At rest:
 * | Hide contextual (C) | Hide jumping (J) | Visible |
 * | on | on | adjacent active only |
 * | on | off | adjacent active + jumping active |
 * | off | on | adjacent active + non-jumping contextual |
 * | off | off | all edges |
 * Hover always reveals edges incident to the pointer, even when a hide option is on.
 */
export function isHierarchyEdgeShown(
  entry,
  { hideJumpingEdges = false, hideContextualEdges = true, highlight = null, hoveredNodeId = null } = {}
) {
  if (isHierarchyEdgeHighlighted(entry, highlight, hoveredNodeId)) {
    return true;
  }
  if (entry?.isContextual) {
    if (hideContextualEdges) {
      return false;
    }
    if (isJumpingHierarchyEdge(entry) && hideJumpingEdges) {
      return false;
    }
    return true;
  }
  if (isJumpingHierarchyEdge(entry) && hideJumpingEdges) {
    return false;
  }
  return true;
}

export function countHierarchyNodes(layout) {
  return layout?.nodeCount ?? 0;
}

export function maxHierarchyLayerCount(visibleNodes) {
  const counts = [0, 0, 0, 0];
  for (const node of visibleNodes || []) {
    const layer = hierarchyLayerIndex(node);
    if (layer >= 0 && layer < counts.length) {
      counts[layer] += 1;
    }
  }
  return Math.max(...counts, 0);
}

/** Usable horizontal span for spreading nodes in a tree row (viewport content width). */
export function computeTreeRowBandWidth(availableWidth, options = {}) {
  const marginLeft = options.marginLeft ?? 120;
  const trailingMargin = options.trailingMargin ?? 160;
  const minBand = options.minBand ?? 60;
  return Math.max(minBand, availableWidth - marginLeft - trailingMargin);
}

/** Minimum horizontal gap so angled node labels do not overlap (rough heuristic). */
export function minRowNodeHorizontalGapForNodes(visibleNodes, options = {}) {
  const charWidth = options.charWidth ?? 7;
  const baseMin = options.baseMin ?? 88;
  const cap = options.cap ?? 200;
  let longest = 0;
  for (const node of visibleNodes || []) {
    const len = String(node.label || node.id || "").length;
    longest = Math.max(longest, len);
  }
  const labelReach = Math.round(longest * charWidth * 0.72 + 48);
  return Math.max(baseMin, Math.min(cap, labelReach));
}

/** Row band width needed to fit all nodes at the given gap (ignores viewport cap). */
export function computeRequiredRowBandWidth(visibleNodes, nodeHorizontalGap) {
  const counts = [0, 0, 0, 0];
  for (const node of visibleNodes || []) {
    const layer = hierarchyLayerIndex(node);
    if (layer >= 0) {
      counts[layer] += 1;
    }
  }
  const maxCount = Math.max(...counts, 0);
  if (maxCount <= 1) {
    return 0;
  }
  const maxStagger = nodeHorizontalGap * 0.5;
  return maxStagger + Math.max(0, maxCount - 1) * nodeHorizontalGap;
}

/**
 * When a tree row has more than `fullGapMaxNodes`, tighten horizontal spacing so the
 * row fits at scale 1 instead of zooming the whole view out.
 */
export function computeRowNodeHorizontalGap(maxNodesInLayer, availableWidth, options = {}) {
  const defaultGap = options.nodeHorizontalGap ?? 60;
  const minGap = options.minNodeHorizontalGap ?? 56;
  const fullGapMaxNodes = options.fullGapMaxNodes ?? 5;
  const marginLeft = options.marginLeft ?? 120;
  const trailingMargin = options.trailingMargin ?? 160;

  if (maxNodesInLayer <= fullGapMaxNodes) {
    return defaultGap;
  }

  const fittedGap = (Math.max(1, availableWidth) - marginLeft - trailingMargin) / maxNodesInLayer;
  return Math.max(minGap, Math.min(defaultGap, fittedGap));
}
