const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// PRE-VISIT SUMMARY
// ==========================================
const generateSymptomSummary = async (symptoms) => {
    try {
        const prompt = `
You are a healthcare assistant helping a doctor prepare for a patient visit.

Do NOT diagnose the patient.
Do NOT prescribe medication.

Analyse the patient's symptoms and return exactly this format:

Urgency: Low / Medium / High

Chief Complaint:
<short summary>

Suggested Questions:
1. <question>
2. <question>
3. <question>

Patient symptoms:
${symptoms}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error("Gemini pre-visit error:", error);
        return null;
    }
};


// ==========================================
// POST-VISIT SUMMARY
// ==========================================
const generatePostVisitSummary = async (notes, prescription) => {
    try {
        const prompt = `
You are a healthcare assistant.

Create a simple, patient-friendly summary of a completed doctor consultation.

Do NOT add a diagnosis that is not present.
Do NOT invent medical information.
Do NOT change the prescribed medication.
Do NOT provide additional medical advice.

Return exactly this format:

Consultation Summary:
<simple explanation of what happened during the consultation>

Prescription:
<repeat the prescription exactly as provided>

Follow-up:
<mention any follow-up information contained in the consultation notes.
If none is mentioned, write "Follow-up as advised by the doctor.">

Doctor's Notes:
${notes}

Prescription:
${prescription || "No prescription provided"}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error("Gemini post-visit error:", error);
        return null;
    }
};


module.exports = {
    generateSymptomSummary,
    generatePostVisitSummary
};