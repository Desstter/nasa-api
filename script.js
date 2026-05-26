const API_KEY = "fD430FM8268SGoczkLpoeuMNN6Ah7aWvBWaYZRj5";
const BASE_URL = "https://api.nasa.gov";

const padDate = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;
};

// --- APOD ---
const getAPOD = async () => {
  try {
    const res = await fetch(`${BASE_URL}/planetary/apod?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const imageContainer = document.getElementById("imageContainer");
    const copyright = document.getElementById("copyright");

    document.getElementById("apodLoader").remove();

    if (data.media_type === "video") {
      imageContainer.innerHTML = `<iframe src="${data.url}" frameborder="0" allowfullscreen id="videoOfDay" title="${data.title}"></iframe>`;
    } else {
      imageContainer.innerHTML = `<img src="${data.url}" id="imageOfDay" alt="${data.title}">`;
    }

    const credit = data.copyright
      ? `<span class="credit">© ${data.copyright.trim()}</span>`
      : "";

    copyright.innerHTML = `
      <h2 id="authorName">${data.title}</h2>
      ${credit}
      <p id="date">${data.date}</p>
      <p id="textOfDay">${data.explanation}</p>
    `;
  } catch (err) {
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

document.getElementById("marsArticle").addEventListener("click", () => openModal("marsModal"));
document.getElementById("marsArticle").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openModal("marsModal");
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
