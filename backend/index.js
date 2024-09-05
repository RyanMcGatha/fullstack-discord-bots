// Required imports
const dotenv = require("dotenv");
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");
const { getOpenAIResponse } = require("./openaiService");

dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(require("cors")());

/**
 * Function to create a new Discord bot and return its invite link
 * @param {string} prompt - The prompt to be used for the bot's responses
 * @param {string} botName - The name to be set as the bot's nickname in the server
 * @returns {Promise<string>} - Returns the invite link of the new bot
 */
async function createDiscordBot(prompt, botName) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("ready", async () => {
    console.log(`Bot created and logged in as ${client.user.tag}!`);

    // Set the bot's nickname in the servers it joins
    const guilds = client.guilds.cache.map((guild) => guild);
    for (const guild of guilds) {
      const member = guild.members.cache.get(client.user.id);
      if (member) {
        await member.setNickname(botName); // Set the bot's nickname
        console.log(`Nickname set to ${botName} in guild: ${guild.name}`);
      }
    }
  });

  // Handle messages and respond using the provided prompt
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    const userMessage = message.content;

    // For simplicity, reply with the prompt for every user message
    const response = await getOpenAIResponse(userMessage, prompt);
    await message.channel.send(response);
  });

  // Log in to Discord with a bot token
  await client.login(process.env.DISCORD_BOT_TOKEN);

  // Generate an invite link for the bot with required scopes and permissions
  const inviteLink = await client.generateInvite({
    scopes: ["bot"], // Add the necessary scopes
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel,
    ], // Use PermissionFlagsBits for permissions
  });

  return inviteLink;
}

// API route to create a new Discord bot with a given prompt and name
app.post("/create-bot", async (req, res) => {
  const { prompt, name } = req.body;

  if (!prompt || !name) {
    return res.status(400).json({ error: "Both prompt and name are required" });
  }

  try {
    const inviteLink = await createDiscordBot(prompt, name);
    return res.status(200).json({ message: "Bot created", inviteLink });
  } catch (error) {
    console.error("Error creating Discord bot:", error);
    return res.status(500).json({ error: "Failed to create Discord bot" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
