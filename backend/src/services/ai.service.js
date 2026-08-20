const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const generateSymptomSummary = async (symptoms) => {
    try {
        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
                {
                    role: "system",
                    content:
                        "You are a healthcare assistant. Do not diagnose or prescribe. Prepare a concise summary for a doctor."
                },
                {
                    role: "user",
                    content: `
Analyse these patient symptoms and return:

Urgency: Low / Medium / High
Chief Complaint: <short description>
Suggested Questions:
1. <question>
2. <question>
3. <question>

Symptoms:
${symptoms}
`
                }
            ]
        });

        return response.output_text;

    } catch (error) {
        console.error("AI service error:", error);

        // The appointment system should continue working
        // even if the AI service fails.
        return null;
    }
};

module.exports = {
    generateSymptomSummary
};