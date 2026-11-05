/**
    // llmClient.js

<<<<<<< HEAD
    // Utility for calling LLM APIs (Gemini / OpenAI) from Vue (or plain JS)
=======
    // Utility for calling LLM APIs (Bedrock / OpenAI / Gemini) from Vue (or plain JS)
>>>>>>> master
    // using hugeamp passthrough api.

    // Each client is isolated and can run concurrently.

<<<<<<< HEAD
    // Responses are retuned as-is from llm, it is up to dev to parse them appropriately.
=======
    // Responses are returned as-is from llm, it is up to dev to parse them appropriately.

    // Default provider is Bedrock (`https://llm.hugeamp.org/bedrock`). OpenAI fallback is
    // OFF by default (set fallbackLlm: "openai" to re-enable) to avoid burning tokens on
    // Bedrock JSON parse failures.
>>>>>>> master

    // How to use:

        import { createLLMClient } from "@/utils/llmClient";

        // Create independent clients with different system prompts / models
        const summarizer = createLLMClient({
            llm: "gemini",
            model: "gemini-2.5-flash",
            system_prompt: "You are a summarizer",
            stream: true
        });

        const pirate = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: "You are a pirate"
        });

<<<<<<< HEAD
        // Send a prompt with per-call handlers
=======
        // Default: Bedrock only (no OpenAI fallback unless fallbackLlm is set)
        const defaultClient = createLLMClient({
            system_prompt: "You are a helpful assistant"
        });

        // Send a prompt with per-call handlers (optional systemPrompt overrides the client default)
>>>>>>> master
        summarizer.sendPrompt({
            userPrompt: "Summarize this paragraph...",
            onToken: token => console.log("token:", token),
            onResponse: resp => console.log("full response:", resp),
<<<<<<< HEAD
=======
            onUsage: usage => console.log("token usage:", usage),
>>>>>>> master
            onState: state => console.log("state:", state),
            onError: err => console.error("error:", err),
            onEnd: () => console.log("done")
        });

        pirate.sendPrompt({
            userPrompt: "Grep this grog",
<<<<<<< HEAD
=======
            systemPrompt: "You are a privateer",
>>>>>>> master
            onResponse: resp => console.log("response:", resp)
        });

        //manually cancel a request in progress
        summarizer.abort();
        pirate.abort();
**/

<<<<<<< HEAD
export function createLLMClient({ llm = "gemini", model, system_prompt, stream = false }) {
  let abortController = null;

  async function sendPrompt({ userPrompt, onResponse, onToken, onError, onState, onEnd }) {
=======
import {
  extractOpenAiResponseText,
  isViableLlmText,
  normalizeForcedJsonReply,
  resolveLlmUsage,
} from "@/utils/llmUsageUtils";

/** Prefill for Bedrock/Claude JSON replies (gateway assistant continuation). */
const DEFAULT_JSON_RESPONSE_PREFIX = "{";

const LLM_ENDPOINT_BY_PROVIDER = {
  openai: "https://llm.hugeamp.org/openai",
  bedrock: "https://llm.hugeamp.org/bedrock",
  gemini: "https://llm.hugeamp.org/gemini",
};

const DEFAULT_LLM = "bedrock";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5-mini";

function llmEndpointUrl(llm) {
  return LLM_ENDPOINT_BY_PROVIDER[llm] || LLM_ENDPOINT_BY_PROVIDER.gemini;
}

function defaultModelForProvider(llm) {
  if (llm === "openai") return DEFAULT_OPENAI_FALLBACK_MODEL;
  return undefined;
}

/** Pull the provider-specific response payload text from a hugeamp passthrough body. */
function extractHugeampResponseText(llm, res) {
  const row = res && Array.isArray(res.data) ? res.data[0] : null;
  if (!row) return "";
  if (llm === "openai") {
    return extractOpenAiResponseText(row.openai_response);
  }
  if (llm === "bedrock") {
    const raw = row.bedrock_response;
    if (typeof raw === "string") return raw;
    return extractOpenAiResponseText(raw);
  }
  const gemini = row.gemini_response;
  return gemini != null ? gemini : "";
}

function buildPayload({ model, systemPrompt, userPrompt, responsePrefix }) {
  const payload = {
    systemPrompt,
    userPrompt,
  };
  if (model != null && String(model).trim() !== "") {
    payload.model = model;
  }
  if (responsePrefix != null && String(responsePrefix) !== "") {
    payload.responsePrefix = String(responsePrefix);
  }
  return payload;
}

export function createLLMClient({
  llm = DEFAULT_LLM,
  model,
  system_prompt,
  stream = false,
  /** Optional secondary provider (e.g. "openai"). Default null — no fallback. */
  fallbackLlm = null,
  fallbackModel,
  /** When true, non-JSON text also fails the attempt. JSON-shaped text always must parse. */
  expectJson = false,
  /**
   * When true, send gateway `responsePrefix: "{"` and normalize continuation replies.
   * Defaults to on for Bedrock when expectJson is true.
   */
  forceJsonReply = null,
} = {}) {
  let abortController = null;
  const shouldForceJsonReply =
    forceJsonReply === true ||
    (forceJsonReply !== false && llm === "bedrock" && !!expectJson);
  const jsonResponsePrefix = shouldForceJsonReply ? DEFAULT_JSON_RESPONSE_PREFIX : null;

  async function sendPrompt({ userPrompt, systemPrompt, onResponse, onUsage, onToken, onError, onState, onEnd }) {
>>>>>>> master
    if (!userPrompt) {
      onError?.(new Error("Missing prompt"));
      return;
    }

    // cancel previous if needed
    abortController?.abort();
    abortController = new AbortController();
    const signal = abortController.signal; // Grab signal for manual checks

    onState?.("Thinking...");

<<<<<<< HEAD
    const url =
      llm === "openai"
        ? "https://llm.hugeamp.org/openai"
        : "https://llm.hugeamp.org/gemini";

    const payload = {
      model,
      systemPrompt: system_prompt,
      userPrompt,
    };

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal, // Pass signal to fetch
    };

    try {
      if (stream) {
        await callStreaming(url, options, { onToken, onState, onEnd, onError, signal });
      } else {
        await callOnce(url, options, { onResponse, onState, onEnd, onError, signal });
      }
    } catch (err) {
      // This catches AbortError if fetch() or reader.read() is cancelled
      if (err.name === 'AbortError') {
=======
    const effectiveSystem =
      systemPrompt !== undefined && systemPrompt !== null ? systemPrompt : system_prompt;

    const attempts = [{ llm, model: model != null ? model : defaultModelForProvider(llm) }];
    if (fallbackLlm && fallbackLlm !== llm) {
      attempts.push({
        llm: fallbackLlm,
        model:
          fallbackModel != null
            ? fallbackModel
            : defaultModelForProvider(fallbackLlm),
      });
    }

    try {
      // Streaming is only implemented for the primary provider; no provider fallback.
      if (stream) {
        const url = llmEndpointUrl(llm);
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildPayload({
              model: attempts[0].model,
              systemPrompt: effectiveSystem,
              userPrompt,
              responsePrefix: jsonResponsePrefix,
            })
          ),
          signal,
        };
        await callStreaming(url, options, { onToken, onState, onEnd, onError, signal });
        return;
      }

      let lastError = null;
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        if (signal.aborted) {
          onState?.("Aborted");
          return;
        }
        if (i > 0) {
          onState?.(`Primary LLM failed; retrying with ${attempt.llm}…`);
          // eslint-disable-next-line no-console
          console.warn(
            `[llmClient] ${attempts[0].llm} failed (${lastError && lastError.message}); falling back to ${attempt.llm}`
          );
        }
        const url = llmEndpointUrl(attempt.llm);
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildPayload({
              model: attempt.model,
              systemPrompt: effectiveSystem,
              userPrompt,
              responsePrefix: jsonResponsePrefix,
            })
          ),
          signal,
        };
        const result = await callOnce(url, options, {
          llm: attempt.llm,
          model: attempt.model,
          expectJson: expectJson || shouldForceJsonReply,
          onResponse,
          onUsage,
          onState,
          onEnd,
          signal,
          systemPrompt: effectiveSystem,
          userPrompt,
        });
        if (result.aborted) return;
        if (result.ok) return;
        lastError = result.error || new Error("LLM request failed");
      }
      onError?.(lastError || new Error("LLM request failed"));
    } catch (err) {
      // This catches AbortError if fetch() or reader.read() is cancelled
      if (err.name === "AbortError") {
>>>>>>> master
        onState?.("Aborted");
        // This is an intentional abort, not an "error"
        console.log("Request was aborted.");
      } else {
        onError?.(err);
      }
    }
  }

<<<<<<< HEAD
  async function callOnce(url, options, { onResponse, onError, onState, onEnd, signal }) {
    const response = await fetch(url, options); // This will throw AbortError if aborted
=======
  async function callOnce(url, options, {
    llm: provider,
    model: attemptModel,
    expectJson: requireJsonShape,
    onResponse,
    onUsage,
    onState,
    onEnd,
    signal,
    systemPrompt,
    userPrompt,
  }) {
    let response;
    try {
      response = await fetch(url, options); // This will throw AbortError if aborted
    } catch (err) {
      if (err && err.name === "AbortError") {
        onState?.("Aborted");
        return { ok: false, aborted: true };
      }
      return { ok: false, aborted: false, error: err };
    }
>>>>>>> master

    // --- FIX ---
    // Handle race condition: fetch succeeded but abort was called right after
    if (signal.aborted) {
      onState?.("Aborted");
<<<<<<< HEAD
      return;
    }

    if (!response.ok) {
      onError?.(new Error("Fetch error"));
      return;
    }

    const res = await response.json();
=======
      return { ok: false, aborted: true };
    }

    if (!response.ok) {
      let detail = "";
      try {
        detail = String((await response.text()) || "").slice(0, 300);
      } catch (readError) {
        detail = "";
      }
      return {
        ok: false,
        aborted: false,
        error: new Error(
          `LLM request failed (${response.status} ${response.statusText})${
            detail ? `: ${detail}` : ""
          }`
        ),
      };
    }

    let res;
    try {
      res = await response.json();
    } catch (err) {
      return {
        ok: false,
        aborted: false,
        error: err && err.message ? err : new Error("Invalid LLM JSON response"),
      };
    }
>>>>>>> master

    // --- FIX ---
    // Check again after await response.json()
    if (signal.aborted) {
      onState?.("Aborted");
<<<<<<< HEAD
      return;
    }

    const data =
      llm === "openai"
        ? res.data[0].openai_response
        : res.data[0].gemini_response;

    // Check before firing callback
    if (data && !signal.aborted) {
=======
      return { ok: false, aborted: true };
    }

    const rawData = extractHugeampResponseText(provider, res);
    if (!rawData || !String(rawData).trim()) {
      return {
        ok: false,
        aborted: false,
        error: new Error(`Empty ${provider} response`),
      };
    }

    // Strip fences / restore leading `{` after a forced-JSON user prompt.
    const data = normalizeForcedJsonReply(rawData) || String(rawData).trim();

    // Truncated / malformed JSON must not count as success.
    if (!isViableLlmText(data, { requireJson: !!requireJsonShape })) {
      return {
        ok: false,
        aborted: false,
        error: new Error(
          `Unparseable or truncated ${provider} JSON response (${String(data).length} chars)`
        ),
      };
    }

    if (onUsage && !signal.aborted) {
      const usage = resolveLlmUsage({
        res,
        llm: provider,
        model: attemptModel,
        systemPrompt,
        userPrompt,
        responseText: data || "",
      });
      onUsage(usage);
    }

    // Check before firing callback
    if (!signal.aborted) {
>>>>>>> master
      onResponse?.(data);
    }

    // --- FIX ---
    // Final check before marking as "Done"
    if (signal.aborted) {
      onState?.("Aborted");
<<<<<<< HEAD
      return;
=======
      return { ok: false, aborted: true };
>>>>>>> master
    }

    onState?.("Done");
    onEnd?.();
<<<<<<< HEAD
=======
    return { ok: true, aborted: false };
>>>>>>> master
  }

  async function callStreaming(url, options, { onToken, onState, onEnd, onError, signal }) {
    const response = await fetch(url, options); // This will throw AbortError

    // --- FIX ---
    if (signal.aborted) {
      onState?.("Aborted");
      return;
    }

    if (!response.ok) {
<<<<<<< HEAD
      onError?.(new Error("Fetch error"));
=======
      let detail = "";
      try {
        detail = String((await response.text()) || "").slice(0, 300);
      } catch (readError) {
        detail = "";
      }
      onError?.(
        new Error(
          `LLM request failed (${response.status} ${response.statusText})${
            detail ? `: ${detail}` : ""
          }`
        )
      );
>>>>>>> master
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      // --- FIX ---
      // Check at the start of every loop
      if (signal.aborted) {
        reader.cancel("Aborted by user");
        onState?.("Aborted");
        break;
      }

      const { done, value } = await reader.read(); // This will throw AbortError
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (signal.aborted) break; // Stop processing lines
        if (!line.trim()) continue;
<<<<<<< HEAD
        
=======

>>>>>>> master
        const event = JSON.parse(line);

        if (event.event === "add_message") {
          const text = event.data?.text;
          // --- FIX --- Check before firing callback
          if (text?.trim() && event.data?.sender !== "User" && !signal.aborted) {
            onState?.("Writing...");
            onToken?.(text);
          }
        } else if (event.event === "end" && !signal.aborted) { // Check before callback
          onState?.("Done");
        }
      }
      if (signal.aborted) break; // Exit main while loop
    }

    // --- FIX ---
    // Final check before onEnd
    if (signal.aborted) {
      onState?.("Aborted");
      return;
    }

    onEnd?.();
  }

  function abort() {
    abortController?.abort();
  }

  return { sendPrompt, abort };
<<<<<<< HEAD
}
=======
}

export {
  DEFAULT_JSON_RESPONSE_PREFIX,
  DEFAULT_LLM,
  DEFAULT_OPENAI_FALLBACK_MODEL,
  buildPayload,
  extractHugeampResponseText,
  llmEndpointUrl,
};
>>>>>>> master
