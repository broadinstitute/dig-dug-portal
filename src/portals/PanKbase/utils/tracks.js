import tracks from "@/portals/PanKbase/assets/data/pkb-atac-abc-by-celltype-genes.json";

export const TRACKS = tracks;

export async function fetchTracks() {
    return TRACKS.map((track) => ({ ...track }));
}

export default TRACKS;
