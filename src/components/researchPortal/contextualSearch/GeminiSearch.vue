<template>
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">
            <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">Gemini API Interface</h1>

            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <!--<div class="mb-4">
                    <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">API Key:</label>
                    <input type="password" id="apiKey"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your API key">
                </div>-->

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
                    <label for="type" class="block text-sm font-medium text-gray-700 mb-2">Query to get:</label>
                    <select id="type"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="sections">Sections</option>
                        <option value="genes">Genes</option>
                        <option value="prompt-options">Prompt options</option>
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
            //const apiKeyInput = document.getElementById('apiKey');
            const modelSelect = document.getElementById('model');
            const promptType = document.getElementById('type');
            const promptInput = document.getElementById('prompt');
            const streamCheckbox = document.getElementById('stream');
            const submitBtn = document.getElementById('submitBtn');
            const loadingIndicator = document.querySelector('.loading');
            const responseDiv = document.getElementById('response');

            submitBtn.addEventListener('click', async () => {
                //const apiKey = apiKeyInput.value.trim();
                const model = modelSelect.value;
                const type = promptType.value;
                let contextPrompt;
                if(type == "sections") {

                    const sectionProfiles = [
                        {
                            sectionId:'pigean_gene',
                            queryKey:'gene',
                            parameter: null,
                            return:'phenotypes',
                            purpose: 'Get phenotypes associated with a gene'
                        },
                        {
                            sectionId:'pigean_gene_set_phenotype',
                            queryKey:'phenotype',
                            parameter: null,
                            return:'genes sets',
                            purpose: 'Get gene sets associated with a phenotype'
                        },
                        {
                            sectionId:'pigean_gene_phenotype',
                            queryKey:'phenotype',
                            parameter: null,
                            return:'genes',
                            purpose: 'Get genes associated with a phenotype'
                        },
                        {
                            sectionId:'pigean_gene_set_source',
                            queryKey:'source',
                            parameter: null,
                            return:'gene sets',
                            purpose: 'Get gene sets curated by a source'
                        },
                        {
                            sectionId:'pigean_gene_set',
                            queryKey:'geneSet',
                            parameter: null,
                            return:'phenotypes',
                            purpose: 'Get phenotypes associated with a gene set'
                        },
                        {
                            sectionId:'pigean-joined-gene-set',
                            queryKey:'geneSet',
                            parameter: null,
                            return:'genes',
                            purpose: 'Get genes in a gene set'
                        }
                    ]

                    contextPrompt = "You are an expert at understanding the purposes in a JSON object based on their description. Given the following JSON object and a user input, find out what the user provided phrase is about and return the the items meaningful to the user input. For each matching section, infer the appropriate value for the `parameter` field based on the `queryKey`. The `parameter` value should represent the type of information the user is likely searching for based on the `queryKey`. Return the result as a plain JSON array of the matching section objects, with the `parameter` field populated. Sections: "+JSON.stringify(sectionProfiles)+" User query:"

                } else if (type == "genes") {
                    contextPrompt = "You are a helpful research assistant specialized in biology and genetics. Your task is to identify 10 genes relevant to a user-provided medical condition or a combination of conditions. You must respond exclusively with a JSON array. Each element in the array should be a JSON object containing two keys: 'gene' (the official gene symbol) and 'reason' (a concise biological rationale explaining the gene's relevance to the specified condition(s)). User query:"
                } else if (type == "prompt-options") {
                    contextPrompt = "Given the following data point from a biology research portal: Generate a JSON formatted list of dictionaries, where each dictionary has two keys: 'direction' and 'prompts'. The 'direction' key should describe the category of the research questions, and the 'prompts' key should contain a list of specific research questions (prompts) that could be used to further explore the relationships and information presented in the data. User query:"
                }

                const onlyJson = "Do NOT include any markdown formatting, code block markers, or triple backticks in your response. If the user's query is not related to biology or genetics, or if it does not ask for information about medical conditions, you must respond with the following JSON object: {'error': 'That's an interesting direction! However, this portal is specifically designed to explore data related to researches in biology. Your prompt seems to fall outside of that scope.'}"

                const prompt = contextPrompt + promptInput.value.trim()+onlyJson;

                /*if (!apiKey) {
                    alert('Please enter your API key');
                    return;
                }*/

                if (!prompt) {
                    alert('Please enter a prompt');
                    return;
                }

                try {
                    // Show loading indicator
                    loadingIndicator.classList.add('active');
                    responseDiv.textContent = '';

                    const response = await fetch('http://localhost:3000/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            api_key: "apiKey",
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