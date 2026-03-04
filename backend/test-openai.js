const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://models.inference.ai.azure.com',
});

async function main() {
    try {
        console.log('Testing OpenAI with key:', process.env.OPENAI_API_KEY.substring(0, 15) + '...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'user', content: 'Say hello' },
            ],
        });
        console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
