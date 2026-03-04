const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
    try {
        // The SDK doesn't have a direct listModels method, but we can use the fetch API if we want.
        // Or we can try several common names.
        // Actually, let's use a direct fetch to the Google API endpoint.
        const apiKey = process.env.OPENAI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log('No models found or error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
