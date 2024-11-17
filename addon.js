const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

// Manifest configuration
const manifest = {
  id: "community.Reptar",
  version: "0.1.0",
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
  resources: ["catalog", "meta", "stream", "subtitles"], // Include subtitles if you need them
  types: ["movie", "series"],
  name: "Reptar",
  description:
    "Reptar fetches torrent sources and provides them as streaming options, enabling direct playback through Stremio.",
  logo: "http://65.109.147.17:60761/reptar.png",
};

const builder = new addonBuilder(manifest);

// Example API configuration
const API_BASE_URL = "https://yts.mx/api/v2";
const TORRENT_API = `${API_BASE_URL}/list_movies.json`;

// Fetch movies for the catalog
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
    return []; // Return an empty array if something goes wrong
  }
}

// Fetch metadata for a specific item
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
    return null; // Return null if something goes wrong
  }
}

// Fetch streams for a specific item
async function fetchStreams(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/movie_details.json`, {
      params: { imdb_id: id },
    });
    const movie = response.data.data.movie;
    const streams = movie.torrents.map((torrent) => ({
      title: `${torrent.quality} - ${torrent.type}`,
      infoHash: torrent.hash,
      fileIdx: 0, // Adjust if necessary for specific files
    }));
    return streams;
  } catch (error) {
    console.error("Error in fetchStreams:", error.message);
    return []; // Return an empty array if something goes wrong
  }
}

// Fetch subtitles (optional)
async function fetchSubtitles(id) {
  console.log(`Subtitles request for ${id}`);
  // Example logic for subtitles: Replace with a real subtitle API integration
  return [
    {
      lang: "en",
      url: "https://example.com/subtitles/movie.en.srt",
      id: `${id}-en`,
    },
    {
      lang: "es",
      url: "https://example.com/subtitles/movie.es.srt",
      id: `${id}-es`,
    },
  ];
}

// Define catalog handler
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  console.log(`Catalog request for ${type} with ID ${id}`);
  const metas = await fetchCatalog(type, extra);
  return Promise.resolve({ metas });
});

// Define meta handler
builder.defineMetaHandler(async ({ type, id }) => {
  console.log(`Meta request for ${type} with ID ${id}`);
  const meta = await fetchMeta(id);
  return Promise.resolve({ meta });
});

// Define stream handler
builder.defineStreamHandler(async ({ type, id }) => {
  console.log(`Stream request for ${type} with ID ${id}`);
  const streams = await fetchStreams(id);
  return Promise.resolve({ streams });
});

// Define subtitles handler
builder.defineSubtitlesHandler(async ({ type, id }) => {
  console.log(`Subtitles request for ${type} with ID ${id}`);
  const subtitles = await fetchSubtitles(id);
  return Promise.resolve({ subtitles });
});

module.exports = builder.getInterface();
