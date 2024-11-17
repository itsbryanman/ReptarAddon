const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const manifest = {
  id: "community.Reptar",
  version: "0.2.0",
  name: "Reptar Movies and Series",
  description: "Find popular movies and TV shows using Reptar with streams!",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "reptar-movie-catalog", name: "Reptar Movies" },
    { type: "series", id: "reptar-series-catalog", name: "Reptar Series" },
  ],
  idPrefixes: ["tt"], // IMDb ID prefix
  logo: "reptar.png",
};

const builder = new addonBuilder(manifest);

// TMDb API Configuration
const TMDB_API_KEY = "1db1e7057b49dd2e81d9e188bd2edb54"; // Your API key
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Fetch catalog (popular movies/series)
async function fetchCatalog(type) {
  const url = `${TMDB_BASE_URL}/${type === "movie" ? "movie/popular" : "tv/popular"}`;
  try {
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    const results = response.data.results.map((item) => ({
      id: `tt${item.id}`, // Use "tt" prefix for compatibility
      type,
      name: item.title || item.name,
      poster: `${TMDB_IMAGE_URL}${item.poster_path}`,
      description: item.overview,
      year: (item.release_date || item.first_air_date || "").split("-")[0],
    }));
    return results;
  } catch (err) {
    console.error("Error fetching catalog:", err.message);
    return [];
  }
}

// Fetch metadata for a specific movie/series
async function fetchMeta(id, type) {
  const url = `${TMDB_BASE_URL}/${type === "movie" ? "movie" : "tv"}/${id.replace("tt", "")}`;
  try {
    const response = await axios.get(url, {
      params: { api_key: TMDB_API_KEY },
    });
    const data = response.data;
    return {
      id: `tt${data.id}`,
      type,
      name: data.title || data.name,
      poster: `${TMDB_IMAGE_URL}${data.poster_path}`,
      background: `${TMDB_IMAGE_URL}${data.backdrop_path}`,
      description: data.overview,
      runtime: data.runtime || data.episode_run_time?.[0] || 0,
      genres: data.genres.map((g) => g.name),
      year: (data.release_date || data.first_air_date || "").split("-")[0],
    };
  } catch (err) {
    console.error("Error fetching metadata:", err.message);
    return null;
  }
}

// Example stream handler (replace with actual torrent scraping)
async function fetchStreams(id) {
  try {
    // Placeholder streams - Replace with actual torrent integration
    return [
      {
        title: "1080p - Example Stream",
        url: "https://example.com/video.mp4",
      },
      {
        title: "720p - Example Stream",
        url: "https://example.com/video720p.mp4",
      },
    ];
  } catch (err) {
    console.error("Error fetching streams:", err.message);
    return [];
  }
}

// Define catalog handler
builder.defineCatalogHandler(async ({ type }) => {
  const metas = await fetchCatalog(type);
  return { metas };
});

// Define metadata handler
builder.defineMetaHandler(async ({ type, id }) => {
  const meta = await fetchMeta(id, type);
  return { meta };
});

// Define stream handler
builder.defineStreamHandler(async ({ id }) => {
  const streams = await fetchStreams(id);
  return { streams };
});

module.exports = builder.getInterface();
