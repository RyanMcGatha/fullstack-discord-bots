const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function moderateContent(content) {
  try {
    const response = await openai.moderations.create({ input: content });
    const result = response.results[0];

    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, value]) => value)
        .map(([key, _]) => key);

      return {
        flagged: true,
        categories: flaggedCategories,
        score: result.category_scores,
      };
    }

    return { flagged: false };
  } catch (error) {
    console.error("Error moderating content:", error);
    throw new Error("Failed to moderate content");
  }
}

module.exports = { moderateContent };
