import { fetchFromTMDB } from "../services/tmdb.service.js";

export async function getTrendingTVs(req, res) {
    try {
        const data = await fetchFromTMDB("https://api.themoviedb.org/3/trending/tv/day?language=en-US");
        const randomTV = data.results[Math.floor(Math.random() * data.results?.length)];

        res.json({success: true, content: randomTV});
    } catch (error) {
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

export async function getTVTrailers(req, res) {
    const { id } = req.params; 
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}/videos?language=en-US`);

        res.json({success: true, trailers: data.results});
        
    } catch (error) {
        if(error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

export async function getTVDetails(req, res) {
    const { id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}?language=en-US`);

        res.status(200).json({success: true, content: data});

    } catch (error) {
        if(error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

export async function getSimilarTVs(req, res) {
    const { id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}/similar?language=en-US&page=1`);

        res.status(200).json({success: true, similar: data.results});

    } catch (error) {
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

export async function getTVsByCategory(req, res) {
    const { category } = req.params;
    try {
        const data = await fetchFromTMDB(
          `https://api.themoviedb.org/3/tv/${category}?language=en-US&page=1`
        );
        res.status(200).json({ success: true, content: data.results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}