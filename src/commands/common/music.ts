import { CommandType } from "../../structs/types/Command";
import { VoiceChannel, GuildMember } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  VoiceConnection,
} from "@discordjs/voice";
import { spawn } from "child_process";
import { google } from "googleapis";
import { CommandInteractionOptionResolver } from "discord.js";

// Configuração da API do YouTube
const youtube = google.youtube("v3");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Função para buscar vídeos no YouTube
async function searchVideo(query: string): Promise<string | null> {
  try {
    console.log("🔍 Iniciando busca no YouTube...");
    const response = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults: 1,
      key: YOUTUBE_API_KEY,
    });

    const items = response.data?.items;
    if (!items || items.length === 0) {
      console.log("❌ Nenhum vídeo encontrado para a pesquisa:", query);
      return null;
    }

    console.log("🎥 Vídeo encontrado:", items[0].snippet?.title);
    return `https://www.youtube.com/watch?v=${items[0].id?.videoId}`;
  } catch (error) {
    console.error("Erro ao buscar vídeo no YouTube:", error);
    return null;
  }
}

// Função para tocar música
async function playMusic(url: string, voiceChannel: VoiceChannel) {
  let connection: VoiceConnection | null = null;
  let isConnectionDestroyed = false;

  try {
    console.log("🎵 Preparando para tocar música... URL:", url);

    // Verifica se o `yt-dlp` está instalado
    console.log("🔍 Verificando yt-dlp...");
    const checkYtDl = spawn("yt-dlp", ["--version"]);
    checkYtDl.on("error", () => {
      throw new Error("yt-dlp não está instalado ou não foi encontrado no sistema.");
    });

    // Conecta ao canal de voz
    console.log("🔗 Conectando ao canal de voz...");
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // Cria o processo do yt-dlp para obter o stream de áudio
    console.log("🎧 Obtendo stream de áudio...");
    const process = spawn("yt-dlp", [
      "-f",
      "bestaudio",
      "--no-playlist",
      "-o",
      "-",
      url,
    ]);

    process.stderr.on("data", (data) => {
      console.error(`yt-dlp erro: ${data}`);
    });

    const resource = createAudioResource(process.stdout, {
      inputType: StreamType.Arbitrary,
    });

    const player = createAudioPlayer();
    console.log("▶️ Player criado. Iniciando reprodução...");
    player.play(resource);
    connection.subscribe(player);

    // Eventos do player
    player.on(AudioPlayerStatus.Idle, () => {
      console.log("⏹ Música finalizada. Desconectando...");
      if (connection && !isConnectionDestroyed) {
        connection.destroy();
        isConnectionDestroyed = true;
      }
    });

    player.on("error", (error) => {
      console.error("Erro no player:", error);
      if (connection && !isConnectionDestroyed) {
        connection.destroy();
        isConnectionDestroyed = true;
      }
    });

    console.log(`🎶 Tocando: ${url}`);
  } catch (error) {
    console.error("Erro ao tocar música:", error);
    if (connection && !isConnectionDestroyed) {
      connection.destroy();
    }
    throw new Error("Não foi possível tocar a música.");
  }
}

// Comando music
const command: CommandType = {
  name: "music",
  description: "Tocar música por nome ou link do YouTube.",
  options: [
    {
      name: "query",
      description: "Nome da música ou URL do YouTube",
      type: 3, // Tipo STRING
      required: true,
    },
  ],
  run: async ({ interaction }) => {
    console.log("📥 Comando 'music' recebido.");
    const query = (interaction.options as CommandInteractionOptionResolver).getString("query", true);

    const member = interaction.member;
    if (!(member instanceof GuildMember) || !member.voice.channel) {
      console.log("❌ Usuário não está em um canal de voz.");
      return interaction.reply({
        content: "Você precisa estar em um canal de voz para usar este comando!",
        ephemeral: true,
      });
    }

    console.log("🎤 Usuário em canal de voz:", member.voice.channel.name);
    await interaction.deferReply();

    try {
      let url = query;

      // Se o query não for um link válido, faça uma busca no YouTube
      if (!url.startsWith("https://www.youtube.com/watch")) {
        console.log("🔎 Query não é um link válido. Buscando no YouTube...");
        interaction.editReply("🔎 Buscando a música no YouTube...");
        url = (await searchVideo(query)) || "";
        if (!url) {
          console.log("❌ Nenhum vídeo encontrado para a pesquisa:", query);
          return interaction.editReply("❌ Nenhum vídeo encontrado para essa pesquisa.");
        }
      }

      // Tocar a música
      console.log("🎶 Iniciando reprodução...");
      await playMusic(url, member.voice.channel as VoiceChannel);
      await interaction.editReply(`🎶 Tocando música: ${url}`);
    } catch (error: any) {
      console.error("Erro no comando 'music':", error);
      await interaction.editReply(error.message || "Erro ao tocar música.");
    }
  },
};

export default command;
