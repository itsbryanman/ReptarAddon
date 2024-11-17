const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const manifest = {
  id: "community.Reptar",
  version: "0.1.0",
  name: "Reptar Addon",
  description: "Fetches torrent sources for movies and TV shows.",
  logo: "https://raw.githubusercontent.com/itsbryanman/ReptarAddon/main/reptar-icon.png",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "reptar-top-movies",
      name: "Reptar Movies",
    },
    {
      type: "series",
      id: "reptar-top-series",
      name: "Reptar Series",
    },
  ],
};

const builder = new addonBuilder(manifest);

const API_BASE_URL = "https://yts.mx/api/v2";
const TORRENT_API = `${API_BASE_URL}/list_movies.json`;

async function fetchCatalog(type, extra) {
  try {
    const response = await axios.get(TORRENT_API, {
      params: {
        genre: extra.genre || undefined,
        limit: 20,
        sort_by: "rating",
      },
    });
    const movies = response.data.data.movies || [];
    return movies.map((movie) => ({
      id: `tt${movie.imdb_code}`,
      type: "movie",
      name: movie.title,
      poster: movie.medium_cover_image,
      description: movie.summary,
      year: movie.year,
      runtime: movie.runtime,
      genres: movie.genres,
    }));
  } catch (error) {
    console.error("Error in fetchCatalog:", error.message);
    return [];
  }
}

async function fetchMeta(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/movie_details.json`, {
      params: { imdb_id: id },
    });
    const movie = response.data.data.movie;
    return {
      id: `tt${movie.imdb_code}`,
      type: "movie",
      name: movie.title,
      poster: movie.large_cover_image,
      description: movie.description_full,
      year: movie.year,
      runtime: movie.runtime,
      genres: movie.genres,
      background: movie.background_image_original,
    };
  } catch (error) {
    console.error("Error in fetchMeta:", error.message);
    return null;
  }
}

async function fetchStreams(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/movie_details.json`, {
      params: { imdb_id: id },
    });
    const movie = response.data.data.movie;
    const streams = movie.torrents.map((torrent) => ({
      title: `${torrent.quality} - ${torrent.type}`,
      infoHash: torrent.hash,
      fileIdx: 0,
    }));
    return streams;
  } catch (error) {
    console.error("Error in fetchStreams:", error.message);
    return [];
  }
}

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const metas = await fetchCatalog(type, extra);
  return Promise.resolve({ metas });
});

builder.defineMetaHandler(async ({ type, id }) => {
  const meta = await fetchMeta(id);
  return Promise.resolve({ meta });
});

builder.defineStreamHandler(async ({ type, id }) => {
  const streams = await fetchStreams(id);
  return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
