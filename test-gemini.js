require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
async function run() {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", 
        // Mock iOS bundle ID
        apiClient: "com.peratakvimi.app" 
    }, {
        customHeaders: {
            "X-Ios-Bundle-Identifier": "com.peratakvimi.app"
        }
    });
    const result = await model.generateContent("Merhaba, çalışıyor musun?");
    console.log(result.response.text());
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
