// Import required libraries.
const {
  SlashCommandBuilder,
  Client,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
} = require("discord.js");

module.exports = {
  // Create the command data (name, description, options, etc.)
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user in this server.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user you want to unmute in this server.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("The reason for unmuting this user.")
        .setRequired(false)
    ),

  // Set the types of client & interaction to make it easier to see available options.
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {GuildMember} target
   */

  // Create the code to execute when a user runs the command.
  execute: async (client, interaction) => {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be ran inside of a guild.",
        flags: 64, // Ephemeral
      });
    }

    if (!interaction.member.permissions.has("MuteMembers")) {
      return interaction.reply({
        content:
          "You do not have the proper permissions to run this command. You need the `Mute Members` permissions to use this command.",
        flags: 64, // Ephemeral
      });
    }

    // Take the user, duration and reason, if there is no reason, state so.
    const reason =
      (await interaction.options.getString("reason")) || "No reason provided.";
    const target = await interaction.options.getMember("user");
    // Check if they're a member
    if (!target) {
      return interaction.reply({
        content:
          "The user you are trying to unmute is not a member of this guild.",
        flags: 64, // Ephemeral
      });
    }

    // Check if the target is not the moderator.
    if (target.user.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot unmute yourself!",
        flags: 64, // Ephemeral
      });
    }

    // Check if the target is not the owner.
    if (target.user.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: "You cannot unmute the guild owner.",
        flags: 64, // Ephemeral
      });
    }

    if (target.user.id === client.user.id) {
      return interaction.reply({
        content:
          "I cannot unmute myself, please do it manually or ask your server administrator for help.",
        flags: 64, // Ephemeral
      });
    }

    // Check if the moderator has a higher role than the target.
    if (
      target.roles.highest.comparePositionTo(interaction.member.roles.highest) >
      1
    ) {
      return interaction.reply({
        content: "You cannot unmute someone who has a higher role than you.",
        flags: 64, // Ephemeral
      });
    }

    // Check bot permissions.
    if (!interaction.guild.members.me.permissions.has("MuteMembers")) {
      return interaction.reply({
        content:
          "I do not have the mandatory permissions to unmute that user. Please ask your server administrator to give me the `Mute Members` permission.",
        flags: 64, // Ephemeral
      });
    }

    // Check bot roles.
    if (
      target.roles.highest.comparePositionTo(
        interaction.guild.members.me.roles.highest
      ) > 1
    ) {
      return interaction.reply({
        content:
          "The user is roled higher than me, I am unable to unmute them. Please ask your server administrator to give me a role above the person you are trying to mute.",
        flags: 64, // Ephemeral
      });
    }

    // Check if the target is a bot.
    if (target.user.bot) {
      return interaction.reply({
        content: "Bots cannot be unmuted.",
        flags: 64, // Ephemeral
      });
    }

    // DM the target to notify them about the ban, catch any errors to prevent crashes.
    await target
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle("You have been unmuted")
            .setDescription(
              `You have been unmuted in \`${interaction.guild.name}\` (${
                interaction.guild.id
              }).\n\n**Punishment information**\n> Issuer: <@${
                interaction.user.id
              }>\n> Reason: \`${reason}\`\n> Time: <t:${Math.floor(
                Date.now() / 1000
              )}:F>`
            )
            .setColor("Green"),
        ],
      })
      .catch((e) => {}); // Catch any errors, incase the target's DMs are closed.

    await target
      .timeout(null, `[${interaction.user.tag}] ${reason}`)
      .then(() => {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("User unmuted")
              .setDescription(
                `You have successfully unmute the user from this server.\n\n**Punishment information**\n> Target: <@${target.user.id}>\n> Reason: \`${reason}\``
              )
              .setColor("Green"),
          ],
        });
      });
  },
};
