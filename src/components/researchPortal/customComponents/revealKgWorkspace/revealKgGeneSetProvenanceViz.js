/** vis-network helpers for gene set provenance graphs (LR layout, role-based labels). */

export const PROVENANCE_LABEL_GAP = 6;
export const PROVENANCE_LABEL_FONT_SIZE = 13;

export function estimateProvenanceLabelWidth(text, fontSize = PROVENANCE_LABEL_FONT_SIZE) {
    return Math.ceil(String(text || "").length * fontSize * 0.55);
}

export function provenanceNodeDimensions(_fullLabel, _labelPlacement, radius) {
    const dot = radius * 2;
    return { width: dot, height: dot };
}

export function classifyProvenanceNodeRoles(nodes, edges) {
    const nodeById = Object.fromEntries((nodes || []).map((node) => [node.id, node]));
    const roles = {};

    for (const node of nodes || []) {
        const type = String(node?.type || "").trim();
        if (type === "AnalysisType") {
            roles[node.id] = "analysis";
        } else if (type === "GeneSet") {
            roles[node.id] = "output";
        } else if (type === "File") {
            roles[node.id] = "source";
        }
    }

    for (const edge of edges || []) {
        const source = nodeById[edge.source];
        const target = nodeById[edge.target];
        if (!source || !target) {
            continue;
        }
        if (source.type === "File" && target.type === "AnalysisType") {
            roles[edge.source] = "source";
        }
        if (source.type === "AnalysisType" && target.type === "File") {
            roles[edge.target] = "output";
        }
        if (source.type === "AnalysisType" && target.type === "GeneSet") {
            roles[edge.target] = "output";
        }
    }

    return roles;
}

export function provenanceLayoutSpacing(nodeCount = 0) {
    if (nodeCount >= 8) {
        return { levelSeparation: 180, nodeSpacing: 30 };
    }
    if (nodeCount >= 5) {
        return { levelSeparation: 190, nodeSpacing: 34 };
    }
    return { levelSeparation: 200, nodeSpacing: 40 };
}

export function labelPlacementForRole(role) {
    if (role === "analysis") {
        return "below";
    }
    if (role === "output") {
        return "right";
    }
    return "left";
}

export function createProvenanceCtxRenderer({
    fullLabel,
    labelPlacement,
    backgroundColor,
    borderColor,
    size,
}) {
    const gap = PROVENANCE_LABEL_GAP;
    const fontSize = PROVENANCE_LABEL_FONT_SIZE;
    const font = `${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const dimensions = provenanceNodeDimensions(fullLabel, labelPlacement, size);

    return function provenanceCtxRenderer({ ctx, x, y, state }) {
        const radius = size;
        return {
            nodeDimensions: dimensions,
            drawNode() {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = backgroundColor;
                ctx.fill();
                ctx.lineWidth = state.selected ? 2 : 1;
                ctx.strokeStyle = borderColor;
                ctx.stroke();
            },
            drawExternalLabel() {
                if (!fullLabel) {
                    return;
                }
                ctx.font = font;
                ctx.fillStyle = "#33363d";
                if (labelPlacement === "left") {
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    ctx.fillText(fullLabel, x - radius - gap, y);
                    return;
                }
                if (labelPlacement === "right") {
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText(fullLabel, x + radius + gap, y);
                    return;
                }
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(fullLabel, x, y + radius + gap);
            },
        };
    };
}
