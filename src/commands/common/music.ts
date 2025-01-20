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
      name: "play",
      description: "Tocar uma música (YouTube, Spotify, SoundCloud ou arquivo de áudio)",
      type: 3,  // Tipo de opção String (corrigido)
      required: true,
    },
  ],
  async run({ interaction }) {
    if (!interaction.isChatInputCommand()) return;

    const guild = interaction.guild as Guild;
    const member = interaction.member;

    if (!(member instanceof GuildMember)) {
      return interaction.reply({ content: "Você precisa estar em um servidor para usar este comando.", ephemeral: true });
    }

    const userChannel = member.voice.channel as VoiceChannel;

    if (!userChannel) {
      return interaction.reply({ content: "Você precisa estar em um canal de voz para usar este comando!", ephemeral: true });
    }

    let musicLink = interaction.options.getString("music", true);
    console.log("Link da música:", musicLink);

    // Verificar se o link é de uma das fontes suportadas
    const isYouTubeLink = await play.validate(musicLink);
    const isDirectAudio = /\.(mp3|flac|wav|ogg)$/i.test(musicLink);

    if (play.is_expired()) await play.refreshToken();

    // Verificar se é link do Spotify
    const spotifyInfo = await play.spotify(musicLink); // Usando await aqui
    if (spotifyInfo) {
      const searchResult = await play.search(spotifyInfo.name, { limit: 1 });
      if (!searchResult.length) {
        return interaction.reply({ content: "Não foi possível encontrar esta música no YouTube!", ephemeral: true });
      }
      musicLink = searchResult[0].url; // Converte para YouTube
    }

    // Verificar se é link do SoundCloud
    if (!isYouTubeLink && !isDirectAudio && !play.soundcloud(musicLink)) {
      return interaction.reply({
        content: "Por favor, forneça um link válido do YouTube, Spotify, SoundCloud ou um arquivo de áudio direto!",
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

      let resource;
      if (isDirectAudio) {
        resource = createAudioResource(musicLink); // Arquivo de áudio direto
      } else {
        const stream = await play.stream(musicLink);
        resource = createAudioResource(stream.stream, { inputType: StreamType.Arbitrary });
      }

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply({ content: `🎶 Tocando agora: (${musicLink})` });

      player.on("error", (error) => {
        console.error("Erro no player:", error.message);
        interaction.followUp({ content: "Ocorreu um erro ao reproduzir a música.", ephemeral: true });
      });

      player.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          connection.destroy(); // Desconecta após a música terminar
        }
      });
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      await interaction.editReply({
        content: "Ocorreu um erro ao tentar tocar a música.",
      });
    }
  },
});
