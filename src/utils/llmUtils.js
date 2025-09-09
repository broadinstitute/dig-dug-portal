/**
 * LLM Utility Functions
 * Provides reusable functions for interacting with LLM services
 */

export const llmUtils = {
    /**
     * Query LLM service with data analysis
     * @param {Object} config - Configuration object
     * @param {Object} config.summaryConfig - Summary configuration
     * @param {Array} config.dataset - Dataset to analyze
     * @param {string} config.searchFocus - Research focus/context
     * @param {Object} config.utils - Utility functions (optional)
     * @param {string} config.url - LLM service URL (optional, defaults to dev)
     * @returns {Promise<Object>} - LLM response data
     */
    async queryLLM(config) {
        const {
            summaryConfig,
            dataset,
            searchFocus = '',
            utils = null,
            url = 'https://llm-dev.hugeamp.org/gemini'
        } = config;

        try {
            // Validate required parameters
            if (!summaryConfig) {
                throw new Error('summaryConfig is required');
            }
            if (!dataset || !Array.isArray(dataset)) {
                throw new Error('dataset must be a valid array');
            }

            // Update keyParams if utils is provided
            if (utils && utils.keyParams && searchFocus !== utils.keyParams['focus']) {
                utils.keyParams.set({ focus: searchFocus });
            }

            // Collect data from specified columns
            let dataCollected = "";
            summaryConfig['columns'].forEach(column => {
                dataset.forEach((row, rowIndex) => {
                    if (summaryConfig['rows limit'] && summaryConfig['rows limit'] !== 0) {
                        if (rowIndex <= summaryConfig['rows limit']) {
                            dataCollected += row[column] + ", ";
                        }
                    } else {
                        dataCollected += row[column] + ", ";
                    }
                });
            });

            // Prepare JSON model
            const jsonModel = summaryConfig['response json'];
            const modelString = JSON.stringify(jsonModel, null, 2);

            // Build prompts
            let prompt = summaryConfig['prompt'] + '\n';
            prompt += "Data to analyze: " + dataCollected;
            prompt += "Research context: " + searchFocus;

            const systemPrompt = `Your entire response must be a single, raw JSON object and nothing else. Do not include '''json markdown tags, explanations, or any text whatsoever before the opening { or after the closing '}. Use this exact JSON structure:  ${modelString}\n\n`;

            // Prepare request
            const payload = {
                model: summaryConfig['model'],
                systemPrompt: systemPrompt,
                userPrompt: prompt,
            };

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            };

            // Make API call
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const res = await response.json();
            console.log('*LLM response*', res);

            // Validate response structure
            if (!res.data || !res.data[0] || !res.data[0].gemini_response) {
                throw new Error('Invalid response structure from LLM service');
            }

            return {
                success: true,
                data: res.data[0].gemini_response,
                rawResponse: res
            };

        } catch (error) {
            console.error('Error in queryLLM:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    },

    /**
     * Query LLM with custom prompt (simplified version)
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt (optional)
     * @param {string} model - Model name (optional)
     * @param {string} url - LLM service URL (optional)
     * @returns {Promise<Object>} - LLM response data
     */
    async queryLLMSimple(prompt, systemPrompt = '', model = 'gemini-pro', url = 'https://llm-dev.hugeamp.org/gemini') {
        try {
            const payload = {
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: prompt,
            };

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            };

            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const res = await response.json();

            if (!res.data || !res.data[0] || !res.data[0].gemini_response) {
                throw new Error('Invalid response structure from LLM service');
            }

            return {
                success: true,
                data: res.data[0].gemini_response,
                rawResponse: res
            };

        } catch (error) {
            console.error('Error in queryLLMSimple:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    },

    /**
     * Extract and clean JSON from LLM response
     * @param {string} response - Raw LLM response
     * @returns {Object|null} - Parsed JSON object or null if invalid
     */
    extractJsonFromResponse(response) {
        try {
            // Remove markdown code blocks if present
            let cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Try to parse as JSON
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error parsing LLM response JSON:', error);
            return null;
        }
    },

    /**
     * Validate LLM configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} - Validation result
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        if (!config.summaryConfig) {
            errors.push('summaryConfig is required');
        } else {
            if (!config.summaryConfig['response json']) {
                errors.push('summaryConfig.response json is required');
            }
            if (!config.summaryConfig['model']) {
                errors.push('summaryConfig.model is required');
            }
            if (!config.summaryConfig['columns'] || !Array.isArray(config.summaryConfig['columns'])) {
                errors.push('summaryConfig.columns must be a valid array');
            }
        }

        if (!config.dataset || !Array.isArray(config.dataset)) {
            errors.push('dataset must be a valid array');
        }

        if (config.dataset && config.dataset.length === 0) {
            warnings.push('dataset is empty');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};

export default llmUtils;
