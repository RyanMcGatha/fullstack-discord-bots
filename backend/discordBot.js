const { Client, GatewayIntentBits } = require("discord.js");
const { getOpenAIResponse } = require("./openaiService");
const {
  getAuthUrl,
  authenticate,
  loadToken,
  addEventToCalendar,
} = require("./googleCalendarService");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Handle the authentication code if it's provided
  if (message.content.toLowerCase().startsWith("!code ")) {
    const code = message.content.split(" ")[1];
    try {
      await authenticate(code);
      message.channel.send("Successfully authenticated with Google Calendar!");
    } catch (error) {
      console.error("Error authenticating:", error);
      message.channel.send("Failed to authenticate.");
    }
  }

  // Add event to Google Calendar
  if (message.content.toLowerCase().startsWith("!event ")) {
    const eventInput = message.content.slice(7); // Strip away '!event ' from message
    const eventDetails = parseEventDetails(eventInput);

    if (!eventDetails) {
      return message.channel.send(
        "Please provide event details in the format: `!event <summary> on <start date and time> to <end date and time>`"
      );
    }

    try {
      if (!loadToken()) {
        // If the token is not found, start the authentication process automatically
        const authUrl = getAuthUrl();
        message.channel.send(
          `You are not authenticated. Please authenticate using this link: ${authUrl}`
        );
        return;
      }

      // Once authenticated, proceed to create the event
      const result = await addEventToCalendar(eventDetails);
      message.channel.send(result);
    } catch (error) {
      console.error("Error adding event:", error);
      message.channel.send("Failed to add event to Google Calendar.");
    }
  }

  // Regular OpenAI response
  try {
    const reply = await getOpenAIResponse(message.content);
    await message.channel.send(reply);
  } catch (error) {
    console.error("Error responding to message:", error);
    await message.channel.send(
      "Sorry, something went wrong while processing your request."
    );
  }
});

function startDiscordBot(token) {
  client.login(token);
}

// Helper function to parse event details from user message
function parseEventDetails(input) {
  const regex = /(.+?) on (.+?) to (.+)/;
  const matches = input.match(regex);
  if (matches) {
    const summary = matches[1];
    const start = new Date(matches[2]);
    const end = new Date(matches[3]);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    return { summary, start: start.toISOString(), end: end.toISOString() };
  }
  return null;
}

module.exports = { startDiscordBot };
