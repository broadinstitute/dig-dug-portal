import tracks from "@/portals/PanKbase/assets/data/pkb-atac-no-abc-uniformed_peaks.json";

export const TRACKS = tracks;

export async function fetchTracks() {
    return TRACKS.map((track) => ({ ...track }));
}

export default TRACKS;
