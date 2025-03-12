// Import packages
const path = require("path");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

// Export the function to load and run prefix based commands.
module.exports = (client) => {
  // Take the prefix and make sure it's available.
  const prefix = client.prefix;

  // Read all the files from the prefixCommands folder that end with .js (javascript).
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../prefixCommands"))
    .filter((file) => file.endsWith(".js"));

  // Cycle through all command files and add them to the collection.
  commandFiles.forEach((file) => {
    const command = require(path.join(__dirname, "../prefixCommands", file));
    client.prefixCommands.set(command.name, command);
  });

  // This code runs when a message is sent in a channel the bot can access.
  client.on("messageCreate", async (message) => {
    // Check if the message is sent by a bot or doesnt contain the set prefix.
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    // Split the message up (split up at spaces) to get arguments.
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    // Take the first argument as the commandName and remove it.
    const commandName = args.shift().toLowerCase();

    // Fetch the command from the collection.
    const command = client.prefixCommands.get(commandName);
    // If the command is not found, cancel and do nothing.
    if (!command) return;

    // If the command is guildOnly but is ran outside one, cancel and reply saying so.
    if (command.guildOnly && interaction.guildId === null) {
      return message.reply(
        `${client.e.cross} This command is limited to channels inside a guild!`
      );
    }

    // If the command is devOnly and if it is, check if the user ID matches the dev ID.
    if (command.devOnly && interaction.user.id !== process.env.DEV_ID) {
      const localTitle = {
        en: "Not allowed",
        "es-ES": "No permitido",
        fr: "Non autorisé",
        de: "Nicht erlaubt",
        "sv-SE": "Inte tillåtet",
        nl: "Niet toegestaan",
      };

      const localDescription = {
        en: "You are not allowed to use this command as it is limited to developers.",
        "es-ES":
          "No tienes permiso para usar este comando ya que está limitado a desarrolladores.",
        fr: "Vous n'êtes pas autorisé à utiliser cette commande car elle est limitée aux développeurs.",
        de: "Sie dürfen diesen Befehl nicht verwenden, da er auf Entwickler beschränkt ist.",
        "sv-SE":
          "Du har inte tillåtelse att använda detta kommando eftersom det är begränsat till utvecklare.",
        nl: "Je mag dit commando niet gebruiken omdat het beperkt is tot ontwikkelaars.",
      };

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              localTitle[message.guild.preferredLocale] ?? localTitle.en
            )
            .setDescription(
              localDescription[message.guild.preferredLocale] ??
                localDescription.en
            )
            .setColor("#2b2d31"),
        ],
      });
    }

    try {
      // Run the execute function from the command file.
      await command.execute(client, message, args);
    } catch (error) {
      // If there is an error, log it and reply with an error message.
      client.l.error(`PrefixCommand Error: ${error.stack}`);
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `${client.e.cross} Uh oh! It looks like something went wrong...\n> Contact suppport if this error occurs again.`
            )
            .setColor("#2b2d31"),
        ],
      });
    }
  });
};
