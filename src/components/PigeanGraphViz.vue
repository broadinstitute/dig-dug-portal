<template>
    <div class="pigean-graph-viz">
        <div class="network-wrapper">
            <div class="table-container">
                <b-table 
                    striped 
                    hover 
                    :items="tableData" 
                    :fields="tableFields"
                    small
                    responsive
                    class="nodes-table"
                >
                    <template v-slot:cell(node)="row">
                        <span 
                            :class="`node-name-${row.item.shape}`"
                            @mouseenter="showHoverPopup(row.item, row.index, $event)"
                            @mouseleave="hideHoverPopup"
                            @click.stop="showClickPopup(row.item.id)"
                            style="cursor: pointer;"
                        >
                            {{ row.item.label }}
                        </span>
                    </template>
                    <template v-slot:cell(connectedNodes)="row">
                        <div 
                            class="connected-nodes-list"
                            @mouseenter="showHoverPopup(row.item, row.index, $event)"
                            @mouseleave="hideHoverPopup"
                            @click.stop="showClickPopup(row.item.id)"
                            style="cursor: pointer;"
                        >
                            <span 
                                v-for="(connected, idx) in row.item.displayedConnected" 
                                :key="idx"
                                :class="`connected-node-${connected.shape}`"
                            >
                                {{ connected.label }}<span v-if="idx < row.item.displayedConnected.length - 1">, </span>
                            </span>
                            <span 
                                v-if="row.item.hasMore" 
                                class="show-more-link"
                                @click.stop="toggleShowMore(row.item.id)"
                            >
                                {{ row.item.showMore ? ' (show less)' : '... show more (' + row.item.remainingCount + ')' }}
                            </span>
                        </div>
                    </template>
                </b-table>
            </div>
            <div class="network-wrapper-inner">
                <div ref="networkContainer" id="mynetwork" class="network-container"></div>
            </div>
            <!-- Right Column: Zoom UI -->
            <div class="network-zoom-column">
                <div class="zoom-controls-vertical">
                    <input 
                        type="range" 
                        id="zoomSlider" 
                        class="zoom-slider-vertical" 
                        min="0.1" 
                        max="2.0" 
                        step="0.05"
                        :value="zoomLevel"
                        @input="updateZoom($event.target.value)"
                        orient="vertical"
                    />
                    <span id="zoomPercentage" class="zoom-percentage-vertical">{{ Math.round(zoomLevel * 100) }}%</span>
                    <div class="zoom-buttons-vertical">
                        <button class="btn-zoom-vertical" @click="fitToScreen" title="Fit network to screen">
                            <b-icon icon="arrows-angle-contract"></b-icon>
                        </button>
                        <button class="btn-zoom-vertical" @click="centerNetwork" title="Center network">
                            <b-icon icon="bullseye"></b-icon>
                        </button>
                        <button class="btn-zoom-vertical" @click="downloadNetworkImage" title="Download network image">
                            <b-icon icon="download"></b-icon>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hover Popup (small, follows mouse) -->
        <div 
            id="hoverPopup" 
            class="hover-popup"
            @mouseenter="cancelHidePopup"
            @mouseleave="hideHoverPopup"
        >
            <div id="hoverPopupNetwork" class="hover-popup-network"></div>
        </div>

        <!-- Click Popup (large, centered, stays open) -->
        <div 
            v-if="isClickPopupOpen" 
            class="click-popup-overlay"
            @click.self="hideClickPopup"
        >
            <div class="click-popup">
                <div class="click-popup-content">
                    <div id="clickPopupNetwork" class="click-popup-network"></div>
                </div>
                <div class="click-popup-controls">
                    <button 
                        class="click-popup-close"
                        @click="hideClickPopup"
                        title="Close"
                    >
                        ✕
                    </button>
                    <div class="click-popup-zoom-controls">
                        <input 
                            type="range" 
                            id="clickPopupZoomSlider" 
                            class="zoom-slider-vertical" 
                            min="0.1" 
                            max="2.0" 
                            step="0.05"
                            :value="clickPopupZoomLevel"
                            @input="updateClickPopupZoom($event.target.value)"
                            orient="vertical"
                        />
                        <span class="zoom-percentage-vertical">{{ Math.round(clickPopupZoomLevel * 100) }}%</span>
                        <div class="zoom-buttons-vertical">
                            <button class="btn-zoom-vertical" @click="fitClickPopupNetwork" title="Fit network to screen">
                                <b-icon icon="arrows-angle-contract"></b-icon>
                            </button>
                            <button class="btn-zoom-vertical" @click="centerClickPopupNetwork" title="Center network">
                                <b-icon icon="bullseye"></b-icon>
                            </button>
                            <button class="btn-zoom-vertical" @click="downloadClickPopupImage" title="Download network image">
                                <b-icon icon="download"></b-icon>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { Network, DataSet } from "vis-network";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

export default Vue.component("PigeanGraphViz", {
    props: {
        phenotypeId: {
            type: String,
        },
        genesetSize: {
            type: String,
            default: "small"
        },
        sigma: {
            type: Number,
            default: 2
        }
    },
    data() {
        return {
            network: null,
            nodes: null,
            edges: null,
            originalNodes: null,
            originalEdges: null,
            hasPositions: false,
            zoomLevel: 1.0,
            expandedNodes: {}, // Track which nodes have "show more" expanded
            hoverPopupNetwork: null, // Network instance for hover popup
            clickPopupNetwork: null, // Network instance for click popup
            popupHideTimeout: null, // Timeout for hiding popup
            mousePosition: { x: 0, y: 0 }, // Track mouse position
            isClickPopupOpen: false, // Track if click popup is open
            clickPopupNodeId: null, // Track which node is shown in click popup
            clickPopupZoomLevel: 1.0 // Track zoom level for click popup
        };
    },
    computed: {
        tableFields() {
            return [
                {
                    key: 'node',
                    label: 'Node',
                    sortable: false
                },
                {
                    key: 'connectedNodes',
                    label: 'Connected Nodes',
                    sortable: false
                }
            ];
        },
        tableData() {
            if (!this.originalNodes || !this.originalEdges) {
                return [];
            }

            // Build connection map
            const connections = {};
            this.originalNodes.forEach(node => {
                connections[node.id] = [];
            });

            // Find all connected nodes
            this.originalEdges.forEach(edge => {
                const fromNode = this.originalNodes.find(n => n.id === edge.from);
                const toNode = this.originalNodes.find(n => n.id === edge.to);
                
                if (fromNode && toNode) {
                    if (!connections[edge.from].find(n => n.id === toNode.id)) {
                        connections[edge.from].push({
                            id: toNode.id,
                            label: toNode.label || toNode.id,
                            shape: toNode.shape || 'dot',
                            size: toNode.size || 10
                        });
                    }
                    if (!connections[edge.to].find(n => n.id === fromNode.id)) {
                        connections[edge.to].push({
                            id: fromNode.id,
                            label: fromNode.label || fromNode.id,
                            shape: fromNode.shape || 'dot',
                            size: fromNode.size || 10
                        });
                    }
                }
            });

            // Create table data with sorting
            const tableItems = this.originalNodes.map(node => {
                const connected = connections[node.id] || [];
                const isExpanded = this.expandedNodes[node.id] || false;
                const displayedCount = isExpanded ? connected.length : Math.min(5, connected.length);
                const displayedConnected = connected.slice(0, displayedCount);
                const hasMore = connected.length > 5;
                const remainingCount = Math.max(0, connected.length - 5);

                return {
                    id: node.id,
                    label: node.label || node.id,
                    shape: node.shape || 'dot',
                    size: node.size || 10,
                    connected: connected,
                    displayedConnected: displayedConnected,
                    hasMore: hasMore,
                    showMore: isExpanded,
                    remainingCount: remainingCount
                };
            });

            // Sort: squares first, then dots, then by size (biggest first)
            tableItems.sort((a, b) => {
                // First sort by shape: square/box/diamond first, then dot/circle
                const shapeOrderA = (a.shape === 'square' || a.shape === 'box' || a.shape === 'diamond') ? 1 : 2;
                const shapeOrderB = (b.shape === 'square' || b.shape === 'box' || b.shape === 'diamond') ? 1 : 2;
                
                if (shapeOrderA !== shapeOrderB) {
                    return shapeOrderA - shapeOrderB;
                }
                
                // Then sort by size (biggest first)
                return b.size - a.size;
            });

            return tableItems;
        }
    },
    watch: {
        phenotypeId: {
            handler(newPhenotypeId) {
                if (newPhenotypeId) {
                    this.loadAndVisualize(newPhenotypeId);
                }
            }
        }
    },
    mounted() {
        if (this.phenotypeId) {
            this.loadAndVisualize(this.phenotypeId);
        }
    },
    beforeDestroy() {
        if (this.network) {
            this.network.destroy();
        }
        if (this.hoverPopupNetwork) {
            this.hoverPopupNetwork.destroy();
        }
        if (this.clickPopupNetwork) {
            this.clickPopupNetwork.destroy();
        }
        if (this.popupHideTimeout) {
            clearTimeout(this.popupHideTimeout);
        }
    },
    methods: {
        buildApiUrl(phenotypeId) {
            const baseUrl = `${BIO_INDEX_HOST}/api/bio/query/pigean-graph`;
            const encodedPhenotype = encodeURIComponent(phenotypeId);
            return `${baseUrl}?q=${encodedPhenotype}%2C${this.sigma}%2C${this.genesetSize}`;
        },
        prepareNodes(nodeData) {
            return nodeData.map(node => {
                // Preserve ALL original properties from the data model
                const nodeObj = {
                    ...node,  // Spread all original properties first
                    id: node.id,
                    label: String(node.label || node.id || ''), // Ensure label is always a string
                };
                
                // Only add fixed property if positions exist (for vis-network)
                if (this.hasPositions) {
                    nodeObj.fixed = {
                        x: true,
                        y: true
                    };
                } else {
                    nodeObj.fixed = {
                        x: false,
                        y: false
                    };
                }
                
                return nodeObj;
            });
        },
        prepareEdges(edgeData) {
            return edgeData.map(edge => {
                // Preserve ALL original properties from the data model
                const edgeObj = {
                    ...edge,  // Spread all original properties first
                    from: edge.from,
                    to: edge.to,
                    width: Math.max(1, (edge.width || 1) * 2), // Scale width for visibility
                };
                
                // Only add smooth property if it doesn't exist (for vis-network)
                if (!edgeObj.smooth) {
                    edgeObj.smooth = {
                        type: 'continuous',
                        roundness: 0.5
                    };
                }
                
                return edgeObj;
            });
        },
        createNetwork(nodeData, edgeData) {

            console.log("nodeData", nodeData);
            console.log("edgeData", edgeData);

            const container = this.$refs.networkContainer || document.getElementById('mynetwork');
            
            if (!container) {
                console.error("Network container not found");
                return;
            }

            // Create datasets
            this.nodes = new DataSet(nodeData);
            this.edges = new DataSet(edgeData);

            const networkData = {
                nodes: this.nodes,
                edges: this.edges
            };

            const options = {
                nodes: {
                    borderWidth: 2,
                    shadow: false,
                    font: {
                        size: 12,
                        face: 'Arial'
                    }
                },
                edges: {
                    shadow: false,
                    smooth: {
                        type: 'continuous',
                        roundness: 0.5
                    }
                },
                physics: {
                    enabled: !this.hasPositions,
                    stabilization: {
                        enabled: !this.hasPositions,
                        iterations: 200,
                        fit: true
                    },
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.1,
                        springLength: 200,
                        springConstant: 0.04,
                        damping: 0.09
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    zoomView: false,
                    dragView: true,
                    zoomSpeed: 1,
                    navigationButtons: false
                }
            };

            // Create new network or update existing one
            if (this.network === null) {
                this.network = new Network(container, networkData, options);

                // Disable physics after stabilization if it was enabled
                if (!this.hasPositions) {
                    this.network.on("stabilizationEnd", () => {
                        this.network.setOptions({ physics: false });
                    });
                }

                // Fit to screen initially
                this.network.fit({
                    animation: {
                        duration: 0
                    }
                });
                this.updateZoomSlider();

                // Listen for zoom changes from user interaction
                this.network.on("zoom", () => {
                    this.updateZoomSlider();
                });
            } else {
                // Update existing network
                this.network.setData(networkData);
                // Ensure options are maintained (especially to prevent default colors)
                this.network.setOptions(options);
                if (!this.hasPositions) {
                    this.network.on("stabilizationEnd", () => {
                        this.network.setOptions({ physics: false });
                    });
                }
                // Fit to screen when updating
                setTimeout(() => {
                    this.network.fit({
                        animation: {
                            duration: 0
                        }
                    });
                    this.updateZoomSlider();
                }, 100);
            }
        },
        updateZoomSlider() {
            if (!this.network) return;

            const currentScale = this.network.getScale();
            const clampedScale = Math.max(0.1, Math.min(2.0, currentScale));
            this.zoomLevel = clampedScale;
            this.updateCursorForZoom(clampedScale);
        },
        updateZoom(value) {
            const scale = parseFloat(value);
            this.setZoom(scale);
        },
        setZoom(scale) {
            if (!this.network) return;

            this.network.moveTo({
                scale: scale,
                animation: {
                    duration: 0
                }
            });
            this.zoomLevel = scale;
            this.updateCursorForZoom(scale);
        },
        updateCursorForZoom(scale) {
            const container = this.$refs.networkContainer || document.getElementById('mynetwork');
            if (!container) return;

            // Change cursor to grab when zoomed in (scale > 1.0)
            if (scale > 1.0) {
                container.style.cursor = 'grab';
            } else {
                container.style.cursor = 'default';
            }
        },
        fitToScreen() {
            if (!this.network) return;
            this.network.fit({
                animation: {
                    duration: 0
                }
            });
            // Update slider immediately
            this.updateZoomSlider();
        },
        centerNetwork() {
            if (!this.network) return;
            // Center the network without changing zoom level
            const currentScale = this.network.getScale();
            this.network.moveTo({
                position: { x: 0, y: 0 },
                scale: currentScale,
                animation: {
                    duration: 300
                }
            });
        },
        downloadNetworkImage() {
            if (!this.network) return;
            try {
                // Check if getBase64Image method exists, if not use canvas directly
                let dataUrl;
                if (typeof this.network.getBase64Image === 'function') {
                    dataUrl = this.network.getBase64Image("image/png", 1.0);
                } else {
                    // Fallback: get canvas from the network container
                    const networkContainer = this.$refs.networkContainer || document.getElementById('mynetwork');
                    if (networkContainer) {
                        const canvas = networkContainer.querySelector('canvas');
                        if (canvas) {
                            dataUrl = canvas.toDataURL("image/png");
                        } else {
                            throw new Error('Canvas not found in network container');
                        }
                    } else {
                        throw new Error('Network container not found');
                    }
                }
                
                const link = document.createElement("a");
                link.download = `network-${Date.now()}.png`;
                link.href = dataUrl;
                // Append to body, click, then remove
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Error downloading network image:', error);
            }
        },
        fitClickPopupNetwork() {
            if (!this.clickPopupNetwork) return;
            this.clickPopupNetwork.fit({
                animation: {
                    duration: 300
                }
            });
            this.updateClickPopupZoomSlider();
        },
        centerClickPopupNetwork() {
            if (!this.clickPopupNetwork) return;
            // Center the network without changing zoom level
            const currentScale = this.clickPopupNetwork.getScale();
            this.clickPopupNetwork.moveTo({
                position: { x: 0, y: 0 },
                scale: currentScale,
                animation: {
                    duration: 300
                }
            });
        },
        downloadClickPopupImage() {
            if (!this.clickPopupNetwork) return;
            try {
                // Check if getBase64Image method exists, if not use canvas directly
                let dataUrl;
                if (typeof this.clickPopupNetwork.getBase64Image === 'function') {
                    dataUrl = this.clickPopupNetwork.getBase64Image("image/png", 1.0);
                } else {
                    // Fallback: get canvas from the network container
                    const popupContainer = document.getElementById('clickPopupNetwork');
                    if (popupContainer) {
                        const canvas = popupContainer.querySelector('canvas');
                        if (canvas) {
                            dataUrl = canvas.toDataURL("image/png");
                        } else {
                            throw new Error('Canvas not found in popup network container');
                        }
                    } else {
                        throw new Error('Popup network container not found');
                    }
                }
                
                const link = document.createElement("a");
                link.download = `network-popup-${Date.now()}.png`;
                link.href = dataUrl;
                // Append to body, click, then remove
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Error downloading popup network image:', error);
            }
        },
        updateClickPopupZoom(value) {
            const scale = parseFloat(value);
            this.setClickPopupZoom(scale);
        },
        setClickPopupZoom(scale) {
            if (!this.clickPopupNetwork) return;
            this.clickPopupNetwork.moveTo({
                scale: scale,
                animation: {
                    duration: 0
                }
            });
            this.clickPopupZoomLevel = scale;
        },
        updateClickPopupZoomSlider() {
            if (!this.clickPopupNetwork) return;
            const currentScale = this.clickPopupNetwork.getScale();
            const clampedScale = Math.max(0.1, Math.min(2.0, currentScale));
            this.clickPopupZoomLevel = clampedScale;
        },
        toggleShowMore(nodeId) {
            this.$set(this.expandedNodes, nodeId, !this.expandedNodes[nodeId]);
        },
        createHoverPopupNetwork(nodeId) {
            if (!this.originalNodes || !this.originalEdges) {
                return;
            }

            // Find the node
            const filterNode = this.originalNodes.find(node =>
                node.id === nodeId
            );

            if (!filterNode) {
                return;
            }

            // Find all nodes connected to the filter node
            const connectedNodeIds = new Set([nodeId]);

            // Find edges connected to the filter node
            this.originalEdges.forEach(edge => {
                if (edge.from === nodeId || edge.to === nodeId) {
                    connectedNodeIds.add(edge.from);
                    connectedNodeIds.add(edge.to);
                }
            });

            // Find all edges between connected nodes
            const allConnectedEdges = this.originalEdges.filter(edge => {
                return connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to);
            });

            // Filter nodes to only include connected ones
            const filteredNodes = this.originalNodes.filter(node => connectedNodeIds.has(node.id));

            // Prepare filtered data
            const preparedNodes = this.prepareNodes(filteredNodes);
            const preparedEdges = this.prepareEdges(allConnectedEdges);

            // Create network data
            const popupNetworkData = {
                nodes: new DataSet(preparedNodes),
                edges: new DataSet(preparedEdges)
            };

            const popupOptions = {
                nodes: {
                    borderWidth: 1,
                    shadow: false,
                    font: {
                        size: 10,
                        face: 'Arial'
                    }
                },
                edges: {
                    shadow: false,
                    smooth: {
                        type: 'continuous',
                        roundness: 0.5
                    }
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 50,
                        fit: true
                    },
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.1,
                        springLength: 200,
                        springConstant: 0.04,
                        damping: 0.09
                    }
                },
                interaction: {
                    hover: false,
                    zoomView: false,
                    dragView: false,
                    tooltipDelay: 0
                },
                width: '500px',
                height: '500px'
            };

            const popupContainer = document.getElementById('hoverPopupNetwork');
            if (!popupContainer) {
                return;
            }

            popupContainer.innerHTML = ''; // Clear previous network

            // Destroy previous network if it exists
            if (this.hoverPopupNetwork) {
                this.hoverPopupNetwork.destroy();
            }

            this.hoverPopupNetwork = new Network(popupContainer, popupNetworkData, popupOptions);

            // Disable physics after stabilization
            this.hoverPopupNetwork.on("stabilizationEnd", () => {
                this.hoverPopupNetwork.setOptions({ physics: false });
            });
        },
        showHoverPopup(item, index, event) {
            if (!item || !event) {
                return;
            }

            // Store mouse position
            this.mousePosition = {
                x: event.clientX,
                y: event.clientY
            };

            // Clear any pending hide timeout
            if (this.popupHideTimeout) {
                clearTimeout(this.popupHideTimeout);
                this.popupHideTimeout = null;
            }

            const popup = document.getElementById('hoverPopup');

            if (!popup) {
                return;
            }

            // Create filtered network
            try {
                this.createHoverPopupNetwork(item.id);
            } catch (error) {
                console.error('Error creating popup network:', error);
            }

            // Position popup near mouse cursor
            const offsetX = 15;
            const offsetY = 15;
            const popupWidth = 530; // 500px network + 30px padding
            const popupHeight = 530; // 500px network + 30px padding

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const spaceRight = viewportWidth - this.mousePosition.x;
            const spaceLeft = this.mousePosition.x;
            const spaceBelow = viewportHeight - this.mousePosition.y;
            const spaceAbove = this.mousePosition.y;

            let finalX, finalY;

            // Handle horizontal positioning
            if (spaceRight >= popupWidth + offsetX) {
                finalX = this.mousePosition.x + offsetX;
            } else if (spaceLeft >= popupWidth + offsetX) {
                finalX = this.mousePosition.x - popupWidth - offsetX;
            } else {
                finalX = viewportWidth - popupWidth - 10;
            }

            // Handle vertical positioning
            if (spaceBelow >= popupHeight + offsetY) {
                finalY = this.mousePosition.y + offsetY;
            } else if (spaceAbove >= popupHeight + offsetY) {
                finalY = this.mousePosition.y - popupHeight - offsetY;
            } else {
                finalY = Math.max(10, viewportHeight - popupHeight - 10);
            }

            // Final bounds check
            finalX = Math.max(10, Math.min(finalX, viewportWidth - popupWidth - 10));
            finalY = Math.max(10, Math.min(finalY, viewportHeight - popupHeight - 10));

            popup.style.left = finalX + 'px';
            popup.style.top = finalY + 'px';
            popup.classList.add('show');
        },
        hideHoverPopup() {
            if (this.popupHideTimeout) {
                clearTimeout(this.popupHideTimeout);
            }
            this.popupHideTimeout = setTimeout(() => {
                const popup = document.getElementById('hoverPopup');
                if (popup) {
                    popup.classList.remove('show');
                }
                this.popupHideTimeout = null;
            }, 200);
        },
        cancelHidePopup() {
            if (this.popupHideTimeout) {
                clearTimeout(this.popupHideTimeout);
                this.popupHideTimeout = null;
            }
        },
        showClickPopup(nodeId) {
            if (!this.originalNodes || !this.originalEdges) {
                return;
            }

            this.clickPopupNodeId = nodeId;
            this.isClickPopupOpen = true;

            // Wait for DOM to update, then create network
            this.$nextTick(() => {
                this.createClickPopupNetwork(nodeId);
            });
        },
        hideClickPopup() {
            this.isClickPopupOpen = false;
            this.clickPopupNodeId = null;
            
            // Destroy network when closing
            if (this.clickPopupNetwork) {
                this.clickPopupNetwork.destroy();
                this.clickPopupNetwork = null;
            }
        },
        createClickPopupNetwork(nodeId) {
            if (!this.originalNodes || !this.originalEdges) {
                return;
            }

            // Find the node
            const filterNode = this.originalNodes.find(node =>
                node.id === nodeId
            );

            if (!filterNode) {
                return;
            }

            // Find all nodes connected to the filter node
            const connectedNodeIds = new Set([nodeId]);

            // Find edges connected to the filter node
            this.originalEdges.forEach(edge => {
                if (edge.from === nodeId || edge.to === nodeId) {
                    connectedNodeIds.add(edge.from);
                    connectedNodeIds.add(edge.to);
                }
            });

            // Find all edges between connected nodes
            const allConnectedEdges = this.originalEdges.filter(edge => {
                return connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to);
            });

            // Filter nodes to only include connected ones
            const filteredNodes = this.originalNodes.filter(node => connectedNodeIds.has(node.id));

            // Prepare filtered data
            const preparedNodes = this.prepareNodes(filteredNodes);
            const preparedEdges = this.prepareEdges(allConnectedEdges);

            // Create network data
            const popupNetworkData = {
                nodes: new DataSet(preparedNodes),
                edges: new DataSet(preparedEdges)
            };

            const popupOptions = {
                nodes: {
                    borderWidth: 2,
                    shadow: false,
                    font: {
                        size: 12,
                        face: 'Arial'
                    }
                },
                edges: {
                    shadow: false,
                    smooth: {
                        type: 'continuous',
                        roundness: 0.5
                    }
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 200,
                        fit: true
                    },
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.1,
                        springLength: 200,
                        springConstant: 0.04,
                        damping: 0.09
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    zoomView: true,
                    dragView: true,
                    zoomSpeed: 1,
                    navigationButtons: false
                }
            };

            const popupContainer = document.getElementById('clickPopupNetwork');
            if (!popupContainer) {
                return;
            }

            popupContainer.innerHTML = ''; // Clear previous network

            // Destroy previous network if it exists
            if (this.clickPopupNetwork) {
                this.clickPopupNetwork.destroy();
            }

            this.clickPopupNetwork = new Network(popupContainer, popupNetworkData, popupOptions);

            // Disable physics after stabilization
            this.clickPopupNetwork.on("stabilizationEnd", () => {
                this.clickPopupNetwork.setOptions({ physics: false });
                this.updateClickPopupZoomSlider();
            });

            // Listen for zoom changes from user interaction
            this.clickPopupNetwork.on("zoom", () => {
                this.updateClickPopupZoomSlider();
            });

            // Initialize zoom slider
            this.clickPopupZoomLevel = 1.0;
        },
        async loadAndVisualize(phenotypeId) {
            if (!phenotypeId) {
                return;
            }

            try {
                const apiUrl = this.buildApiUrl(phenotypeId);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data.data || data.data.length === 0) {
                    throw new Error('No data returned from API');
                }

                const graphData = data.data[0];

                console.log("graphData", graphData);

                // Store original data
                this.originalNodes = graphData.nodes;
                this.originalEdges = graphData.edges;

                console.log("originalNodes", this.originalNodes);

                // Check if nodes have positions
                this.hasPositions = graphData.nodes.some(node => node.x !== undefined && node.y !== undefined);

                // Prepare and visualize
                const preparedNodes = this.prepareNodes(graphData.nodes);
                const preparedEdges = this.prepareEdges(graphData.edges);

                this.createNetwork(preparedNodes, preparedEdges);

                // Log the actual data used to render (after initial creation)
                setTimeout(() => {
                    const datasetNodes = this.nodes.get();
                    console.log("=== RENDERING INITIAL NETWORK ===");
                    console.log("Nodes being rendered:", datasetNodes);
                }, 500);

            } catch (error) {
                console.error('Error loading graph data:', error);
            }
        }
    }
});
</script>

<style scoped>
.pigean-graph-viz {
    width: 100%;
    height: 600px;
}

.network-wrapper {
    display: flex;
    width: 100%;
    height: 600px;
    gap: 0;
}

.table-container {
    width: calc(30% - 50px);
    height: 600px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: white;
    overflow-y: auto;
    padding: 10px;
}

.nodes-table {
    font-size: 12px;
}

.connected-nodes-list {
    word-wrap: break-word;
}

.show-more-link {
    color: #1976d2;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 5px;
}

.show-more-link:hover {
    color: #1565c0;
}

.node-name-square,
.node-name-box,
.node-name-diamond {
    color: #f57c00;
    font-weight: 500;
}

.node-name-dot,
.node-name-circle {
    color: #388e3c;
    font-weight: 500;
}

.connected-node-square,
.connected-node-box,
.connected-node-diamond {
    color: #f57c00;
}

.connected-node-dot,
.connected-node-circle {
    color: #388e3c;
}

.network-wrapper-inner {
    position: relative;
    min-width: 0;
    width: 70%;
    height: 600px;
}

.network-container {
    min-width: 0;
    width: 100%;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: white;
    position: relative;
}

.network-zoom-column {
    width: 50px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 5px;
    justify-content: flex-start;
    border-left: 1px solid #e0e0e0;
    margin-left: 15px;
}

.zoom-controls-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.zoom-slider-vertical {
    -webkit-appearance: slider-vertical;
    appearance: slider-vertical;
    width: 20px;
    height: 250px;
    padding: 0 5px;
    cursor: pointer;
}

.zoom-percentage-vertical {
    font-size: 11px;
    font-weight: 500;
    color: #1976d2;
    writing-mode: horizontal-tb;
    text-align: center;
    min-width: 40px;
}

.zoom-buttons-vertical {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
}

.btn-zoom-vertical {
    padding: 6px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    background-color: #f5f5f5;
    color: #333;
    transition: background-color 0.2s;
    width: 100%;
}

.btn-zoom-vertical:hover {
    background-color: #e0e0e0;
}

.hover-popup {
    position: fixed;
    background-color: white;
    border: 2px solid #1976d2;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    padding: 15px;
    display: none;
    pointer-events: none;
}

.hover-popup.show {
    display: block;
    pointer-events: auto;
}

.hover-popup-network {
    width: 500px;
    height: 500px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.click-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

.click-popup {
    position: relative;
    width: 80%;
    height: 80%;
    background-color: white;
    border: 2px solid #1976d2;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: row;
    box-sizing: border-box;
    padding: 15px;
    gap: 15px;
}

.click-popup-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.click-popup-network {
    width: 100%;
    height: 100%;
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 0;
}

.click-popup-controls {
    width: 50px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 5px;
    justify-content: flex-start;
    border-left: 1px solid #e0e0e0;
    gap: 10px;
}

.click-popup-close {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background-color: #1976d2;
    color: white;
    font-size: 10px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s;
    line-height: 1;
    margin-bottom: 10px;
}

.click-popup-close:hover {
    background-color: #1565c0;
}

.click-popup-zoom-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
}
</style>
