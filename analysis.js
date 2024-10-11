import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1.js';
import { IamAuthenticator } from 'ibm-watson/auth/index.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Initialiser Watson NLU avec tes informations depuis le .env
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2021-08-01',
  authenticator: new IamAuthenticator({
    apikey: process.env.IBM_API_KEY, // Chargé depuis le .env
  }),
  serviceUrl: process.env.IBM_SERVICE_URL, // Chargé depuis le .env
});

async function analyzeMessage(text) {
  if (!text || text.trim().length < 10 || text.split(/\s+/).length < 3) { 
    throw new Error('Le texte est trop court pour être analysé. Minimum 10 caractères et 3 mots.');
  }

  try {
    const analyzeParams = {
      text: text,
      features: {
        sentiment: {},
        emotion: {}
      },
    };

    const analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);
    return analysisResults.result;
  } catch (error) {
    console.error('Erreur lors de l\'analyse Watson:', error);
    throw error;
  }
}

export { analyzeMessage };
