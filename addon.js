const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const manifest = {
  id: "community.Reptar",
  version: "0.2.0",
  catalogs: [
    {
      type: "movie",
      id: "reptar-movies",
      name: "Reptar Movies",
    },
    {
      type: "series",
      id: "reptar-series",
      name: "Reptar Series",
    },
  ],
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  name: "Reptar Addon",
  description: "Fetches movie/TV streams from multiple torrent sources.",
  logo: "https://raw.githubusercontent.com/itsbryanman/ReptarAddon/main/reptar.png",
};

const builder = new addonBuilder(manifest);

// API keys and headers
const MILKEE_API_KEY = "FqJUv8FUZOSPukl+qpIgFlgEUmsxBEPx";
const RAPIDAPI_KEY = "3e7922290amshce9e9349536c7dap192255jsn88b012cb67c";

// API endpoints
const YTS_API_URL = "https://yts-am-torrent.p.rapidapi.com/list_movies.json";
const TORRENT_SEARCH_API_URL = "https://torrent-search.p.rapidapi.com/api/search";
const THE_PIRATE_BAY_API_URL = "https://thepiratebay.p.rapidapi.com/top/100";

// Fetch catalog (movies or series)
async function fetchCatalog(type, extra) {
  try {
    const response = await axios.get(YTS_API_URL, {
      params: {
        limit: 20,
        genre: extra?.genre || undefined,
        sort_by: "rating",
      },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    const movies = response.data?.data?.movies || [];
    return movies.map((movie) => ({
      id: `tt${movie.imdb_code}`,
      type: "movie",
      name: movie.title,
      poster: movie.medium_cover_image,
      description: movie.summary,
      year: movie.year,
      genres: movie.genres,
    }));
  } catch (error) {
    console.error("Error in fetchCatalog:", error.message);
    return [];
  }
}

// Fetch metadata for a movie or series
async function fetchMeta(id) {
  try {
    const response = await axios.get(YTS_API_URL, {
      params: { query_term: id },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    const movie = response.data?.data?.movie;
    if (!movie) {
      console.error(`Movie not found for ID: ${id}`);
      return null;
    }

    return {
      id: `tt${movie.imdb_code}`,
      type: "movie",
      name: movie.title,
      poster: movie.large_cover_image,
      description: movie.description_full,
      year: movie.year,
      genres: movie.genres,
      background: movie.background_image_original,
    };
  } catch (error) {
    console.error("Error in fetchMeta:", error.message);
    return null;
  }
}

// Fetch streams for a movie or series
async function fetchStreams(id) {
  try {
    const streams = [];

    // Fetch from Milkee
    const milkeeResponse = await axios.get("https://milkie.cc/api/torrent", {
      params: { id },
      headers: {
        Authorization: MILKEE_API_KEY,
      },
    });

    if (milkeeResponse.data?.torrents) {
      streams.push(
        ...milkeeResponse.data.torrents.map((torrent) => ({
          title: `${torrent.quality} - ${torrent.type}`,
          infoHash: torrent.hash,
          fileIdx: 0,
        }))
      );
    }

    // Fetch from Torrent Search
    const torrentSearchResponse = await axios.get(TORRENT_SEARCH_API_URL, {
      params: { query: id },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (torrentSearchResponse.data?.results) {
      streams.push(
        ...torrentSearchResponse.data.results.map((result) => ({
          title: result.title,
          infoHash: result.hash,
          fileIdx: 0,
        }))
      );
    }

    // Fetch from The Pirate Bay
    const pirateBayResponse = await axios.get(THE_PIRATE_BAY_API_URL, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (pirateBayResponse.data?.torrents) {
      streams.push(
        ...pirateBayResponse.data.torrents.map((torrent) => ({
          title: torrent.title,
          infoHash: torrent.hash,
          fileIdx: 0,
        }))
      );
    }

    return streams;
  } catch (error) {
    console.error("Error in fetchStreams:", error.message);
    return [];
  }
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

module.exports = builder.getInterface();

