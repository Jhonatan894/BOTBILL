import {
  ApplicationCommandType,
  Guild,
  VoiceChannel,
  GuildMember,
} from "discord.js";
import { Command } from "../../structs/types/Command";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnection,
  StreamType,
} from "@discordjs/voice";
import play from "play-dl";
import { createReadStream } from "fs";

export default new Command({
  name: "music",
  description: "Tocar música do YouTube ou SoundCloud",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "url",
      description: "URL da música ou playlist do YouTube/SoundCloud",
      type: 3, // Tipo de string (URL)
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
        content:
          "Você precisa estar em um canal de voz para usar este comando!",
        ephemeral: true,
      });
    }

    const musicUrl = interaction.options.getString("url", true);

    // Validar o link do YouTube ou SoundCloud
    const isValid = await play.validate(musicUrl);

    if (
      !isValid ||
      (isValid !== "yt_video" &&
        isValid !== "yt_playlist" &&
        isValid !== "so_track" &&
        isValid !== "so_playlist")
    ) {
      return interaction.reply({
        content:
          "O link fornecido não é válido! Por favor, insira um link válido do YouTube ou SoundCloud.",
        ephemeral: true,
      });
    }

    if (isValid === "yt_playlist" || isValid === "so_playlist") {
      return interaction.reply({
        content:
          "Ainda não suportamos a reprodução de playlists. Por favor, forneça um link de música.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // Conectar ao canal de voz
      const connection: VoiceConnection = joinVoiceChannel({
        channelId: userChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      console.log("Tentando obter o stream da URL...");
      const stream = await play.stream(musicUrl);

      console.log("Stream obtido com sucesso. Detalhes do stream:", stream);

      // Criar o recurso de áudio
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type, // Deve ser 'opus'
      });

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      console.log("Recurso de áudio criado e tocando...");

      await interaction.editReply({
        content: `🎶 Tocando música: ${musicUrl}`,
      });

      // Tratamento de eventos do player
      player.on("error", (error) => {
        console.error("Erro no player:", error);
        interaction.followUp({
          content: "Ocorreu um erro ao reproduzir a música.",
          ephemeral: true,
        });
      });

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🎵 Música está tocando...");
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log("⏹ Música finalizada. Desconectando...");
        connection.destroy(); // Desconecta após a música terminar
      });
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      await interaction.editReply({
        content: "Ocorreu um erro ao tentar tocar a música.",
      });

      // Teste com áudio local em caso de erro
      try {
        const connection: VoiceConnection = joinVoiceChannel({
          channelId: userChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        console.log("Tentando tocar áudio local para depuração...");
        const resource = createAudioResource(
          createReadStream("./audio.mp3"), // Certifique-se de que esse arquivo exista
          { inputType: StreamType.Arbitrary }
        );

        const player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);

        await interaction.editReply({
          content: `🎶 Não foi possível reproduzir o link. Tocando um áudio local para teste.`,
        });
      } catch (localError) {
        console.error("Erro ao tentar tocar o áudio local:", localError);
        await interaction.editReply({
          content:
            "Ocorreu um erro ao tentar tocar a música, nem mesmo o áudio local pôde ser reproduzido.",
        });
      }
    }
  },
});
