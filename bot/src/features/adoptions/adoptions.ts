import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { claimAdoption } from "../../storage";

export function adoptionButton(id: string, claimed = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`adopt-oc:${id}`)
      .setLabel(claimed ? "Adopted" : "Adopt this OC")
      .setStyle(claimed ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(claimed),
  );
}

export async function adoptOC(
  interaction: ButtonInteraction,
  offerId: string,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guildId || interaction.message.id !== offerId) {
    await interaction.editReply("This adoption offer is invalid.");
    return;
  }
  try {
    const result = await claimAdoption(offerId, interaction.guildId, {
      userId: interaction.user.id,
      username: interaction.user.username,
      displayName: interaction.user.globalName ?? interaction.user.username,
    });
    if (result.status === "missing") {
      await interaction.editReply("This adoption offer could not be found.");
      return;
    }
    if (result.status === "already-claimed") {
      await interaction.editReply(
        result.ownerId === interaction.user.id
          ? "You already adopted this OC. Its claim remains yours even if you delete the saved sheet."
          : "Someone else already adopted this OC.",
      );
      return;
    }
  } catch (error) {
    console.error("Could not claim OC adoption:", error);
    await interaction.editReply(
      "The OC could not be adopted. Please try again.",
    );
    return;
  }
  await interaction.editReply(
    "OC adopted! Find its sheet with /savedprompts kind:oc or in your dashboard library.",
  );
  try {
    await interaction.message.edit({
      content: `Adopted by <@${interaction.user.id}>`,
      components: [adoptionButton(offerId, true)],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error(
      "OC adopted but the public message could not be updated:",
      error,
    );
    await interaction.followUp({
      content:
        "Your adoption is saved, but I could not update the public message. Further claims will still be blocked.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
