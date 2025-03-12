// index.js is usually the main file that you run. Upon running it, the file runs all the other files and starts the bot.

// Here we import all of our packages such as discordjs.
const { Client, GatewayIntentBits, Collection } = require("discord.js"); // Import the client base and the intentbits.
require("dotenv").config(); // Import our token & other private variables.

// Import our handlers
const ButtonHandler = require("./src/handlers/buttons");
const RoleSelectMenuHandler = require("./src/handlers/roleSelectmenu");
const ChannelSelectMenuHandler = require("./src/handlers/channelSelectmenu");
const StringSelectMenuHandler = require("./src/handlers/stringSelectmenu");
const ModalHandler = require("./src/handlers/modals");

process.on("uncaughtException", (e) => {
  return console.error(e);
});

// Extend the Client class so we have customizable features.
class CustomClient extends Client {
  constructor() {
    super({
      // Add intents so we can access the data we need.
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        // GatewayIntentBits.DirectMessages, // If you want the bot to work in DM's too, please remove the first 2 slashes in the line.
      ],
    });
    // Set client.prefix for easy access.
    this.prefix = process.env.PREFIX;

    // Load in all the custom made libraries.
    this.l = require("./src/lib/logger");
    this.p = require("./src/lib/prcHandler");

    // Load in the handlers for interactions such as buttons.
    this.b = new ButtonHandler(this);
    this.rs = new RoleSelectMenuHandler(this);
    this.cs = new ChannelSelectMenuHandler(this);
    this.ss = new StringSelectMenuHandler(this);
    this.m = new ModalHandler(this);
    this.prefixCommands = new Collection();
    this.slashCommands = new Collection();

    // Load the handlers for commands and events.
    require("./src/handlers/prefixCommands")(this);
    require("./src/handlers/slashCommands")(this);
    require("./src/handlers/events")(this);
  }
}

// Create a new client & add the required intents.
const client = new CustomClient();

// Login to the bot account with the bot's token.
client.login(process.env.TOKEN);
client.once("ready", () => {
  client.l.ok(`Logged in as ${client.user.tag}`);
});
