// Import required libraries.
const {
  SlashCommandBuilder,
  Client,
  CommandInteraction,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  // Create the command data (name, description, options, etc.)
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from this server.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user you want to unban from this server.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("The reason for unbanning this user.")
        .setRequired(false)
    ),

  // Set the types of client & interaction to make it easier to see available options.
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {User} target
   */

  // Create the code to execute when a user runs the command.
  execute: async (client, interaction) => {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be ran inside of a guild.",
        flags: 64, // Ephemeral
      });
    }

    if (!interaction.member.permissions.has("BanMembers")) {
      return interaction.reply({
        content:
          "You do not have the proper permissions to run this command. You need the `Ban Members` permissions to use this command.",
        flags: 64, // Ephemeral
      });
    }

    // Take the user and reason, if there is no reason, state so.
    const reason =
      (await interaction.options.getString("reason")) || "No reason provided.";
    const target = await interaction.options.getUser("user");
    // Check if they're a member
    if (!target) {
      return interaction.reply({
        content: "The user you are trying to unban does not exist.",
        flags: 64, // Ephemeral
      });
    }

    const banList = await interaction.guild.bans.fetch();

    const bannedUser = banList.find((user) => user.id === target.id);

    if (!bannedUser) {
      return interaction.reply({
        content:
          "The user you are trying to unban is not currently banned from this guild.",
        flags: 64, // Ephemeral
      });
    }

    // Check bot permissions.
    if (!interaction.guild.members.me.permissions.has("BanMembers")) {
      return interaction.reply({
        content:
          "I do not have the mandatory permissions to unban that user. Please ask your server administrator to give me the `Ban Members` permission.",
        flags: 64, // Ephemeral
      });
    }
    // DM the target to notify them about the ban, catch any errors to prevent crashes.

    await interaction.guild.bans
      .remove(target, `[${interaction.user.tag}] ${reason}`)
      .then(() => {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("User unbanned")
              .setDescription(
                `You have successfully unbanned the user from this server.\n\n**Punishment information**\n> Target: <@${target.id}>\n> Reason: \`${reason}\``
              )
              .setColor("Red"),
          ],
        });
      });
  },
};
