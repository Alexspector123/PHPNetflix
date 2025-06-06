import { fetchFromTMDB } from "../services/tmdb.service.js";
import { db } from "../config/db.js";

const cache = new Map();
const TTL = 300000;

const getCached = (k) => {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) {
    cache.delete(k);
    return null;
  }
  return e.data;
};
const setCached = (k, v) => cache.set(k, { data: v, ts: Date.now() });

export async function searchPerson(req, res) {
  const query = (req.params.query || req.query.query || '').trim();
  const department = (req.query.department || '').toLowerCase();

  if (!query) return res.status(400).json({ success: false, message: 'query required' });

  const cacheKey = `${query.toLowerCase()}_${department}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ success: true, content: cached });

  try {
    const { results = [] } = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(
        query
      )}&include_adult=false&language=en-US&page=1`
    );

    if (!results.length) return res.status(404).send(null);

    const filtered = department
      ? results.filter(
          (p) =>
            p.known_for_department &&
            p.known_for_department.toLowerCase().includes(department)
        )
      : results;

    setCached(cacheKey, filtered);
    res.json({ success: true, content: filtered });

    if (req.user && filtered.length) {
      const query = `
        UPDATE Users
        SET searchHistory = JSON_ARRAY_APPEND(
          searchHistory, '$', CAST(? AS JSON)
        )
        WHERE userId = ?;
      `;
      const values = [
        JSON.stringify({
          id: filtered[0].id,
          image: filtered[0].profile_path,
          title: filtered[0].name,
          searchType: 'person',
          createdAt: new Date()
        }),
        req.user.userId
      ];

      try {
        await db.query(query, values);
      } catch (error) {
        console.error('Failed to update search history:', error.message);
      }
    }
  } catch (err) {
    console.error('searchPerson:', err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

export async function searchMovie(req, res) {
  const { query, genre } = req.query;
  try {
    const url = genre
      ? `https://api.themoviedb.org/3/discover/movie?with_genres=${genre}&include_adult=false&language=en-US&page=1`
      : `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

    const response = await fetchFromTMDB(url);
    if (response.results.length === 0) {
      return res.status(404).send(null);
    }

    if (query) {
      const query = `
        UPDATE Users
        SET searchHistory = JSON_ARRAY_APPEND(
          searchHistory, '$', CAST(? AS JSON)
        )
        WHERE userId = ?;
      `;
      const values = [
        JSON.stringify({
          id: response.results[0].id,
          image: response.results[0].poster_path,
          title: response.results[0].title,
          searchType: 'movie',
          createdAt: new Date()
        }),
        req.user.userId
      ];

      try {
        await db.query(query, values);
      } catch (error) {
        console.error('Failed to update search history:', error.message);
      }
    }

    res.status(200).json({ success: true, content: response.results });
  } catch (error) {
    console.log("Error in search movie controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function searchTv(req, res) {
  const { query, genre } = req.query;
  try {
    const url = genre
      ? `https://api.themoviedb.org/3/discover/tv?with_genres=${genre}&include_adult=false&language=en-US&page=1`
      : `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

    const response = await fetchFromTMDB(url);
    if (response.results.length === 0) {
      return res.status(404).send(null);
    }

    if (query) {
      const query = `
        UPDATE Users
        SET searchHistory = JSON_ARRAY_APPEND(
          searchHistory, '$', CAST(? AS JSON)
        )
        WHERE userId = ?;
      `;
      const values = [
        JSON.stringify({
          id: response.results[0].id,
          image: response.results[0].poster_path,
          title: response.results[0].name,
          searchType: 'tv',
          createdAt: new Date()
        }),
        req.user.userId
      ];

      try {
        await db.query(query, values);
      } catch (error) {
        console.error('Failed to update search history:', error.message);
      }
    }

    res.status(200).json({ success: true, content: response.results });
  } catch (error) {
    console.log("Error in search tv controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getSearchHistory(req, res) {
  try {
    console.log("req.user", req.user);
    res.status(200).json({ success: true, content: req.user.searchHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function removeItemFromSearchHistory(req, res) {
  let { id } = req.params;
  id = parseInt(id);

  try {
    const query = `
      UPDATE Users
      SET searchHistory = JSON_REMOVE(
        searchHistory, JSON_UNQUOTE(JSON_SEARCH(searchHistory, 'one', ?))
      )
      WHERE userId = ?;
    `;
    const values = [id, req.user.userId];

    await db.query(query, values);
    res.status(200).json({ success: true, message: "Item removed from search history" });
  } catch (error) {
    console.log("Error in remove item from search history controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export const clearSearchHistory = async (req, res) => {
  try {
    const query = `
      UPDATE Users
      SET searchHistory = '[]'
      WHERE userId = ?;
    `;
    const values = [req.user.userId];

    await db.query(query, values);
    res.status(200).json({ success: true, message: "All search history cleared" });
  } catch (err) {
    console.error("Error clearing history:", err);
    res.status(500).json({ success: false, error: "Failed to clear history" });
  }
};

export async function getFavouritesHistory(req, res) {
  try {
    const { searchType } = req.query;
    let favourites = req.user.favourites || [];

    if (searchType === "movie" || searchType === "tv") {
      favourites = favourites.filter(item => item.searchType === searchType);
    }

    res.status(200).json({ success: true, content: favourites });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function removeItemFromFavouritesHistory(req, res) {
  let { id } = req.params;
  id = parseInt(id);

  try {
    const query = `
      UPDATE Users
      SET favourites = JSON_REMOVE(
        favourites, JSON_UNQUOTE(JSON_SEARCH(favourites, 'one', ?))
      )
      WHERE userId = ?;
    `;
    const values = [id, req.user.userId];

    await db.query(query, values);
    res.status(200).json({ success: true, message: "Item removed from favourite history" });
  } catch (error) {
    console.log("Error in remove item from favourite history controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function addToFavourites(req, res) {
  const { id, image, title, type } = req.body;

  if (!id || !title || !type) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const [rows] = await db.query(
      `SELECT favourites FROM Users WHERE userId = ?`,
      [req.user.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const rawFavourites = rows[0].favourites;
    let favourites = [];

    if (rawFavourites && typeof rawFavourites === 'string' && rawFavourites.trim() !== '') {
      try {
        favourites = JSON.parse(rawFavourites);
      } catch (err) {
        console.error("JSON parse error:", err.message);
        favourites = [];
      }
    }

    const exists = favourites.some((item) => item.id === id);
    if (exists) {
      return res.status(200).json({ success: true, message: "Already in favourites" });
    }

    const newItem = {
      id,
      image,
      title,
      searchType: type,
      createdAt: new Date(),
    };

    const updateQuery = `
      UPDATE Users
      SET favourites = JSON_ARRAY_APPEND(favourites, '$', CAST(? AS JSON))
      WHERE userId = ?;
    `;

    const values = [JSON.stringify(newItem), req.user.userId];

    await db.query(updateQuery, values);
    res.status(200).json({ success: true, message: "Added to favourites" });
  } catch (error) {
    console.error("Error in addToFavourites controller:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}



export const clearFavouriteHistory = async (req, res) => {
  try {
    const query = `
      UPDATE Users
      SET favourites = '[]'
      WHERE userId = ?;
    `;
    const values = [req.user.userId];

    await db.query(query, values);
    res.status(200).json({ success: true, message: "All favourite history cleared" });
  } catch (err) {
    console.error("Error clearing history:", err);
    res.status(500).json({ success: false, error: "Failed to clear history" });
  }
};