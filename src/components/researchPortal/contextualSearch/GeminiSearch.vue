<template>
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">
            <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">Gemini API Interface</h1>

            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="mb-4">
                    <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">API Key:</label>
                    <input type="password" id="apiKey"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your API key">
                </div>

                <div class="mb-4">
                    <label for="model" class="block text-sm font-medium text-gray-700 mb-2">Model:</label>
                    <select id="model"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                </div>

                <div class="mb-4">
                    <label for="prompt" class="block text-sm font-medium text-gray-700 mb-2">Enter your prompt:</label>
                    <textarea id="prompt" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your prompt here..."></textarea>
                </div>

                <div class="flex items-center mb-4">
                    <input type="checkbox" id="stream"
                        class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="stream" class="text-sm text-gray-700">Stream response</label>
                </div>

                <button id="submitBtn"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Generate Response
                </button>
            </div>

            <div class="loading bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-2 text-gray-700">Generating response...</span>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6 result-container">
                <h2 class="text-xl font-semibold mb-4 text-gray-800">Response:</h2>
                <div id="response" class="text-gray-700 whitespace-pre-wrap"></div>
            </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("gemini-search", {
    props: [],
    data() {
        return {
            
        };
    },
    mounted() {
               document.addEventListener('DOMContentLoaded', () => {
            const apiKeyInput = document.getElementById('apiKey');
            const modelSelect = document.getElementById('model');
            const promptInput = document.getElementById('prompt');
            const streamCheckbox = document.getElementById('stream');
            const submitBtn = document.getElementById('submitBtn');
            const loadingIndicator = document.querySelector('.loading');
            const responseDiv = document.getElementById('response');

            submitBtn.addEventListener('click', async () => {
                const apiKey = apiKeyInput.value.trim();
                const model = modelSelect.value;
                const contextPrompt = "You are an expert at understanding the purpose of keys in a JSON object based on their description. Given the following JSON object and a user input, find out what the sentence is about and return the keys of the items meaningful to the sentence. Don't include reasonings but format your response in the following format.\
                {'paramters':[parameter1, parameter2...],'keys':[key1, key2...]} \
                If search question is not biology related, return 'Your input is not relevant to this portal.'\
                JSON Object:[{key:'pigean_gene','search parameter':'gene','return':'phenotypes associated by a gene. This sections provides access to gene sets associated with the phenotypes.'},{key:'pigean_gene_set_phenotype','search parameter':'pehnotype','return':'Returns genes sets associated with a phenotype.'},{key:'pigean_gene_phenotype','search parameter':'phenotype','return':'Returns genes associated with a phenotype.'},{key:'pigean_gene_set_source','search parameter':'source','return':'Returns phenotypes and gene sets associated phenotypes, by the research program generated the gene sets.'}]\
                Search: "
                const prompt = contextPrompt + promptInput.value.trim();

                if (!apiKey) {
                    alert('Please enter your API key');
                    return;
                }

                if (!prompt) {
                    alert('Please enter a prompt');
                    return;
                }

                try {
                    // Show loading indicator
                    loadingIndicator.classList.add('active');
                    responseDiv.textContent = '';

                    const response = await fetch('http://localhost:5000/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            api_key: apiKey,
                            model: model,
                            prompt: prompt,
                            stream: streamCheckbox.checked
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to generate response');
                    }

                    // Display the response
                    responseDiv.textContent = data.response;

                } catch (error) {
                    responseDiv.textContent = `Error: ${error.message}`;
                } finally {
                    // Hide loading indicator
                    loadingIndicator.classList.remove('active');
                }
            });
        });
        $(function () { });
    },
    methods: {
        
    },
    computed: {
        
    }
}
);
</script>
<style scoped>
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
     .loading {
            display: none;
        }

        .loading.active {
            display: block;
        }

        .result-container {
            max-height: 400px;
            overflow-y: auto;
        }
</style>