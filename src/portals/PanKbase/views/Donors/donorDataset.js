import { prepareDataset } from "./datasetUtils";

export const DEFAULT_DONOR_METADATA_SOURCE = "https://bioindex-dev.pankbase.org/api/raw/file/functional_data/functional_dataset_v2/meta-data.merged.pankbase.txt";

export async function loadDonorDataset(source = DEFAULT_DONOR_METADATA_SOURCE, options = {}) {
    return prepareDataset(source, options);
}
