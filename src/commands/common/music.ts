import { ApplicationCommandType, Guild, SlashCommandStringOption, VoiceChannel } from "discord.js";
import { Command } from "../../structs/types/Command";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import ytdl from "ytdl-core";

export default new Command({
  name: "music",
  description: "Controle de música",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "play",
      description: "Tocar uma música usando um link do YouTube",
      type: 3, // String option type
      required: true,
    },
  ],
  async run({ interaction }) {
    if (!interaction.isChatInputCommand()) return;

    const guild = interaction.guild as Guild;
    const userChannel = interaction.member?.voice.channel as VoiceChannel;

    if (!userChannel) {
      return interaction.reply({ content: "Você precisa estar em um canal de voz para usar este comando!", ephemeral: true });
    }

    const musicLink = interaction.options.getString("play", true);

    if (!ytdl.validateURL(musicLink)) {
      return interaction.reply({ content: "Por favor, forneça um link válido do YouTube!", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const connection = joinVoiceChannel({
        channelId: userChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      const stream = ytdl(musicLink, { filter: "audioonly", quality: "highestaudio" });
      const resource = createAudioResource(stream);
      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply({ content: `🎶 Tocando agora: ${musicLink}` });

      player.on("error", (error) => {
        console.error("Erro no player:", error);
        interaction.followUp({ content: "Ocorreu um erro ao reproduzir a música.", ephemeral: true });
      });

      player.on("idle", () => {
        connection.destroy(); // Desconecta após a música terminar
      });
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      await interaction.editReply({ content: "Ocorreu um erro ao tentar tocar a música." });
    }
  },
});
