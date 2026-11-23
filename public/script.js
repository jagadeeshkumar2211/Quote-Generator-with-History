const quoteElement = document.getElementById("quote");
const authorElement = document.getElementById("author");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const copyBtn = document.getElementById("copyBtn");
const favoritesList = document.getElementById("favoritesList");
const favoriteCount = document.getElementById("favoriteCount");
const headerDate = document.getElementById("headerDate");
const toast = document.getElementById("toast");

let currentQuote = "";
let currentAuthor = "";
let favorites = [];
let toastTimer;

const fallbackQuotes = [
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "What we think, we become.", author: "Buddha" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "It always seems impossible until it is done.", author: "Nelson Mandela" },
    { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" }
];

headerDate.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
}).format(new Date());

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setLoading(isLoading) {
    document.querySelector(".quote-panel").classList.toggle("loading", isLoading);
    newQuoteBtn.disabled = isLoading;
}

async function getQuote() {
    setLoading(true);
    try {
        const response = await fetch("/api/quote");
        if (!response.ok) throw new Error("Quote request failed");
        const data = await response.json();
        currentQuote = data.quote;
        currentAuthor = data.author;
    } catch (error) {
        const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        currentQuote = fallback.quote;
        currentAuthor = fallback.author;
    }

    quoteElement.textContent = currentQuote;
    authorElement.textContent = currentAuthor;
    setLoading(false);
    updateFavoriteState();
}

async function addFavorite() {
    if (!currentQuote) {
        showToast("Please wait for a quote");
        return;
    }

    try {
        const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quote: currentQuote, author: currentAuthor })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save favorite");

        await loadFavorites();
        showToast("Added to your favorites");
    } catch (error) {
        showToast(error.message === "This quote is already saved" ? "Already in your favorites" : "Unable to save favorite");
    }
}

async function loadFavorites() {
    try {
        const response = await fetch("/api/favorites");
        if (!response.ok) throw new Error("Failed to load favorites");
        favorites = await response.json();
        renderFavorites();
    } catch (error) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <p>Could not load favorites</p>
                <small>Please try again</small>
            </div>`;
        favoriteCount.textContent = "0";
    }
}

function renderFavorites() {
    favoriteCount.textContent = String(favorites.length);

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                </span>
                <p>No favorites yet</p>
                <small>Save a quote you love</small>
            </div>`;
        updateFavoriteState();
        return;
    }

    favoritesList.innerHTML = "";
    favorites.forEach((favorite) => {
        const item = document.createElement("article");
        item.className = "favorite-item";
        item.innerHTML = `
            <p></p>
            <small></small>
            <button class="delete-btn" type="button" aria-label="Delete favorite" title="Delete">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6M10 10v7M14 10v7"/></svg>
            </button>`;
        item.querySelector("p").textContent = `“${favorite.quote}”`;
        item.querySelector("small").textContent = `— ${favorite.author || "Unknown"}`;
        item.querySelector(".delete-btn").addEventListener("click", () => deleteFavorite(favorite.id));
        favoritesList.appendChild(item);
    });
    updateFavoriteState();
}

async function deleteFavorite(id) {
    try {
        const response = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete");
        await loadFavorites();
        showToast("Favorite removed");
    } catch (error) {
        showToast("Unable to remove favorite");
    }
}

function updateFavoriteState() {
    const isSaved = favorites.some((favorite) => favorite.quote === currentQuote);
    favoriteBtn.classList.toggle("saved", isSaved);
    favoriteBtn.setAttribute("aria-label", isSaved ? "Saved to favorites" : "Save to favorites");
    favoriteBtn.title = isSaved ? "Saved to favorites" : "Save to favorites";
}

async function copyQuote() {
    if (!currentQuote) {
        showToast("Please wait for a quote");
        return;
    }

    const text = `“${currentQuote}” — ${currentAuthor}`;
    try {
        await navigator.clipboard.writeText(text);
        showToast("Quote copied");
    } catch (error) {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
        showToast("Quote copied");
    }
}

newQuoteBtn.addEventListener("click", getQuote);
favoriteBtn.addEventListener("click", addFavorite);
copyBtn.addEventListener("click", copyQuote);

getQuote();
loadFavorites();