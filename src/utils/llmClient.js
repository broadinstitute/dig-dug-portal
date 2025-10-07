/**
    // llmClient.js

    // Utility for calling LLM APIs (Gemini / OpenAI) from Vue (or plain JS)
    // using hugeamp passthrough api.

    // Each client is isolated and can run concurrently.

    // Responses are retuned as-is from llm, it is up to dev to parse them appropriately.

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

        // Send a prompt with per-call handlers
        summarizer.sendPrompt({
            userPrompt: "Summarize this paragraph...",
            onToken: token => console.log("token:", token),
            onResponse: resp => console.log("full response:", resp),
            onState: state => console.log("state:", state),
            onError: err => console.error("error:", err),
            onEnd: () => console.log("done")
        });

        pirate.sendPrompt({
            userPrompt: "Grep this grog",
            onResponse: resp => console.log("response:", resp)
        });
**/

export function createLLMClient({ llm = "gemini", model, system_prompt, stream = false }) {
  let abortController = null;

  async function sendPrompt({ userPrompt, onResponse, onToken, onError, onState, onEnd }) {
    if (!userPrompt) {
      onError?.(new Error("Missing prompt"));
      return;
    }

    // cancel previous if needed
    abortController?.abort();
    abortController = new AbortController();

    onState?.("Thinking...");

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
      signal: abortController.signal,
    };

    try {
      if (stream) {
        await callStreaming(url, options, { onToken, onState, onEnd, onError });
      } else {
        await callOnce(url, options, { onResponse, onState, onEnd, onError });
      }
    } catch (err) {
      onError?.(err);
    }
  }

  async function callOnce(url, options, { onResponse, onError, onState, onEnd }) {
    const response = await fetch(url, options);
    if (!response.ok) {
      onError?.(new Error("Fetch error"));
      return;
    }

    const res = await response.json();
    const data =
      llm === "openai"
        ? res.data[0].openai_response
        : res.data[0].gemini_response;

    if (data) onResponse?.(data);

    onState?.("Done");
    onEnd?.();
  }

  async function callStreaming(url, options, { onToken, onState, onEnd, onError }) {
    const response = await fetch(url, options);
    if (!response.ok) {
      onError?.(new Error("Fetch error"));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);

        if (event.event === "add_message") {
          const text = event.data?.text;
          if (text?.trim() && event.data?.sender !== "User") {
            onState?.("Writing...");
            onToken?.(text);
          }
        } else if (event.event === "end") {
          onState?.("Done");
        }
      }
    }

    onEnd?.();
  }

  return { sendPrompt };
}
