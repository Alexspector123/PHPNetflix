// src/pages/SearchPage.jsx
import { useState, useEffect, useRef } from "react";
import { useContentStore } from "../store/content";
import Navbar from "../components/Navbar";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { ORIGINAL_IMG_BASE_URL } from "../utils/constants.js";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const GENRES = {
  movie: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 18, name: "Drama" },
    { id: 14, name: "Fantasy" },
    { id: 27, name: "Horror" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" }
  ],
  tv: [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 9648, name: "Mystery" },
    { id: 10768, name: "War & Politics" }
  ],
  person: []
};

const DEPARTMENTS = [
  { id: "acting", label: "Actors" },
  { id: "directing", label: "Directors" },
  { id: "writing", label: "Writers" }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialGenre = searchParams.get("genre") || "";
  const initialDepartment = searchParams.get("department") || "";
  const initialTab = searchParams.get("type") || "movie";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);

  const { setContentType } = useContentStore();
  const debounceRef = useRef(null);

  const updateSearchParams = (type, query, genre, department) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (query) params.set("query", query);
    if (genre) params.set("genre", genre);
    if (department) params.set("department", department);
    setSearchParams(params);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setContentType(tab);
    setSearchTerm("");
    setResults([]);
    setSelectedGenre("");
    setSelectedDepartment("");
    updateSearchParams(tab, "", "", "");
  };

  const handleGenreSelect = (genreId) => {
    const newGenre = selectedGenre === genreId ? "" : genreId;
    setSelectedGenre(newGenre);
    updateSearchParams(activeTab, searchTerm, newGenre, selectedDepartment);
    performSearch(searchTerm, activeTab, newGenre, selectedDepartment);
  };

  const handleDepartmentSelect = (dept) => {
    const newDept = selectedDepartment === dept ? "" : dept;
    setSelectedDepartment(newDept);
    updateSearchParams(activeTab, searchTerm, selectedGenre, newDept);
    performSearch(searchTerm, activeTab, selectedGenre, newDept);
  };

  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedDepartment("");
    updateSearchParams(activeTab, searchTerm, "", "");
    performSearch(searchTerm, activeTab, "", "");
  };

  const performSearch = async (query, contentType, genre, department) => {
    if (!query.trim() && !genre && !department) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const params = {};
      if (genre) params.genre = genre;
      if (department) params.department = department;
      if (query.trim()) params.query = query.trim();
      const res = await axios.get(`/api/v1/search/${contentType}`, { params });
      setResults(res.data.content || []);
    } catch {
      setResults([]);
      toast.error("No results found. Try different filters.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSearchParams(activeTab, searchTerm, selectedGenre, selectedDepartment);
      performSearch(searchTerm, activeTab, selectedGenre, selectedDepartment);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, activeTab, selectedGenre, selectedDepartment]);

  useEffect(() => {
    if (initialQuery || initialGenre || initialDepartment) {
      performSearch(initialQuery, initialTab, initialGenre, initialDepartment);
    }
  }, []);

  const placeholderImage = "/images/movie-placeholder.png";

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center gap-3 mb-8">
          {["movie", "tv", "person"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`py-2 px-6 rounded-full text-lg transition-all duration-200 ${activeTab === tab
                  ? "bg-red-600 shadow-lg shadow-red-900/30"
                  : "bg-gray-800 hover:bg-gray-700"
                }`}
            >
              {tab === "movie"
                ? "Movies"
                : tab === "tv"
                  ? "TV Shows"
                  : "People"}
            </button>
          ))}
        </div>
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex bg-gray-800 rounded-lg overflow-hidden shadow-lg focus-within:ring-2 focus-within:ring-red-500">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search for ${activeTab === "person"
                    ? "actors, directors..."
                    : activeTab === "movie"
                      ? "movies..."
                      : "TV shows..."
                  }`}
                className="flex-1 p-3 bg-transparent text-white focus:outline-none text-lg"
              />
              <button
                onClick={() => setSearchTerm(searchTerm.trim())}
                className="px-4 text-gray-400 hover:text-white transition-colors"
              >
                <SearchIcon size={22} />
              </button>
            </div>
            {((activeTab !== "person" && !showFilters) || (activeTab === "person" && !showFilters)) && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-lg transition-colors ${showFilters || selectedGenre
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-800 hover:bg-gray-700"
                  }`}
              >
                <Filter size={22} />
              </button>
            )}
          </div>
          {showFilters && (
            <div className="bg-gray-800 p-4 rounded-lg mb-4 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">{activeTab === "person" ? "Departments" : "Genres"}</h3>
                {(selectedGenre || selectedDepartment) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm flex items-center gap-1 text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                    Clear filters
                  </button>
                )}
              </div>
              {activeTab !== "person" ? (
                <div className="flex flex-wrap gap-2">
                  {GENRES[activeTab].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleGenreSelect(g.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${selectedGenre == g.id
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-gray-700 hover:bg-gray-600"
                        }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleDepartmentSelect(d.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${selectedDepartment === d.id
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">
            {results.length > 0
              ? `Found ${results.length} result${results.length === 1 ? "" : "s"}`
              : isLoading
                ? "Searching..."
                : searchTerm || selectedGenre || selectedDepartment
                  ? "No results found"
                  : "Start searching to see results"}
          </h2>
          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-10 h-10 border-4 border-red-600 rounded-full border-t-transparent" />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {results.map((item) => {
              const imgPath = item.poster_path || item.profile_path;
              const title = item.title || item.name;
              const year = item.release_date
                ? new Date(item.release_date).getFullYear()
                : item.first_air_date
                  ? new Date(item.first_air_date).getFullYear()
                  : null;
              const to =
                activeTab === "movie" || activeTab === "tv"
                  ? `/watch/${item.id}`
                  : `/people/${item.id}`;
              return (
                <Link
                  key={item.id}
                  to={to}
                  onClick={() => setContentType(activeTab)}
                  className="block bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <div className="aspect-[2/3] bg-gray-700 relative">
                    <img
                      src={imgPath ? ORIGINAL_IMG_BASE_URL + imgPath : placeholderImage}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage;
                      }}
                    />
                    {activeTab !== "person" && item.vote_average > 0 && (
                      <div className="absolute top-2 right-2 bg-black/70 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color: getRatingColor(item.vote_average) }}>
                          {item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="text-lg font-semibold line-clamp-1">{title}</h2>
                    {year && <p className="text-sm text-gray-400">{year}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getRatingColor(rating) {
  if (rating >= 7.5) return "#4CAF50";
  if (rating >= 6) return "#FFC107";
  return "#F44336";
}

export const globalCSS = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;
