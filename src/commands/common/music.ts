import { ApplicationCommandType, Guild, VoiceChannel, GuildMember } from "discord.js";
import { Command } from "../../structs/types/Command";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } from "@discordjs/voice";
import play from "play-dl";

export default new Command({
  name: "music",
  description: "Controle de música",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "music",
      description: "Tocar uma música usando um link do YouTube",
      type: 3, // String option type
      required: true,
    },
  ],
  async run({ interaction }) {
    if (!interaction.isChatInputCommand()) return;

    const guild = interaction.guild as Guild;

    const member = interaction.member;
    if (!(member instanceof GuildMember)) {
      return interaction.reply({
        content: "Você precisa estar em um servidor para usar este comando.",
        ephemeral: true,
      });
    }

    const userChannel = member.voice.channel as VoiceChannel;
    if (!userChannel) {
      return interaction.reply({
        content: "Você precisa estar em um canal de voz para usar este comando!",
        ephemeral: true,
      });
    }

    const musicLink = interaction.options.getString("music", true);

    // Verificar se a URL fornecida é válida
    if (!(await play.validate(musicLink))) {
      return interaction.reply({
        content: "Por favor, forneça um link válido do YouTube!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const connection = joinVoiceChannel({
        channelId: userChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      // Usando play-dl para obter o stream
      const stream = await play.stream(musicLink);

      // Criando recurso de áudio para Discord
      const resource = createAudioResource(stream.stream, {
        inputType: StreamType.Arbitrary, // Arbitrário, já que o stream está em formato apropriado
      });

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply({
        content: `🎶 Tocando agora: [Link](${musicLink})`,
      });

      player.on("error", (error) => {
        console.error("Erro no player:", error.message);
        interaction.followUp({
          content: "Ocorreu um erro ao reproduzir a música.",
          ephemeral: true,
        });
      });

      player.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          interaction.followUp({
            content: "A música terminou. Saindo do canal de voz.",
            ephemeral: true,
          });
          connection.destroy(); // Desconecta após a música terminar
        }
      });
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      await interaction.editReply({
        content: "Ocorreu um erro ao tentar tocar a música. Por favor, tente novamente.",
      });
    }
  },
});
