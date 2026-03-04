const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModel() {
    const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    try {
        console.log('Testing gemini-2.0-flash...');
        const result = await model.generateContent('Say hello!');
        const response = await result.response;
        console.log('Success:', response.text());
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testModel();
