// Import packages
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Collection, EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

// Export the function
module.exports = (client) => {
  // Get all the files in the slashCommands folder that end with .js (javascript files).
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../slashCommands"))
    .filter((file) => file.endsWith(".js"));

  // Cycle through all the command files and add them to the collection.
  commandFiles.forEach((file) => {
    const command = require(path.join(__dirname, "../slashCommands", file));
    client.slashCommands.set(command.data.name, command);
  });

  // The code is triggered when an interaction is created.
  client.on("interactionCreate", async (interaction) => {
    // If the interaction is not a command, you cancel.
    if (!interaction.isCommand()) return;

    // Take the command from the collection, if it is not found you cancel;
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // If the command is guildOnly and it is being used outside of a guild, cancel and reply saying so.
    if (command.guildOnly && interaction.guildId === null) {
      return interaction.reply(
        `${client.e.cross} This command is limited to channels inside a guild!`
      );
    }

    // If the command is devOnly and it is being used by someone else than the developer, cancel and reply saying so.
    if (command.devOnly && process.env.DEV_ID !== interaction.user.id) {
      return interaction.reply(
        `${client.e.cross} This command is limited to developers!`
      );
    }

    try {
      // Run the command's execute function.
      await command.execute(client, interaction);
    } catch (error) {
      // Log errors if any occur.
      client.l.error(`SlashCommand Error: ${error.stack}`);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `Uh oh! It looks like something went wrong...\n> Contact suppport if this error occurs again.`
            )
            .setColor("#2b2d31"),
        ],
      });
    }
  });

  // This code is ran when the bot is online & ready.
  client.on("ready", async () => {
    // Make 2 empty presets to add data to.
    const globalCommands = [];
    const guildCommands = new Map();

    // Cycle through all the commands and put them in the correct preset
    for (const command of client.slashCommands.values()) {
      const commandData = command.data.toJSON();

      // If a guildId is provided, the command will register to that guild only. Else it will be a global command.
      if (command.guildId) {
        if (!guildCommands.has(command.guildId)) {
          guildCommands.set(command.guildId, []);
        }
        guildCommands.get(command.guildId).push(commandData);
      } else {
        globalCommands.push(commandData);
      }
    }

    // Start registering the commands.
    try {
      client.l.log("Started refreshing application (/) commands.");

      // Check for any global commands. If there are more than 0, run the register command.
      if (globalCommands.length > 0) {
        // Register the commands and log the success.
        await client.application.commands.set(globalCommands);
        client.l.ok(
          `GlobalSlashCommandHandler (${globalCommands.length} commands)`
        );
      }

      // Cycle through all the guildCommands and register them to the correct guild.
      for (const [guildId, commands] of guildCommands) {
        // Find the guild in the client's cache.
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          // Register the commands to the specified guild.
          await guild.commands.set(commands);
          client.l.ok(
            `Guild(${guild.id})SlashcommandHandler (${commands.length} commands)`
          );
        } else {
          // If the guild is not found, it logs it as a warning to notify the developer.
          client.l.warn(`Guild with ID ${guildId} not found.`);
        }
      }

      client.l.ok("Successfully refreshed application (/) commands.");
    } catch (error) {
      // If any errors occur, log it and prevent the bot from crashing.
      client.l.error(`SlashCommandRegister Error: ${error.stack}`);
    }
  });
};
