// DEMO_KEY is provided by NASA for public examples and avoids shipping an
// expired personal key in this static site.
const API_KEY = "DEMO_KEY";
const BASE_URL = "https://api.nasa.gov";
const MARS_WEATHER_URL = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json";
// NASA's APOD record for 2026-10-07 currently contains the NASA logo instead
// of the Pa 30 image. Keep a verified NASA Science asset for that bad record.
const APOD_IMAGE_FALLBACKS = {
  "2026-10-07": {
    title: "Supernova Remnant Pa 30",
    url: "https://assets.science.nasa.gov/content/dam/science/cds/apod/apod/2026/october/noirlab2624a.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  }
};
const fetchWithTimeout = (url, timeout = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
};

const padDate = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;
};

// --- APOD ---
const renderAPOD = (data) => {
  const imageContainer = document.getElementById("imageContainer");
  const copyright = document.getElementById("copyright");
  const loader = document.getElementById("apodLoader");
  const fallback = APOD_IMAGE_FALLBACKS[data.date];
  const imageURL = fallback?.url || data.hdurl || data.url;
  const title = fallback?.title || data.title;

  if (loader) loader.remove();

  if (data.media_type === "video") {
    const isDirectVideo = /\.(mp4|webm|ogg)(?:\?|$)/i.test(data.url);
    imageContainer.innerHTML = isDirectVideo
      ? `<video src="${data.url}" id="videoOfDay" title="${data.title}" controls autoplay muted loop playsinline preload="auto"></video>`
      : `<iframe src="${data.url}" frameborder="0" allowfullscreen id="videoOfDay" title="${data.title}"></iframe>`;
  } else {
    // APOD's `url` can be a resized preview. Prefer `hdurl` so the wide
    // feature panel does not enlarge a small image and make it look blurry.
    imageContainer.innerHTML = `<img src="${imageURL}" id="imageOfDay" alt="${title}" loading="eager" decoding="async">`;
  }

  const credit = data.copyright
    ? `<span class="credit">© ${data.copyright.trim()}</span>`
    : "";

  copyright.innerHTML = `
    <h2 id="authorName">${title}</h2>
    ${credit}
    <p id="date">${data.date}</p>
    <p id="textOfDay">${data.explanation}</p>
  `;
};

const getAPOD = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/planetary/apod?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    try { localStorage.setItem("nasa-apod", JSON.stringify(data)); } catch (cacheErr) {
      console.warn("APOD cache unavailable:", cacheErr);
    }
    renderAPOD(data);
  } catch (err) {
    // Keep the page useful when NASA's shared DEMO_KEY quota is temporarily
    // unavailable. The cache is populated after any successful request.
    try {
      const cached = JSON.parse(localStorage.getItem("nasa-apod"));
      if (cached?.url && cached?.title) {
        renderAPOD(cached);
        return;
      }
    } catch (cacheErr) {
      console.error("APOD cache error:", cacheErr);
    }
    const loader = document.getElementById("apodLoader");
    if (loader) {
      loader.classList.remove("loader");
      loader.textContent = "Could not load the Astronomy Picture of the Day.";
    }
    console.error("APOD error:", err);
  }
};

// --- NEO ---
let neoLoaded = false;

const getNEO = async () => {
  if (neoLoaded) return;

  const loader = document.getElementById("neoLoader");
  const divNEO = document.getElementById("neo");
  const countEl = document.getElementById("neoCount");

  try {
    const date = todayISO();
    const res = await fetch(
      `${BASE_URL}/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${API_KEY}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (loader) loader.remove();
    neoLoaded = true;

    const allNeos = Object.values(data.near_earth_objects).flat();

    countEl.textContent = `${allNeos.length} asteroid${allNeos.length !== 1 ? "s" : ""} detected near Earth today`;

    if (allNeos.length === 0) {
      divNEO.innerHTML = "<p>No asteroids detected today.</p>";
      return;
    }

    divNEO.innerHTML = allNeos.map((neo) => {
      const dia = neo.estimated_diameter.kilometers;
      const diaMin = dia.estimated_diameter_min.toFixed(2);
      const diaMax = dia.estimated_diameter_max.toFixed(2);
      const approach = neo.close_approach_data[0];
      const velocity = parseFloat(approach.relative_velocity.kilometers_per_hour)
        .toLocaleString("en-US", { maximumFractionDigits: 0 });
      const distance = parseFloat(approach.miss_distance.kilometers)
        .toLocaleString("en-US", { maximumFractionDigits: 0 });
      const hazardous = neo.is_potentially_hazardous_asteroid;

      return `
        <div class="neo-card${hazardous ? " hazardous" : ""}">
          <div class="neo-header">
            <span class="neo-name">${neo.name.replace(/[()]/g, "")}</span>
            ${hazardous ? '<span class="hazard-badge">&#9888; Potentially Hazardous</span>' : ""}
          </div>
          <div class="neo-details">
            <div class="neo-stat">
              <span class="neo-label">Diameter</span>
              <span class="neo-value">${diaMin} – ${diaMax} km</span>
            </div>
            <div class="neo-stat">
              <span class="neo-label">Velocity</span>
              <span class="neo-value">${velocity} km/h</span>
            </div>
            <div class="neo-stat">
              <span class="neo-label">Miss Distance</span>
              <span class="neo-value">${distance} km</span>
            </div>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    if (loader) loader.remove();
    divNEO.innerHTML = "<p>Failed to load asteroid data. Please try again later.</p>";
    console.error("NEO error:", err);
  }
};

// --- Mars Weather ---
const getMarsWeather = async () => {
  const container = document.getElementById("marsWeather");
  const loader = document.getElementById("marsLoader");

  try {
    const res = await fetchWithTimeout(MARS_WEATHER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const observations = data.soles?.slice(0, 7) || [];
    if (!observations.length) throw new Error("No weather observations returned");

    const latest = observations[0];
    const formatTemp = (value) => value === "--" || value == null ? "N/A" : `${value}°C`;
    const formatDate = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
    });

    container.innerHTML = `
      <div class="mars-current">
        <p class="mars-location">Latest weather at Gale Crater</p>
        <div class="mars-date">Sol ${latest.sol} · ${formatDate(latest.terrestrial_date)}</div>
        <div class="mars-temperatures">
          <div><span>High</span><strong>${formatTemp(latest.max_temp)}</strong></div>
          <div><span>Low</span><strong>${formatTemp(latest.min_temp)}</strong></div>
        </div>
        <div class="mars-details">
          <span>Pressure <strong>${latest.pressure === "--" ? "N/A" : `${latest.pressure} Pa`}</strong></span>
          <span>Conditions <strong>${latest.atmo_opacity === "--" ? "N/A" : latest.atmo_opacity}</strong></span>
        </div>
      </div>
      <h3 class="mars-history-title">Recent observations</h3>
      <div class="mars-history">
        ${observations.map((observation) => `
          <div class="mars-observation">
            <span>Sol ${observation.sol}</span>
            <span>${formatDate(observation.terrestrial_date)}</span>
            <span>${formatTemp(observation.min_temp)} – ${formatTemp(observation.max_temp)}</span>
          </div>`).join("")}
      </div>`;
  } catch (err) {
    if (loader) loader.remove();
    container.innerHTML = `<p class="mars-error">Could not load Mars weather right now. Please use the NASA link below.</p>`;
    console.error("Mars weather error:", err);
  }
};

// --- Modals ---
const openModal = (id) => {
  document.getElementById(id).classList.add("active");
  document.getElementById("container").classList.add("blurred");
  document.body.style.overflow = "hidden";
};

const closeModal = (id) => {
  document.getElementById(id).classList.remove("active");
  document.getElementById("container").classList.remove("blurred");
  document.body.style.overflow = "";
};

document.getElementById("marsArticle").addEventListener("click", () => {
  openModal("marsModal");
  getMarsWeather();
});
document.getElementById("marsArticle").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    openModal("marsModal");
    getMarsWeather();
  }
});
document.getElementById("marsClose").addEventListener("click", () => closeModal("marsModal"));

document.getElementById("neoArticle").addEventListener("click", () => {
  openModal("neoModal");
  getNEO();
});
document.getElementById("neoArticle").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { openModal("neoModal"); getNEO(); }
});
document.getElementById("neoClose").addEventListener("click", () => closeModal("neoModal"));

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal.id);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") ["marsModal", "neoModal"].forEach(closeModal);
});

// --- Init ---
getAPOD();
