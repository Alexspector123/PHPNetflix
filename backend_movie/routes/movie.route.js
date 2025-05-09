import express from "express";
import {
	getTrendingMovies,
	getMovieDetails,
	getMovieTrailers,
	getSimilarMovies,
	getMoviesByCategory,
	getTVCredits,
} from "../controllers/movie.controller.js";

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.get("/:id/details", getMovieDetails);
router.get("/:id/trailers", getMovieTrailers);
router.get("/:id/similar", getSimilarMovies);
router.get("/:category", getMoviesByCategory);
router.get("/:id/credits", getTVCredits);

export default router;
