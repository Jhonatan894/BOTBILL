import { ApplicationCommandType, Guild, VoiceChannel, GuildMember } from "discord.js";
import { Command } from "../../structs/types/Command";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import { FFmpeg } from "prism-media"; // Importando o FFmpeg do prism-media
import { createReadStream } from "fs"; // Importando para leitura do arquivo se necessário

export default new Command({
  name: "music",
  description: "Controle de música",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "play",
      description: "Tocar uma música usando um link do YouTube",
      type: 3, // String option type (corrigido)
      required: true,
    },
  ],
  async run({ interaction }) {
    if (!interaction.isChatInputCommand()) return;

    const guild = interaction.guild as Guild;

    // Verificando se o membro é do tipo GuildMember
    const member = interaction.member;

    if (!(member instanceof GuildMember)) {
      return interaction.reply({ content: "Você precisa estar em um servidor para usar este comando.", ephemeral: true });
    }

    const userChannel = member.voice.channel as VoiceChannel;

    if (!userChannel) {
      return interaction.reply({ content: "Você precisa estar em um canal de voz para usar este comando!", ephemeral: true });
    }

    const musicLink = interaction.options.getString("play", true);

    // Verificar se a URL fornecida é válida
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

      // Criação do stream de áudio usando FFmpeg
      const stream = ytdl(musicLink, { filter: "audioonly", quality: "highestaudio" });

      // Usando prism-media para transformar o stream de áudio
      const ffmpeg = new FFmpeg({
        args: [
          "-an", // Desativar vídeo
          "-f", "wav", // Formato do áudio
          "-ar", "48000", // Taxa de amostragem
          "-ac", "2", // Canais estéreo
        ],
        shell: true,
      });

      // Passando o stream do YouTube para o FFmpeg
      const resource = createAudioResource(stream.pipe(ffmpeg), {
        inputType: StreamType.Arbitrary, // Usar StreamType.Arbitrary para streams genéricos
      });

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply({ content: `🎶 Tocando agora: ${musicLink}` });

      player.on("error", (error) => {
        console.error("Erro no player:", error);
        interaction.followUp({ content: "Ocorreu um erro ao reproduzir a música.", ephemeral: true });
      });

      player.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          connection.destroy(); // Desconecta após a música terminar
        }
      });
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      await interaction.editReply({ content: "Ocorreu um erro ao tentar tocar a música." });
    }
  },
});
