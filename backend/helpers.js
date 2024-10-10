const pool = require("./db");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

async function getUserByUsername(username) {
  const user = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  return user.rows[0];
}

async function getUserById(id) {
  const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return user.rows[0];
}

async function updateUser(user) {
  try {
    await pool.query("UPDATE users SET bots = $1 WHERE id = $2", [
      user.bots, // Ensure bots is an array of integers
      user.id,
    ]);
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function createBot(creatorId, prompt, name, inviteLink, discordToken) {
  try {
    const bot = await pool.query(
      "INSERT INTO bots (creator, prompt, name, invite_link, discord_token) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [creatorId, prompt, name, inviteLink, discordToken]
    );

    if (bot.rows.length > 0) {
      const botId = bot.rows[0].id;

      // Insert the user-bot relationship into the user_bots table
      await pool.query(
        "INSERT INTO user_bots (user_id, bot_id) VALUES ($1, $2)",
        [creatorId, botId]
      );

      return bot.rows[0];
    } else {
      console.error("Failed to create bot");
      return null;
    }
  } catch (error) {
    console.error("Error creating bot:", error);
    throw error;
  }
}

async function getUserBots(userId) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.invite_link, b.prompt, b.name, b.discord_token, b.status
       FROM bots b
       JOIN user_bots ub ON b.id = ub.bot_id
       WHERE ub.user_id = $1`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("Error retrieving user bots:", error);
    throw error;
  }
}

async function scanMessagesForKeywords(client, keywords) {
  const allLeads = [];

  for (const guild of client.guilds.cache.values()) {
    const channels = guild.channels.cache.filter(
      (channel) =>
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildVoice ||
        channel.type === ChannelType.GuildForum
    );

    for (const channel of channels.values()) {
      try {
        let messages;
        if (channel.type === ChannelType.GuildForum) {
          const threads = await channel.threads.fetch();
          messages = new Map();
          for (const thread of threads.threads.values()) {
            const threadMessages = await thread.messages.fetch({ limit: 100 });
            messages = new Map([...messages, ...threadMessages]);
          }
        } else {
          messages = await channel.messages.fetch({ limit: 100 });
        }

        for (const message of messages.values()) {
          const content = message.content.toLowerCase();
          for (const keyword of keywords) {
            if (content.includes(keyword)) {
              allLeads.push({
                keyword,
                message: message.content,
                author: message.author.username,
                channel: channel.name,
                guild: guild.name,
                timestamp: message.createdAt,
                channelType: channel.type,
                threadName:
                  channel.type === ChannelType.GuildForum
                    ? message.channel.name
                    : null,
              });
              break; // Move to the next message after finding a match
            }
          }
        }
      } catch (error) {
        console.error(
          `Error fetching messages from channel ${channel.name}:`,
          error
        );
      }
    }
  }

  return allLeads;
}

async function updateBotStatus(botId, status) {
  try {
    console.log(`Attempting to update bot ${botId} status to ${status}`);

    const result = await pool.query(
      "UPDATE bots SET status = $1 WHERE id = $2 RETURNING *",
      [status, botId]
    );

    console.log(`Query result:`, result);

    if (result.rowCount === 0) {
      console.log(`No bot found with id ${botId}`);
      throw new Error("Bot not found");
    }

    console.log(
      `Bot ${botId} status updated to ${status ? "active" : "inactive"}`
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating bot status:", error);
    throw error;
  }
}

module.exports = {
  getUserByUsername,
  getUserById,
  createBot,
  getUserBots,
  scanMessagesForKeywords,
  updateBotStatus,
};
