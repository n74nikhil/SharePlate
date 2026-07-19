const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const donationForm = document.querySelector("#donation-form");
const matchBox = document.querySelector("#match-box");
const filterButtons = document.querySelectorAll(".filter-chip");
const partnerGrid = document.querySelector("#partner-grid");
const nearbyStatus = document.querySelector("#nearby-status");
const ngoForm = document.querySelector("#ngo-form");
const ngoStatus = document.querySelector("#ngo-status");
const findAreaButton = document.querySelector("#find-area");
const locationStatus = document.querySelector("#location-status");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const areaInput = document.querySelector("#area");

let partners = [];
let activeFilter = "all";

const previewPartners = [
  {
    type: "Old age home", name: "Anand Elder Support", capacity: 60, capacityConfirmed: true,
    address: "Goregaon East, Mumbai", latitude: 19.1663, longitude: 72.8526,
    phone: "+914444444444", description: "Demo record for smaller meal, fruit, and breakfast donations.",
    directionsDetails: "", directionsUrl: "", sourceUrl: "", isDemo: true, distanceKm: null
  },
  {
    type: "Old age home", name: "Balaji Old Age Home", capacity: 50, capacityConfirmed: false,
    address: "Pratap Nagar, Ghaziabad, Uttar Pradesh", latitude: null, longitude: null,
    phone: "+911202784860", description: "Ghaziabad senior-care directory listing operated by Bhagirath Sewa Sansthan. Call before donating food.",
    directionsDetails: "Use the Maps link and call reception before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Balaji%20Old%20Age%20Home%20Pratap%20Nagar%20Ghaziabad",
    sourceUrl: "https://bhagirathsewasansthan.org/balaji-old-age-home.php", isDemo: false, distanceKm: null
  },
  {
    type: "NGO", name: "City Food Rescue Network", capacity: 300, capacityConfirmed: true,
    address: "Bandra East, Mumbai", latitude: 19.0607, longitude: 72.8468,
    phone: "+913333333333", description: "Demo volunteer pickup team for large food donations.",
    directionsDetails: "", directionsUrl: "", sourceUrl: "", isDemo: true, distanceKm: null
  },
  {
    type: "NGO", name: "Haare Ka Sahara Welfare Foundation", capacity: 50, capacityConfirmed: false,
    address: "Unit 417, 4th Floor, Plot 6, Signature Global Mall, Sector 3, Vaishali, Ghaziabad, Uttar Pradesh 201010",
    latitude: null, longitude: null, phone: "+918168440489",
    description: "Ghaziabad food-charity directory listing. Call to confirm the current collection or delivery point.",
    directionsDetails: "Use the Maps link and call the organization before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Haare%20Ka%20Sahara%20Welfare%20Foundation%20Ghaziabad",
    sourceUrl: "https://haarekasahara.org/", isDemo: false, distanceKm: null
  },
  {
    type: "NGO", name: "Kindpath Foundation", capacity: 50, capacityConfirmed: false,
    address: "Jagriti Vihar, Sanjay Nagar, Kavinagar, Ghaziabad, Uttar Pradesh 201002",
    latitude: null, longitude: null, phone: "+919773661823",
    description: "Ghaziabad hunger-relief directory listing. Call before offering prepared food or arranging delivery.",
    directionsDetails: "Use the Maps link and call the organization before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Kindpath%20Foundation%20Jagriti%20Vihar%20Ghaziabad",
    sourceUrl: "https://kindpathfoundation.com/", isDemo: false, distanceKm: null
  },
  {
    type: "Orphanage", name: "Mala Smriti Home", capacity: 50, capacityConfirmed: false,
    address: "A-36, Nehru Garden, Khora Colony, Ghaziabad, Uttar Pradesh",
    latitude: null, longitude: null, phone: "+919717432007",
    description: "Ghaziabad children’s shelter directory listing. Call the home before bringing prepared food.",
    directionsDetails: "Sharma's Pharmacy Lane near Nehru Garden Police Chowki; use the Maps link and call first.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Mala%20Smriti%20Home%20Khora%20Colony%20Ghaziabad",
    sourceUrl: "https://www.malasmritihome.com/", isDemo: false, distanceKm: null
  },
  {
    type: "NGO", name: "Sarvjeevam Welfare Foundation", capacity: 50, capacityConfirmed: false,
    address: "941/B, Sector 1, Vasundhara, Ghaziabad, Uttar Pradesh 201012",
    latitude: null, longitude: null, phone: "+918899782623",
    description: "Ghaziabad hunger-relief and elderly-care directory listing. Call to confirm food acceptance.",
    directionsDetails: "Use the Maps link and call the organization before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Sarvjeevam%20Welfare%20Foundation%20Ghaziabad",
    sourceUrl: "https://www.sarvjeevamfoundation.com/", isDemo: false, distanceKm: null
  },
  {
    type: "Old age home", name: "Seva Senior Care Home", capacity: 120, capacityConfirmed: true,
    address: "Andheri West, Mumbai", latitude: 19.1364, longitude: 72.8296,
    phone: "+911111111111", description: "Demo record for testing fresh cooked meal donations.",
    directionsDetails: "", directionsUrl: "", sourceUrl: "", isDemo: true, distanceKm: null
  },
  {
    type: "NGO", name: "Taaha Humanity India Foundation", capacity: 50, capacityConfirmed: false,
    address: "G-356, 357, 358, Phase 2, UPSIDC Industrial Area, M.G. Road, Ghaziabad, Uttar Pradesh",
    latitude: null, longitude: null, phone: "+917217850844",
    description: "Ghaziabad food-distribution directory listing. Call before arranging a surplus-food handoff.",
    directionsDetails: "Use the Maps link and call the organization before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Taaha%20Humanity%20India%20Foundation%20Ghaziabad",
    sourceUrl: "https://www.taahahumanity.com/", isDemo: false, distanceKm: null
  },
  {
    type: "Orphanage", name: "Ujjwal Child Care Trust", capacity: 80, capacityConfirmed: true,
    address: "Jogeshwari East, Mumbai", latitude: 19.1197, longitude: 72.8464,
    phone: "+912222222222", description: "Demo record for testing lunch and dinner coordination.",
    directionsDetails: "", directionsUrl: "", sourceUrl: "", isDemo: true, distanceKm: null
  },
  {
    type: "NGO", name: "Vasundhara Jan Seva Samiti", capacity: 50, capacityConfirmed: false,
    address: "C-703, Doctors Park Apartment, Sector 5, Vasundhara, Ghaziabad, Uttar Pradesh 201012",
    latitude: null, longitude: null, phone: "+918010203944",
    description: "Ghaziabad food and community-service directory listing. Call to confirm current food requirements.",
    directionsDetails: "Use the Maps link and call the organization before visiting.",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Vasundhara%20Jan%20Seva%20Samiti%20Ghaziabad",
    sourceUrl: "https://www.vasundharajansevasamiti.com/", isDemo: false, distanceKm: null
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const message = (await response.text()).trim();
    data = { error: message || fallbackMessage };
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("The server refused this request. Refresh the page once and try again.");
    }
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

function closeNav() {
  siteNav.classList.remove("open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
}

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));

function renderPartners() {
  const visiblePartners = activeFilter === "all"
    ? partners
    : partners.filter((partner) => partner.type === activeFilter);

  if (!visiblePartners.length) {
    partnerGrid.innerHTML = "<p>No verified recipients are available in this category yet. Organizations can apply through the NGO form below.</p>";
    return;
  }

  partnerGrid.innerHTML = visiblePartners.map((partner) => {
    const distance = partner.distanceKm == null ? "Location needed" : `${partner.distanceKm.toFixed(1)} km`;
    const capacity = partner.capacityConfirmed ? `${Number(partner.capacity)} meals` : "Call to confirm";
    const directionsUrl = partner.directionsUrl || (partner.latitude != null && partner.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${partner.latitude},${partner.longitude}`)}`
      : "");

    return `
      <article class="partner-card" data-type="${escapeHtml(partner.type)}" data-capacity="${Number(partner.capacity)}">
        <div>
          <p class="tag">${escapeHtml(partner.isDemo ? `Demo ${partner.type}` : (!partner.capacityConfirmed ? `Ghaziabad directory · ${partner.type}` : (partner.type === "NGO" ? "NGO pickup" : partner.type)))}</p>
          <h3>${escapeHtml(partner.name)}</h3>
          <p>${escapeHtml(partner.description)}</p>
          <p><strong>${escapeHtml(partner.address)}</strong></p>
          ${partner.directionsDetails ? `<p>${escapeHtml(partner.directionsDetails)}</p>` : ""}
        </div>
        <dl>
          <div><dt>Capacity</dt><dd>${escapeHtml(capacity)}</dd></div>
          <div><dt>Distance</dt><dd>${escapeHtml(distance)}</dd></div>
        </dl>
        <div class="card-actions">
          <a href="tel:${escapeHtml(partner.phone)}">Call</a>
          ${directionsUrl
            ? `<a href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener">Directions</a>`
            : ""}
          ${partner.sourceUrl
            ? `<a href="${escapeHtml(partner.sourceUrl)}" target="_blank" rel="noopener">Website</a>`
            : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function loadPartners(location) {
  const query = location
    ? `?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}`
    : "";

  try {
    const response = await fetch(`/api/partners${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load recipients.");
    partners = data.partners;
    renderPartners();

    nearbyStatus.textContent = location
      ? `${partners.length} verified recipient${partners.length === 1 ? "" : "s"} ordered nearest first.`
      : "Enter an area and choose Find by area to order recipients nearest first.";
  } catch (error) {
    partners = [];
    renderPartners();
    nearbyStatus.textContent = "MongoDB backend is unavailable. Start MongoDB and the SharePlate server, then refresh this page.";
  }
}

findAreaButton.addEventListener("click", async () => {
  const area = areaInput.value.trim();
  if (area.length < 3) {
    locationStatus.textContent = "Enter an area, landmark, city, or PIN code first.";
    areaInput.focus();
    return;
  }

  findAreaButton.disabled = true;
  findAreaButton.textContent = "Finding area...";
  locationStatus.textContent = "Looking up the area for nearby matching...";

  try {
    const response = await fetch(`/api/geocode?area=${encodeURIComponent(area)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "That area could not be found.");

    latitudeInput.value = Number(data.latitude).toFixed(6);
    longitudeInput.value = Number(data.longitude).toFixed(6);
    locationStatus.textContent = `Area found: ${data.displayName}. Nearby recipients are ordered by distance.`;
    findAreaButton.textContent = "Area added";
    await loadPartners({ latitude: data.latitude, longitude: data.longitude });
    document.querySelector("#partners").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    locationStatus.textContent = error.message;
    findAreaButton.textContent = "Try area again";
  } finally {
    findAreaButton.disabled = false;
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderPartners();
  });
});

donationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = donationForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Saving and finding a match...";

  try {
    const payload = Object.fromEntries(new FormData(donationForm).entries());
    payload.foodQuantity = Number(payload.foodQuantity);
    payload.latitude = payload.latitude ? Number(payload.latitude) : null;
    payload.longitude = payload.longitude ? Number(payload.longitude) : null;

    const response = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The donation could not be saved.");

    const match = data.match;
    if (!match) {
      matchBox.innerHTML = `
        <p class="eyebrow">Request ${escapeHtml(data.donationId)} saved</p>
        <h3>No verified recipient is available yet.</h3>
        <p>Your donation request is safely recorded. Please try another recipient type or contact a local food-rescue helpline.</p>
      `;
      matchBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const distanceText = match.distanceKm == null ? "" : ` It is approximately <strong>${match.distanceKm.toFixed(1)} km</strong> away.`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${match.latitude},${match.longitude}`)}`;

    matchBox.innerHTML = `
      <p class="eyebrow">Request ${escapeHtml(data.donationId)} saved</p>
      <h3>${escapeHtml(match.name)}</h3>
      <p><strong>${escapeHtml(match.type)}</strong> can handle up to <strong>${Number(match.capacity)} meals</strong>.${distanceText}</p>
      <p>Call first to confirm food condition, required packaging, pickup person, and delivery time.</p>
      <div class="match-actions">
        <a href="tel:${escapeHtml(match.phone)}">Call now</a>
        <a href="${directionsUrl}" target="_blank" rel="noopener">Directions</a>
      </div>
    `;
    matchBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    matchBox.innerHTML = `
      <p class="eyebrow">Could not save request</p>
      <h3>Please check the details and try again.</h3>
      <p>${escapeHtml(error.message)}</p>
    `;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

ngoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = ngoForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Adding recipient...";

  try {
    const payload = Object.fromEntries(new FormData(ngoForm).entries());
    const response = await fetch("/api/ngos", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse(response, "The application could not be saved.");

    ngoStatus.textContent = `Organization ${data.applicationId} was added to nearby recipient searches.`;
    ngoForm.reset();
    await loadPartners();
    document.querySelector("#partners").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    ngoStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

loadPartners();
