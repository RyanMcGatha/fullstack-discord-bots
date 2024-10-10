const express = require("express");
const router = express.Router();
const { Client, GatewayIntentBits } = require("discord.js");
const { scanMessagesForKeywords } = require("../helpers");

router.get("/leads", async (req, res) => {
  const { keywords, discordBotToken } = req.query;

  if (!keywords) {
    return res.status(400).json({ error: "Keywords are required" });
  }

  if (!discordBotToken) {
    return res.status(400).json({ error: "Discord bot token is required" });
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  try {
    await client.login(discordBotToken);

    const keywordArray = keywords.split(",").map((k) => k.trim().toLowerCase());
    const leads = await scanMessagesForKeywords(client, keywordArray);

    await client.destroy();

    res.json(leads);
  } catch (error) {
    console.error("Error scanning messages:", error);
    res
      .status(500)
      .json({ error: "An error occurred while scanning messages" });
  }
});

module.exports = router;
