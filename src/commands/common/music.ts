import { ApplicationCommandType, Guild, VoiceChannel, GuildMember, ChatInputCommandInteraction, PermissionResolvable } from "discord.js";
import { Command } from "../../structs/types/Command";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } from "@discordjs/voice";
import play from "play-dl";

const queue = new Map<string, QueueItem>(); // Fila de músicas (alterada para Map com a tipagem adequada)

interface Song {
  id: string;
  title: string;
  url: string;
}

interface QueueItem {
  textChannel: any;
  voiceChannel: VoiceChannel;
  connection: any;
  songs: Song[];
  volume: number;
  playing: boolean;
}

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

    // Verificação de permissões no canal de voz
    const permissions = userChannel.permissionsFor(interaction.client.user);
    if (!permissions || !permissions.has("CONNECT" as PermissionResolvable)) {
      return interaction.reply({ content: "Não consigo me conectar ao seu canal de voz, verifique se tenho as permissões adequadas!", ephemeral: true });
    }
    if (!permissions.has("SPEAK" as PermissionResolvable)) {
      return interaction.reply({ content: "Não posso falar neste canal de voz, verifique se eu tenho as permissões adequadas!", ephemeral: true });
    }

    let musicLink = interaction.options.getString("play", true);
    console.log("Link da música:", musicLink);

    // Verificação do link (YouTube, Spotify, SoundCloud, ou arquivo de áudio direto)
    const isYouTubeLink = await play.validate(musicLink);
    const isDirectAudio = /\.(mp3|flac|wav|ogg)$/i.test(musicLink);

    // Verificar se o token do Spotify está expirado e atualizá-lo se necessário
    try {
      console.log("Verificando token Spotify antes da expiração...");
      console.log(play.spotifyToken);

      if (play.is_expired()) {
        console.log("Token expirado. Atualizando token...");
        await play.refreshToken();
      }
    } catch (error) {
      console.error("Erro ao verificar/atualizar o token do Spotify:", error);
    }

    // Verificar se é link do Spotify
    const spotifyInfo = await play.spotify(musicLink);
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
      // Conectar ao canal de voz
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

      // Criando a estrutura de fila para a música
      const song: Song = {
        id: musicLink,
        title: musicLink, // No futuro, podemos buscar o título real se necessário
        url: musicLink,
      };

      // Adiciona à fila de músicas
      const serverQueue = queue.get(guild.id) || {
        textChannel: interaction.channel,
        voiceChannel: userChannel,
        connection: connection,
        songs: [song],
        volume: 5,
        playing: true,
      };

      queue.set(guild.id, serverQueue);

      // Inicia a reprodução da música
      if (!serverQueue.playing) {
        playMusic(guild, serverQueue.songs[0], connection);
      }

      await interaction.editReply({ content: `🎶 Tocando agora: ${musicLink}` });

      player.on("error", (error) => {
        console.error("Erro no player:", error.message);
        interaction.followUp({ content: "Ocorreu um erro ao reproduzir a música.", ephemeral: true });
      });

      player.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          serverQueue.songs.shift(); // Remove a música da fila quando terminar
          if (serverQueue.songs.length > 0) {
            playMusic(guild, serverQueue.songs[0], connection);
          } else {
            connection.destroy(); // Desconecta após a música terminar
            queue.delete(guild.id);
          }
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

async function playMusic(guild: Guild, song: Song, connection: any) {
  const serverQueue = queue.get(guild.id);

  try {
    const stream = await play.stream(song.url); 
    const resource = createAudioResource(stream.stream, { inputType: StreamType.Arbitrary });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);
  } catch (error) {
    console.error("Erro ao buscar o stream da música:", error);
  }
}
