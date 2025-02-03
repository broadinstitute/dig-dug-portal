import * as d3 from 'd3';

// umap data chache
class SharedUmapData {
    constructor() {
        this.groups = new Map();
    }

    initPoints(group, points) {
        if(!this.groups.has(group)){
            const numPoints = points.length;
        
            // positions = [x1, y1, x2, y2, x3, y3, ...]
            const positions = new Float32Array(points.length * 2);
            let idx = 0;
            for (let i = 0; i < points.length; i++) {
                positions[idx++] = points[i].X;
                positions[idx++] = points[i].Y;
            }

            // build quadtree
            const quadtree = d3.quadtree()
                .x(d => d.X)
                .y(d => d.Y)
                .addAll(points);

            const instances = 0;

            this.groups.set(group, {
                numPoints,
                positions,
                quadtree,
                instances
            })
        }else{
            this.groups.get(group).instances++;
        }
        console.log('UMAP GROUPS', this.groups)
    }

    getPositions(group) {
        const data = this.groups.get(group);
        return data ? data.positions : null;
    }

    getQuadtree(group) {
        const data = this.groups.get(group);
        return data ? data.quadtree : null;
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
