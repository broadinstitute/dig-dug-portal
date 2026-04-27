const DEFAULT_MISSING_VALUES = new Set([
    "",
    "na",
    "n/a",
    "null",
    "none",
    "undefined",
    ".",
    "-",
]);

const DEFAULT_INFERENCE_OPTIONS = {
    sampleSize: 500,
    categoricalUniqueThreshold: 24,
    categoricalUniqueRatioThreshold: 0.2,
    numericSuccessThreshold: 0.95,
    dateSuccessThreshold: 0.9,
    booleanSuccessThreshold: 1,
    lowCardinalityNumericThreshold: 10,
};

function getFileExtension(source = "") {
    const cleanSource = source.split("?")[0].trim().toLowerCase();
    const parts = cleanSource.split(".");
    return parts.length > 1 ? parts.pop() : "";
}

function normalizeHeaderName(value, fallbackIndex, seenHeaders) {
    const baseName = String(value || "").trim() || `column_${fallbackIndex + 1}`;

    if (!seenHeaders[baseName]) {
        seenHeaders[baseName] = 1;
        return baseName;
    }

    const nextIndex = seenHeaders[baseName]++;
    return `${baseName}_${nextIndex}`;
}

function normalizeCellValue(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).replace(/\r/g, "").trim();
    return normalized === "" ? null : normalized;
}

function isMissingValue(value) {
    if (value === null || value === undefined) {
        return true;
    }

    return DEFAULT_MISSING_VALUES.has(String(value).trim().toLowerCase());
}

function splitDelimitedLine(line, delimiter) {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === "\"") {
            if (insideQuotes && nextChar === "\"") {
                current += "\"";
                index += 1;
            } else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }

        if (char === delimiter && !insideQuotes) {
            values.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function parseDelimitedText(rawText, delimiter) {
    const lines = String(rawText)
        .replace(/^\uFEFF/, "")
        .split(/\n/)
        .map((line) => line.replace(/\r$/, ""));

    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    if (!nonEmptyLines.length) {
        return [];
    }

    const seenHeaders = {};
    const headers = splitDelimitedLine(nonEmptyLines[0], delimiter).map((header, index) =>
        normalizeHeaderName(header, index, seenHeaders)
    );

    return nonEmptyLines.slice(1).map((line) => {
        const cells = splitDelimitedLine(line, delimiter);
        return headers.reduce((row, header, index) => {
            row[header] = normalizeCellValue(cells[index]);
            return row;
        }, {});
    });
}

function extractJsonRows(parsedJson) {
    if (Array.isArray(parsedJson)) {
        if (!parsedJson.length) {
            return [];
        }

        if (typeof parsedJson[0] === "object" && parsedJson[0] !== null && !Array.isArray(parsedJson[0])) {
            return parsedJson.map((row) => ({ ...row }));
        }

        return parsedJson.map((value, index) => ({
            index,
            value,
        }));
    }

    if (parsedJson && typeof parsedJson === "object") {
        const arrayKey = Object.keys(parsedJson).find((key) => Array.isArray(parsedJson[key]));
        if (arrayKey) {
            return extractJsonRows(parsedJson[arrayKey]);
        }

        return [parsedJson];
    }

    return [];
}

function scoreDelimiter(lines, delimiter) {
    const counts = lines.map((line) => splitDelimitedLine(line, delimiter).length);
    const validCounts = counts.filter((count) => count > 1);

    if (!validCounts.length) {
        return -1;
    }

    const average = validCounts.reduce((sum, count) => sum + count, 0) / validCounts.length;
    const variance =
        validCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / validCounts.length;

    return average - variance;
}

export function detectDataFormat(rawText, options = {}) {
    const fileName = options.fileName || options.source || "";
    const mimeType = (options.mimeType || "").toLowerCase();
    const extension = getFileExtension(fileName);
    const trimmed = String(rawText || "").trim();

    if (!trimmed) {
        return {
            format: "empty",
            fileType: extension || "unknown",
            delimiter: null,
            confidence: 1,
        };
    }

    if (
        extension === "json" ||
        mimeType.includes("json") ||
        trimmed.startsWith("{") ||
        trimmed.startsWith("[")
    ) {
        return {
            format: "json",
            fileType: extension || "json",
            delimiter: null,
            confidence: 0.95,
        };
    }

    if (extension === "tsv") {
        return {
            format: "delimited",
            fileType: "tsv",
            delimiter: "\t",
            confidence: 0.99,
        };
    }

    if (extension === "csv") {
        return {
            format: "delimited",
            fileType: "csv",
            delimiter: ",",
            confidence: 0.99,
        };
    }

    const sampleLines = trimmed
        .split(/\n/)
        .map((line) => line.replace(/\r$/, ""))
        .filter((line) => line.trim().length > 0)
        .slice(0, 10);

    const delimiterCandidates = [
        { fileType: "tsv", delimiter: "\t" },
        { fileType: "csv", delimiter: "," },
        { fileType: "txt", delimiter: "|" },
    ];

    const scoredCandidates = delimiterCandidates
        .map((candidate) => ({
            ...candidate,
            score: scoreDelimiter(sampleLines, candidate.delimiter),
        }))
        .sort((left, right) => right.score - left.score);

    const bestCandidate = scoredCandidates[0];
    if (bestCandidate && bestCandidate.score > 1.5) {
        return {
            format: "delimited",
            fileType: extension || bestCandidate.fileType,
            delimiter: bestCandidate.delimiter,
            confidence: 0.75,
        };
    }

    return {
        format: "text",
        fileType: extension || "txt",
        delimiter: null,
        confidence: 0.3,
    };
}

export function convertRawDataToJson(rawText, detection) {
    if (!detection || detection.format === "empty") {
        return [];
    }

    if (detection.format === "json") {
        const parsedJson = JSON.parse(rawText);
        return extractJsonRows(parsedJson);
    }

    if (detection.format === "delimited" && detection.delimiter) {
        return parseDelimitedText(rawText, detection.delimiter);
    }

    throw new Error(`Unsupported tabular format "${detection.format}"`);
}

export function parseNumericValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.replace(/,/g, "").trim();
    if (!normalized || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normalized)) {
        return null;
    }

    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function isDateLike(value) {
    if (typeof value !== "string") {
        return false;
    }

    const trimmed = value.trim();
    const hasDateSeparator = /[-/:\s]/.test(trimmed);
    const hasMonthName = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(trimmed);

    if (!trimmed || /^\d+$/.test(trimmed) || (!hasDateSeparator && !hasMonthName)) {
        return false;
    }

    return !Number.isNaN(Date.parse(trimmed));
}

export function inferColumnType(values, options = {}) {
    const inferenceOptions = {
        ...DEFAULT_INFERENCE_OPTIONS,
        ...options,
    };

    const sampledValues = values.slice(0, inferenceOptions.sampleSize);
    const nonMissingValues = sampledValues.filter((value) => !isMissingValue(value));
    const normalizedValues = nonMissingValues.map((value) => String(value).trim());
    const uniqueValues = [...new Set(normalizedValues)];
    const numericValues = normalizedValues.map(parseNumericValue).filter((value) => value !== null);
    const dateValues = normalizedValues.filter((value) => isDateLike(value));
    const loweredValues = uniqueValues.map((value) => value.toLowerCase());
    const booleanValues = new Set(["true", "false", "yes", "no", "y", "n"]);
    const booleanMatches = loweredValues.filter((value) => booleanValues.has(value));

    const nonMissingCount = normalizedValues.length;
    const uniqueCount = uniqueValues.length;
    const uniqueRatio = nonMissingCount ? uniqueCount / nonMissingCount : 0;
    const numericRatio = nonMissingCount ? numericValues.length / nonMissingCount : 0;
    const dateRatio = nonMissingCount ? dateValues.length / nonMissingCount : 0;
    const booleanRatio = uniqueCount ? booleanMatches.length / uniqueCount : 0;
    const isAllUnique = nonMissingCount > 0 && uniqueCount === nonMissingCount;

    let inferredType = "mixed";
    const tags = [];

    if (!nonMissingCount) {
        inferredType = "empty";
    } else if (
        booleanRatio >= inferenceOptions.booleanSuccessThreshold &&
        uniqueCount <= 2
    ) {
        inferredType = "boolean";
    } else if (numericRatio >= inferenceOptions.numericSuccessThreshold) {
        inferredType = "continuous";
        tags.push("numeric");

        if (uniqueCount <= inferenceOptions.lowCardinalityNumericThreshold) {
            tags.push("low_cardinality_numeric");
        }
    } else if (dateRatio >= inferenceOptions.dateSuccessThreshold) {
        inferredType = "date";
        tags.push("temporal");
    } else if (isAllUnique) {
        inferredType = "all_unique";
    } else if (
        uniqueCount <= inferenceOptions.categoricalUniqueThreshold ||
        uniqueRatio <= inferenceOptions.categoricalUniqueRatioThreshold
    ) {
        inferredType = "categorical";
    }

    if (isAllUnique) {
        tags.push("all_unique");
    }

    if (
        tags.includes("all_unique") &&
        numericRatio < 0.5 &&
        dateRatio < inferenceOptions.dateSuccessThreshold
    ) {
        tags.push("identifier_like");
    }

    const stats = {
        sampledCount: sampledValues.length,
        nonMissingCount,
        missingCount: sampledValues.length - nonMissingCount,
        uniqueCount,
        uniqueRatio,
        numericRatio,
        dateRatio,
        sampleValues: uniqueValues.slice(0, 5),
    };

    if (numericValues.length) {
        stats.min = Math.min(...numericValues);
        stats.max = Math.max(...numericValues);
    }

    return {
        inferredType,
        tags,
        stats,
    };
}

export function inferColumns(rows, options = {}) {
    const columnNames = rows.reduce((names, row) => {
        Object.keys(row || {}).forEach((key) => names.add(key));
        return names;
    }, new Set());

    return [...columnNames].map((columnName) => {
        const values = rows.map((row) => row[columnName]);
        return {
            name: columnName,
            ...inferColumnType(values, options),
        };
    });
}

function isBlobLike(value) {
    return (
        value &&
        typeof value === "object" &&
        typeof value.text === "function" &&
        ("size" in value || "type" in value)
    );
}

export async function loadFile(source, options = {}) {
    if (typeof source === "string") {
        const fetchImpl = options.fetchImpl || fetch;
        const response = await fetchImpl(source, options.fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to load "${source}" (${response.status})`);
        }

        const mimeType = response.headers && response.headers.get
            ? response.headers.get("content-type") || ""
            : "";

        const rawText = mimeType.includes("json")
            ? JSON.stringify(await response.json())
            : await response.text();

        return {
            source,
            fileName: options.fileName || source,
            mimeType,
            rawText,
        };
    }

    if (isBlobLike(source)) {
        return {
            source,
            fileName: options.fileName || source.name || "",
            mimeType: options.mimeType || source.type || "",
            rawText: await source.text(),
        };
    }

    if (source && typeof source === "object" && typeof source.rawText === "string") {
        return {
            source,
            fileName: options.fileName || source.fileName || "",
            mimeType: options.mimeType || source.mimeType || "",
            rawText: source.rawText,
        };
    }

    throw new Error("Unsupported file source. Expected a URL, Blob/File, or { rawText } object.");
}

export async function prepareDataset(source, options = {}) {
    const loadedFile = await loadFile(source, options);
    const detection = detectDataFormat(loadedFile.rawText, {
        source,
        fileName: options.fileName || loadedFile.fileName || source,
        mimeType: loadedFile.mimeType,
    });
    const rows = convertRawDataToJson(loadedFile.rawText, detection);
    const columns = inferColumns(rows, options.inferenceOptions);

    return {
        source: loadedFile.source,
        mimeType: loadedFile.mimeType,
        detection,
        rows,
        columns,
        rowCount: rows.length,
    };
}

export default {
    loadFile,
    detectDataFormat,
    convertRawDataToJson,
    parseNumericValue,
    inferColumnType,
    inferColumns,
    prepareDataset,
};
