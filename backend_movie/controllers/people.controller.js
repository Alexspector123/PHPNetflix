import { fetchFromTMDB } from "../services/tmdb.service.js";

export async function getTrendingPeoples(req, res) {
    try {
        const data = await fetchFromTMDB(
            "https://api.themoviedb.org/3/trending/person/day?language=en-US"
        );
        // Trả luôn data.results, không lấy random
        res.json({ success: true, content: data.results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPopularPeoples(req, res) {
    try {
        const data = await fetchFromTMDB('https://api.themoviedb.org/3/person/popular?language=en-US&page=1');

        res.json({ success: true, content: data.results });

    } catch (error) {
        if (error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPeopleDetails(req, res) {
    const { people_id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/person/${people_id}?language=en-US`);

        res.status(200).json({ success: true, content: data });

    } catch (error) {
        if (error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPeopleCredits(req, res) {
    const { people_id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/person/${people_id}/combined_credits?language=en-US`);

        // Process and organize credits
        const processed = {
            cast: data.cast || [],
            crew: data.crew || []
        };

        // Add release dates for sorting
        processed.cast = processed.cast.map(item => {
            const date = item.release_date || item.first_air_date || '';
            return { ...item, release_sort: date ? new Date(date).getTime() : 0 };
        });

        processed.crew = processed.crew.map(item => {
            const date = item.release_date || item.first_air_date || '';
            return { ...item, release_sort: date ? new Date(date).getTime() : 0 };
        });

        // Sort by release date (newest first)
        processed.cast.sort((a, b) => b.release_sort - a.release_sort);
        processed.crew.sort((a, b) => b.release_sort - a.release_sort);

        res.status(200).json({ success: true, content: processed });
    } catch (error) {
        if (error.message.includes("404")) {
            return res.status(404).json({ success: false, message: "Person not found" });
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPeopleSocial(req, res) {
    const { people_id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/person/${people_id}/external_ids`);
        res.status(200).json({ success: true, content: data });
    } catch (error) {
        if (error.message.includes("404")) {
            return res.status(404).json({ success: false, message: "Person not found" });
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getFeaturedPerson(req, res) {
    try {
        const data = await fetchFromTMDB("https://api.themoviedb.org/3/trending/person/week?language=en-US");
        const featuredPerson = data.results[Math.floor(Math.random() * data.results.length)];
        res.json(featuredPerson);
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPopularActors(req, res) {
    try {
        const data = await fetchFromTMDB("https://api.themoviedb.org/3/person/popular?language=en-US&page=1");
        const actors = data.results.filter(person => person.known_for_department === "Acting");
        res.json({ success: true, content: actors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getPopularDirectors(req, res) {
    try {
        const data = await fetchFromTMDB("https://api.themoviedb.org/3/person/popular?language=en-US&page=1");
        const directors = data.results.filter(person => person.known_for_department === "Directing");
        res.json({ success: true, content: directors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function getAwardWinners(req, res) {
    try {
      const data = await fetchFromTMDB("https://api.themoviedb.org/3/person/popular?language=en-US&page=1");
      
      if (!data.results || data.results.length === 0) {
        return res.status(404).json({ success: false, message: "No award winners found" });
      }
  
      const awardWinners = data.results.slice(0, 10); 
      res.status(200).json({ success: true, content: awardWinners });
    } catch (error) {
      console.error("Error fetching award winners:", error.message);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
  