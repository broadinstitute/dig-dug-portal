import * as d3 from 'd3';

// umap data chache
class SharedUmapData {
    constructor() {
        this.groups = new Map();
    }

    initPoints(group, points) {
        if(!this.groups.has(group)){
            const numPoints = points.length;
            const pointIndexMap = new Map();
        
            // positions = [x1, y1, z1, x2, y2, z2, ...]
            const positions = new Float32Array(points.length * 3);
            let idx = 0;
            for (let i = 0; i < points.length; i++) {
                pointIndexMap.set(points[i], i);
                positions[idx++] = points[i].X;
                positions[idx++] = points[i].Y;
                positions[idx++] = points[i].Z ?? 0;
            }

            // build quadtree
            const quadtree = d3.quadtree()
                .x(d => d.X)
                .y(d => d.Y)
                .addAll(points);

            const instances = 1;

            this.groups.set(group, {
                numPoints,
                positions,
                points,
                pointIndexMap,
                quadtree,
                instances
            })
        }else{
            this.groups.get(group).instances++;
        }
    }

    getPositions(group) {
        const data = this.groups.get(group);
        return data ? data.positions : null;
    }

    getPoints(group) {
        const data = this.groups.get(group);
        return data ? data.points : null;
    }

    getQuadtree(group) {
        const data = this.groups.get(group);
        return data ? data.quadtree : null;
    }

    getPointIndex(group, point) {
        const data = this.groups.get(group);
        return data ? data.pointIndexMap.get(point) : null;
    }

    getNumPoints(group) {
        const data = this.groups.get(group);
        return data ? data.numPoints : null;
    }

    release(group){
        if(!this.groups.has(group)) return;
        const data = this.groups.get(group);
        data.instances--;
        if(data.instances <= 0){
            this.groups.delete(group);
        }
    }
}

const sharedUmapData = new SharedUmapData();
export default sharedUmapData;
