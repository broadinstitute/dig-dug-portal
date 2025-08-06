<template>
  <div class="cfde-rag chat-container p-3">
    <div class="chat-box mb-3">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        :class="['chat-msg', msg.role]"
        v-html="msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content"
      >
      </div>
      <div v-if="loading" class="chat-msg assistant loading">
        <em>Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></em>
        </div>
    </div>

    <div class="input-group">
      <input
        type="text"
        class="form-control"
        v-model="userInput"
        @keyup.enter="sendMessage"
        placeholder="Type your message..."
        style="border-radius: 8px 0 0 8px;"
      />
      <div class="input-group-append">
        <button class="btn btn-primary" style="background:#f26822; border:0;" @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EventBus from "@/utils/eventBus";

Vue.use(BootstrapVueIcons);

export default Vue.component("cfde-rag", {
  data() {
    return {
        LANGFLOW_API_KEY: "",
        LANGFLOW_FLOWS: {
            v2: "https://langflow.hugeamp.org/api/v1/run/f5f270af-b957-48ba-9d23-22cea7a86950",
            v1: "https://langflow.hugeamp.org/api/v1/run/31b53545-d225-4a05-bd72-d838cad1d55b"
        },
        userInput: "",
        messages: [
            { role: "system", content: "Hi! Im here to help you discover the CFDE.<br/>Click on a Program to the left and ill tell you about it.<br/>Or ask more specific questions by typing below." }
      ],
        loading: false
    };
  },
  mounted() {
    EventBus.$on("send-to-chat", this.handleExternalMessage);
  },

  beforeDestroy() {
    EventBus.$off("send-to-chat", this.handleExternalMessage);
  },
  methods: {
    async sendMessage() {
      const input = this.userInput.trim();
      if (!input) return;

      this.messages.push({ role: "user", content: input });
      this.userInput = "";
      this.loading = true;

      try {
        const response = await this.queryAI(input);
        this.messages.push({ role: "assistant", content: response[0].outputs[0].outputs.message.message });
      } catch (err) {
        this.messages.push({ role: "assistant", content: "Error: Unable to get a response." });
        console.error(err);
      } finally {
        this.loading = false;
        }
    },
    async handleExternalMessage(input) {
      if (!input || typeof input !== 'string') return;
      this.messages.push({ role: "user", content: input });
      this.loading = true;

      try {
        const response = await this.queryAI(input);
        this.messages.push({ role: "assistant", content: response[0].outputs[0].outputs.message.message });
      } catch (err) {
        this.messages.push({ role: "assistant", content: "Error: Unable to get a response." });
        console.error(err);
      } finally {
        this.loading = false;
        }
    },

    async queryAI(inputText) {
      //if (!process.env.LANGFLOW_API_KEY) {
      if (!this.LANGFLOW_API_KEY) {
        throw new Error('LANGFLOW_API_KEY environment variable not found.');
      }

      const payload = {
        input_value: inputText,
        output_type: "chat",
        input_type: "chat",
        session_id: "user_1"
      };

      const response = await fetch(this.LANGFLOW_FLOWS.v2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.LANGFLOW_API_KEY
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      console.log(json.outputs);
      return json.outputs || "(No response received)";
    },

    escapeHTML(text) {
        return text.replace(/[&<>"']/g, match => {
            const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return escapes[match];
        });
    },

    parseMarkdown(mdRaw) {
        let md = this.escapeHTML(mdRaw);

        // Code blocks: ``` ... ```
        md = md.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

        // Headings
        md = md.replace(/^### (.*)$/gim, '<h3>$1</h3>')
                .replace(/^## (.*)$/gim, '<h2>$1</h2>')
                .replace(/^# (.*)$/gim, '<h1>$1</h1>');

        // Horizontal rules
        md = md.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');

        // Blockquotes
        md = md.replace(/^> (.*)$/gim, '<blockquote>$1</blockquote>');

        // Links: [label](url)
        md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Inline angle-bracket URLs: <https://url>
        md = md.replace(/&lt;(https?:\/\/[^&]+)&gt;/gim, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        // Bare URLs (with or without protocol)
        md = md.replace(/(^|\s)(https?:\/\/[^\s<]+)/gim, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');

        // Bold/Italic
        md = md.replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>')
                .replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/gim, '<em>$1</em>');

        // Inline code
        md = md.replace(/`([^`\n]+)`/gim, '<code>$1</code>');

        // Nested lists: we group and transform them hierarchically
        md = md.replace(/^(\s*)[*+-] (.*)$/gm, (match, spaces, text) => {
            const depth = spaces.length / 4;
            return `${'  '.repeat(depth)}<li>${text}</li>`;
        });
        md = md.replace(/(<li>[\s\S]+?<\/li>)/gim, '<ul>$1</ul>');

        // Ordered lists
        md = md.replace(/^(\s*)\d+\.\s+(.*)$/gm, (match, spaces, text) => {
            const depth = spaces.length / 4;
            return `${'  '.repeat(depth)}<li>${text}</li>`;
        });
        md = md.replace(/(<li>[\s\S]+?<\/li>)/gim, content => {
            return content.includes('<li>1.') ? `<ol>${content}</ol>` : content;
        });

        // Paragraphs (avoid wrapping <ul>, <ol>, <pre>, <h*>...)
        md = md.replace(/^\s*([^\n<][^\n]*)$/gm, '<p>$1</p>');

        // Cleanup: collapse nested <ul><ul>...</ul></ul>
        md = md.replace(/<\/ul>\s*<ul>/g, '');
        md = md.replace(/<\/ol>\s*<ol>/g, '');

        // Line breaks
        md = md.replace(/\n/g, '<br>');

        return md;
        }


  }
});
</script>

<style scoped>
.chat-container {
  max-width: 600px;
  height: 100%;
  margin: 0 auto;
  border: 1px solid #ccc;
  border-radius: 12px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.chat-box {
  overflow-y: auto;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  flex: 1;
}

.chat-msg {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 18px;
  max-width: 80%;
  word-wrap: break-word;
}

.chat-msg.user {
  background-color: #d1ecf1;
  align-self: flex-end;
  text-align: right;
  margin-left: auto;
}

.chat-msg.assistant {
  background-color: #e2e3e5;
  align-self: flex-start;
  text-align: left;
  margin-right: auto;
}

.chat-msg.system {
  font-style: italic;
  text-align: left;
  background: transparent;
}

.chat-msg.loading {
  color: #999;
  font-style: italic;
}

.dot {
  animation: blink 1.4s infinite;
  animation-delay: 0s;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
