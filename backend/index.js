const dotenv = require("dotenv");
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");
const { getOpenAIResponse } = require("./openaiService");
const {
  createBot,
  getUserById,
  getUserBots,
  updateBotStatus,
} = require("./helpers");
const signupRoute = require("./routes/signup");
const signinRoute = require("./routes/signin");
const {
  getAuthUrl,
  authenticate,
  addEventToCalendar,
  hasValidToken,
} = require("./googleCalendarService");
const { parse, addHours, format } = require("date-fns");
const { moderateContent } = require("./moderationService");
const leadsRouter = require("./routes/leads");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(require("cors")());

const activeBots = new Map();

// Import the necessary permission flag
const { Permissions } = require("discord.js");

/**
 * @param {string} prompt
 * @param {string} botName
 * @param {string} discordToken
 * @returns {Promise<string>}
 */
async function createDiscordBot(prompt, botName, discordToken) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  let isScheduling = false;

  client.once("ready", async () => {
    console.log(`Bot created and logged in as ${client.user.tag}!`);
    const guilds = client.guilds.cache.map((guild) => guild);
    for (const guild of guilds) {
      await ensurePermissions(client, guild);
      const member = guild.members.cache.get(client.user.id);
      if (member) {
        await member.setNickname(botName);
        console.log(`Nickname set to ${botName} in guild: ${guild.name}`);
      }
    }
  });

  client.on("guildCreate", async (guild) => {
    await ensurePermissions(client, guild);
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    try {
      const moderationResult = await moderateContent(message.content);
      if (moderationResult.flagged) {
        console.log(`Flagged message: ${message.content}`);
        console.log(
          `Flagged categories: ${moderationResult.categories.join(", ")}`
        );

        if (
          message.guild &&
          message.guild.members.me.permissions.has(
            PermissionFlagsBits.ManageMessages
          )
        ) {
          // Delete the flagged message
          await message.delete();
        } else {
          console.log(
            "Bot doesn't have permission to delete messages in this channel."
          );
        }

        // Notify the user
        try {
          await message.author.send(
            `Your message was flagged for the following reasons: ${moderationResult.categories.join(
              ", "
            )}. Please be mindful of our community guidelines.`
          );
        } catch (error) {
          console.error("Failed to send DM to user:", error);
        }

        // Optionally, notify moderators or log the incident
        const loggingChannel = message.guild.channels.cache.find(
          (channel) => channel.name === "mod-logs"
        );
        if (loggingChannel) {
          await loggingChannel.send(
            `Message from ${message.author.tag} was auto-moderated.\nContent: ${
              message.content
            }\nFlagged categories: ${moderationResult.categories.join(", ")}`
          );
        }

        return;
      }
    } catch (error) {
      console.error("Error in auto-moderation:", error);
      if (error.code === 50013) {
        console.error(
          "Bot lacks necessary permissions. Please check bot roles and channel permissions."
        );
      }
    }

    if (message.content.toLowerCase() === "/book") {
      if (hasValidToken()) {
        isScheduling = true;
        await message.reply(
          "Great! Let's schedule a meeting. Please provide the meeting summary."
        );
        const filter = (m) => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({
          filter,
          time: 60000,
          max: 1,
        });

        collector.on("collect", async (m) => {
          const summary = m.content;
          await m.reply(
            `Summary received: "${summary}". Now, please provide the start time and end time or duration (e.g., "9am saturday to 10am" or "tomorrow at 2pm for 1 hour").`
          );

          const timeCollector = message.channel.createMessageCollector({
            filter,
            time: 60000,
            max: 1,
          });

          timeCollector.on("collect", async (m) => {
            const timeInput = m.content;

            try {
              let prompt = `Convert the following time input to ISO 8601 format for both start and end times, if no year or month is provided, use the current year and month: "${timeInput}". Respond with two ISO 8601 formatted dates separated by a comma, representing the start and end times respectively. Only provide the formatted dates, nothing else.`;
              const aiResponse = await getOpenAIResponse(prompt, timeInput);
              console.log(aiResponse);

              const [startTimeStr, endTimeStr] = aiResponse
                .split(",")
                .map((str) => str.trim());
              const startTime = new Date(startTimeStr);
              const endTime = new Date(endTimeStr);

              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                throw new Error("Invalid date");
              }

              try {
                const eventDetails = {
                  summary,
                  start: startTime.toISOString(),
                  end: endTime.toISOString(),
                };
                const result = await addEventToCalendar(eventDetails);
                await m.reply(`Meeting scheduled successfully! ${result}`);
              } catch (error) {
                console.error("Error scheduling meeting:", error);
                await m.reply(
                  "An error occurred while scheduling the meeting. Please try again."
                );
              } finally {
                isScheduling = false;
              }
            } catch (error) {
              console.log(error);
              await m.reply(
                "I couldn't understand that time format. Please try again with the /book command."
              );
              isScheduling = false;
            }
          });
        });
        return;
      } else {
        // No token, start authentication process
        const authUrl = getAuthUrl();
        await message.reply(
          `Please authenticate with Google Calendar by visiting this URL: ${authUrl}`
        );
        return;
      }
    }

    // Only process messages with OpenAI if not scheduling an event
    if (!isScheduling) {
      try {
        const userMessage = message.content;
        const response = await getOpenAIResponse(userMessage, prompt);
        await message.channel.send(response);
      } catch (error) {
        console.error("Error processing message with OpenAI:", error);
        await message.channel.send(
          "I'm sorry, I encountered an error while processing your message. Please try again later."
        );
      }
    }
  });

  await client.login(discordToken);
  const inviteLink = await client.generateInvite({
    scopes: ["bot"],
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ChangeNickname,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ReadMessageHistory,
    ],
  });

  return { client, inviteLink };
}

async function ensurePermissions(client, guild) {
  const requiredPermissions = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ChangeNickname,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ReadMessageHistory,
  ];

  const botMember = guild.members.cache.get(client.user.id);
  const missingPermissions = requiredPermissions.filter(
    (perm) => !botMember.permissions.has(perm)
  );

  if (missingPermissions.length > 0) {
    const permissionNames = missingPermissions.map((perm) =>
      Object.keys(PermissionFlagsBits).find(
        (key) => PermissionFlagsBits[key] === perm
      )
    );

    console.log(
      `Missing permissions in guild ${guild.name}: ${permissionNames.join(
        ", "
      )}`
    );

    try {
      const owner = await guild.fetchOwner();
      await owner.send(
        `Hello! I'm missing some permissions in your server "${guild.name}". ` +
          `Please grant me the following permissions to ensure I can function properly: ` +
          `${permissionNames.join(
            ", "
          )}. You can update my permissions in the server settings.`
      );
    } catch (error) {
      console.error(
        `Failed to notify guild owner about missing permissions: ${error}`
      );
    }
  }
}

app.post("/create-bot", async (req, res) => {
  const { prompt, name, id, discordToken } = req.body;
  const user = await getUserById(id);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (!prompt || !name) {
    return res.status(400).json({ error: "Both prompt and name are required" });
  }

  try {
    const { client, inviteLink } = await createDiscordBot(
      prompt,
      name,
      discordToken
    );
    const bot = await createBot(
      user.id,
      prompt,
      name,
      inviteLink,
      discordToken
    );
    if (!bot) {
      return res.status(500).json({ error: "Failed to create bot" });
    }

    // Store the active bot client
    activeBots.set(bot.id, client);

    return res.status(200).json({ message: "Bot created", inviteLink });
  } catch (error) {
    console.error("Error creating Discord bot:", error);
    return res.status(500).json({ error: "Failed to create Discord bot" });
  }
});

app.use(signupRoute);
app.use(signinRoute);
app.use(leadsRouter); // Add this line

app.get("/user-bots", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const bots = await getUserBots(userId);

    // Deploy bots that are not already active
    for (const bot of bots) {
      if (!activeBots.has(bot.id)) {
        try {
          const { client } = await createDiscordBot(
            bot.prompt,
            bot.name,
            bot.discord_token
          );
          activeBots.set(bot.id, client);
          console.log(`Bot ${bot.name} (ID: ${bot.id}) deployed successfully`);
        } catch (error) {
          console.error(
            `Error deploying bot ${bot.name} (ID: ${bot.id}):`,
            error
          );
        }
      }
    }

    res.status(200).json({ bots });
  } catch (error) {
    console.error("Error fetching user bots:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving user bots" });
  }
});

// Add a function to gracefully shut down bots when the server stops
function shutdownBots() {
  for (const [botId, client] of activeBots.entries()) {
    client.destroy();
    console.log(`Bot ${botId} has been shut down.`);
  }
  activeBots.clear();
}

app.post("/oauth2callback", async (req, res) => {
  const { code } = req.body;
  try {
    await authenticate(code);
    res.send(
      "Authentication successful! You can close this window and return to Discord."
    );
  } catch (error) {
    console.error("Error authenticating with Google Calendar:", error);
    res.status(500).send("An error occurred during authentication.");
  }
});

// Add this new route after the existing routes
app.post("/toggle-bot", async (req, res) => {
  const { botId, userId, status } = req.body;
  console.log(
    `Received request to toggle bot ${botId} for user ${userId} to status ${status}`
  );

  if (!botId || !userId || typeof status !== "boolean") {
    console.log("Invalid request parameters:", { botId, userId, status });
    return res
      .status(400)
      .json({ error: "Bot ID, user ID, and status (boolean) are required" });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(400).json({ error: "User not found" });
    }

    const bots = await getUserBots(userId);
    const bot = bots.find((b) => b.id === parseInt(botId));

    if (!bot) {
      console.log(`Bot not found: ${botId}`);
      return res.status(404).json({ error: "Bot not found" });
    }

    console.log(`Current bot status:`, bot.status);

    if (status) {
      // Turn on the bot
      if (!activeBots.has(botId)) {
        console.log(`Activating bot ${botId}`);
        const { client } = await createDiscordBot(
          bot.prompt,
          bot.name,
          bot.discord_token
        );
        activeBots.set(botId, client);
        await updateBotStatus(botId, true);
        console.log(`Bot ${bot.name} (ID: ${botId}) has been turned on`);
      }
    } else {
      // Turn off the bot
      if (activeBots.has(botId)) {
        console.log(`Deactivating bot ${botId}`);
        const client = activeBots.get(botId);
        client.destroy();
        activeBots.delete(botId);
        await updateBotStatus(botId, false);
        console.log(`Bot ${bot.name} (ID: ${botId}) has been turned off`);
      }
    }

    const updatedBot = await getUserBots(userId).then((bots) =>
      bots.find((b) => b.id === parseInt(botId))
    );
    console.log(`Updated bot status:`, updatedBot.status);
    res.status(200).json({
      message: `Bot ${status ? "activated" : "deactivated"} successfully`,
      bot: updatedBot,
    });
  } catch (error) {
    console.error("Error toggling bot status:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while toggling bot status",
        details: error.message,
      });
  }
});

process.on("SIGINT", () => {
  console.log("Shutting down bots...");
  shutdownBots();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down bots...");
  shutdownBots();
  process.exit(0);
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
