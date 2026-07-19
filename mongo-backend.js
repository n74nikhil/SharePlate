const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { MongoClient, ObjectId } = require("mongodb");

const ROOT = __dirname;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/";
const MONGODB_DB = process.env.MONGODB_DB || "shareplate";
const MAX_BODY_BYTES = 50_000;

let client;
let database;
let connecting;

const directoryPartners = [
  { type: "NGO", name: "Kindpath Foundation", address: "Jagriti Vihar, Sanjay Nagar, Kavinagar, Ghaziabad, Uttar Pradesh 201002", phone: "+919773661823", email: "kindpathfoundation@gmail.com", description: "Ghaziabad hunger-relief directory listing. Call before offering prepared food or arranging delivery.", directionsDetails: "Use the Maps link and call the organization before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Kindpath%20Foundation%20Jagriti%20Vihar%20Ghaziabad", sourceUrl: "https://kindpathfoundation.com/" },
  { type: "NGO", name: "Vasundhara Jan Seva Samiti", address: "C-703, Doctors Park Apartment, Sector 5, Vasundhara, Ghaziabad, Uttar Pradesh 201012", phone: "+918010203944", email: "", description: "Ghaziabad food and community-service directory listing. Call to confirm current food requirements.", directionsDetails: "Use the Maps link and call the organization before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Vasundhara%20Jan%20Seva%20Samiti%20Ghaziabad", sourceUrl: "https://www.vasundharajansevasamiti.com/" },
  { type: "NGO", name: "Taaha Humanity India Foundation", address: "G-356, 357, 358, Phase 2, UPSIDC Industrial Area, M.G. Road, Ghaziabad, Uttar Pradesh", phone: "+917217850844", email: "taahahumanityif@gmail.com", description: "Ghaziabad food-distribution directory listing. Call before arranging a surplus-food handoff.", directionsDetails: "Use the Maps link and call the organization before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Taaha%20Humanity%20India%20Foundation%20Ghaziabad", sourceUrl: "https://www.taahahumanity.com/" },
  { type: "NGO", name: "Sarvjeevam Welfare Foundation", address: "941/B, Sector 1, Vasundhara, Ghaziabad, Uttar Pradesh 201012", phone: "+918899782623", email: "", description: "Ghaziabad hunger-relief and elderly-care directory listing. Call to confirm food acceptance.", directionsDetails: "Use the Maps link and call the organization before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Sarvjeevam%20Welfare%20Foundation%20Ghaziabad", sourceUrl: "https://www.sarvjeevamfoundation.com/" },
  { type: "NGO", name: "Haare Ka Sahara Welfare Foundation", address: "Unit 417, 4th Floor, Plot 6, Signature Global Mall, Sector 3, Vaishali, Ghaziabad, Uttar Pradesh 201010", phone: "+918168440489", email: "team@haarekasahara.org", description: "Ghaziabad food-charity directory listing. Call to confirm the current collection or delivery point.", directionsDetails: "Use the Maps link and call the organization before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Haare%20Ka%20Sahara%20Welfare%20Foundation%20Ghaziabad", sourceUrl: "https://haarekasahara.org/" },
  { type: "Orphanage", name: "Mala Smriti Home", address: "A-36, Nehru Garden, Khora Colony, Ghaziabad, Uttar Pradesh", phone: "+919717432007", email: "mgu.sansthan@gmail.com", description: "Ghaziabad children's shelter directory listing. Call the home before bringing prepared food.", directionsDetails: "Sharma's Pharmacy Lane near Nehru Garden Police Chowki; use the Maps link and call first.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Mala%20Smriti%20Home%20Khora%20Colony%20Ghaziabad", sourceUrl: "https://www.malasmritihome.com/" },
  { type: "Old age home", name: "Balaji Old Age Home", address: "Pratap Nagar, Ghaziabad, Uttar Pradesh", phone: "+911202784860", email: "bssksiat@yahoo.com", description: "Ghaziabad senior-care directory listing operated by Bhagirath Sewa Sansthan. Call before donating food.", directionsDetails: "Use the Maps link and call reception before visiting.", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Balaji%20Old%20Age%20Home%20Pratap%20Nagar%20Ghaziabad", sourceUrl: "https://bhagirathsewasansthan.org/balaji-old-age-home.php" }
];

async function connectDatabase() {
  if (database) return database;
  if (connecting) return connecting;

  connecting = (async () => {
    client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
    await client.connect();
    database = client.db(MONGODB_DB);
    await database.command({ ping: 1 });

    await Promise.all([
      database.collection("partners").createIndex({ active: 1, type: 1, name: 1 }),
      database.collection("partners").createIndex({ sourceUrl: 1 }, { unique: true, sparse: true }),
      database.collection("partners").createIndex({ sourceApplicationId: 1 }, { unique: true, sparse: true }),
      database.collection("partner_applications").createIndex({ createdAt: -1 }),
      database.collection("donations").createIndex({ createdAt: -1 }),
      database.collection("geocode_cache").createIndex({ query: 1 }, { unique: true })
    ]);

    const now = new Date();
    for (const partner of directoryPartners) {
      await database.collection("partners").updateOne(
        { sourceUrl: partner.sourceUrl },
        {
          $set: { ...partner, active: true, updatedAt: now },
          $setOnInsert: { capacity: 50, capacityConfirmed: false, latitude: null, longitude: null, isDirectory: true, createdAt: now }
        },
        { upsert: true }
      );
    }
    return database;
  })().catch(async (error) => {
    connecting = null;
    database = null;
    if (client) await client.close().catch(() => {});
    client = null;
    throw error;
  });

  return connecting;
}

async function closeDatabase() {
  if (client) await client.close();
  client = null;
  database = null;
  connecting = null;
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidPhone(phone) {
  return /^\+?[0-9][0-9 ()-]{7,18}$/.test(phone);
}

function isValidWebUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function publicPartner(row, latitude = null, longitude = null) {
  const hasPartnerLocation = validCoordinates(row.latitude, row.longitude);
  const hasSearchLocation = validCoordinates(latitude, longitude);
  return {
    id: String(row._id), type: row.type, name: row.name, capacity: row.capacity,
    capacityConfirmed: Boolean(row.capacityConfirmed), address: row.address,
    latitude: hasPartnerLocation ? row.latitude : null,
    longitude: hasPartnerLocation ? row.longitude : null,
    phone: row.phone, email: row.email || "", description: row.description,
    directionsDetails: row.directionsDetails, directionsUrl: row.directionsUrl,
    sourceUrl: row.sourceUrl || "", isDemo: false,
    distanceKm: hasPartnerLocation && hasSearchLocation
      ? Number(distanceKm(latitude, longitude, row.latitude, row.longitude).toFixed(2)) : null
  };
}

async function activePartners(db, latitude = null, longitude = null) {
  const rows = await db.collection("partners").find({ active: true, directionsUrl: { $type: "string", $ne: "" } }).sort({ name: 1 }).toArray();
  const partners = rows.map((row) => publicPartner(row, latitude, longitude));
  if (validCoordinates(latitude, longitude)) {
    partners.sort((a, b) => a.distanceKm === null ? 1 : b.distanceKm === null ? -1 : a.distanceKm - b.distanceKm);
  }
  return partners;
}

function capacityFromLabel(label) {
  if (label === "50 to 150 meals") return 150;
  if (label === "150+ meals") return 300;
  return 50;
}

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store" });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let rejected = false;
    request.on("data", (chunk) => {
      if (rejected) return;
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        rejected = true;
        reject(new Error("Request is too large."));
      }
    });
    request.on("end", () => {
      if (rejected) return;
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Request must contain valid JSON.")); }
    });
    request.on("error", reject);
  });
}

async function handleApi(request, response, url, db) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "SharePlate Connect", storage: "MongoDB", database: db.databaseName });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/partners") {
    const latitudeText = url.searchParams.get("latitude");
    const longitudeText = url.searchParams.get("longitude");
    const hasCoordinates = latitudeText !== null || longitudeText !== null;
    const latitude = latitudeText === null ? null : Number(latitudeText);
    const longitude = longitudeText === null ? null : Number(longitudeText);
    if (hasCoordinates && !validCoordinates(latitude, longitude)) {
      sendJson(response, 400, { error: "A valid latitude and longitude must be provided together." });
      return true;
    }
    sendJson(response, 200, { partners: await activePartners(db, latitude, longitude) });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/geocode") {
    const area = cleanText(url.searchParams.get("area"), 160);
    if (area.length < 3) {
      sendJson(response, 400, { error: "Enter a valid area, landmark, city, or PIN code." });
      return true;
    }
    const query = area.toLocaleLowerCase("en-IN");
    const cached = await db.collection("geocode_cache").findOne({ query });
    if (cached) {
      sendJson(response, 200, { latitude: cached.latitude, longitude: cached.longitude, displayName: cached.displayName, attribution: "© OpenStreetMap contributors", cached: true });
      return true;
    }
    try {
      const target = new URL("https://nominatim.openstreetmap.org/search");
      target.searchParams.set("q", area);
      target.searchParams.set("format", "jsonv2");
      target.searchParams.set("limit", "1");
      target.searchParams.set("countrycodes", "in");
      const result = await fetch(target, { headers: { Accept: "application/json", "Accept-Language": "en-IN,en;q=0.8", "User-Agent": "SharePlateConnect/1.0 nonprofit food donation matching" }, signal: AbortSignal.timeout(10000) });
      if (!result.ok) throw new Error("Geocoder unavailable");
      const found = (await result.json())[0];
      const latitude = Number(found?.lat);
      const longitude = Number(found?.lon);
      if (!found || !validCoordinates(latitude, longitude)) {
        sendJson(response, 404, { error: "That area was not found. Try adding the city or PIN code." });
        return true;
      }
      const displayName = cleanText(found.display_name, 300);
      await db.collection("geocode_cache").updateOne({ query }, { $set: { latitude, longitude, displayName, updatedAt: new Date() } }, { upsert: true });
      sendJson(response, 200, { latitude, longitude, displayName, attribution: "© OpenStreetMap contributors", cached: false });
    } catch {
      sendJson(response, 503, { error: "Area lookup is temporarily unavailable. Please try again shortly." });
    }
    return true;
  }

  if (request.method === "POST" && (url.pathname === "/api/ngos" || url.pathname === "/api/partner-applications")) {
    const body = await readJson(request);
    const organizationType = cleanText(body.organizationType, 40);
    const organizationName = cleanText(body.organizationName, 120);
    const serviceArea = cleanText(body.serviceArea, 160);
    const address = cleanText(body.address, 400);
    const pincode = cleanText(body.pincode, 6);
    const directionsDetails = cleanText(body.directionsDetails, 500);
    const directionsUrl = cleanText(body.directionsUrl, 500);
    const pickupCapacity = cleanText(body.pickupCapacity, 40);
    const coordinatorPhone = cleanText(body.coordinatorPhone, 24);
    if (!["Old age home", "Orphanage", "NGO"].includes(organizationType)
      || organizationName.length < 2 || serviceArea.length < 2 || address.length < 5
      || !/^\d{6}$/.test(pincode) || directionsDetails.length < 3 || !isValidWebUrl(directionsUrl)
      || !["Up to 50 meals", "50 to 150 meals", "150+ meals"].includes(pickupCapacity)
      || !isValidPhone(coordinatorPhone)) {
      sendJson(response, 400, { error: "Please check the organization details and try again." });
      return true;
    }

    const applicationId = `ORG-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date();
    await db.collection("partner_applications").insertOne({ applicationId, organizationType, organizationName, serviceArea, address, pincode, directionsDetails, directionsUrl, pickupCapacity, coordinatorPhone, status: "approved", createdAt: now });
    await db.collection("partners").insertOne({
      type: organizationType, name: organizationName, capacity: capacityFromLabel(pickupCapacity),
      capacityConfirmed: true, address: `${address}, ${serviceArea} - ${pincode}`,
      latitude: null, longitude: null, phone: coordinatorPhone, email: "",
      description: `Recipient serving ${serviceArea}. ${directionsDetails}`,
      directionsDetails, directionsUrl, sourceApplicationId: applicationId,
      active: true, createdAt: now, updatedAt: now
    });
    sendJson(response, 201, { message: "Recipient organization added to nearby searches.", applicationId, status: "approved" });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/donations") {
    const body = await readJson(request);
    const donorType = cleanText(body.donorType, 60);
    const foodQuantity = Number(body.foodQuantity);
    const preparedTime = cleanText(body.preparedTime, 10);
    const area = cleanText(body.area, 160);
    const phone = cleanText(body.phone, 24);
    const recipientType = cleanText(body.recipient, 40);
    const foodNotes = cleanText(body.foodNotes, 800);
    const latitude = body.latitude === null || body.latitude === undefined || body.latitude === "" ? null : Number(body.latitude);
    const longitude = body.longitude === null || body.longitude === undefined || body.longitude === "" ? null : Number(body.longitude);
    const hasLocation = latitude !== null || longitude !== null;
    if (!["Party or celebration", "Restaurant", "Caterer", "Community event"].includes(donorType)
      || !Number.isInteger(foodQuantity) || foodQuantity < 1 || foodQuantity > 10000
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(preparedTime) || area.length < 3
      || !isValidPhone(phone) || !["Old age home", "Orphanage", "NGO"].includes(recipientType)
      || (hasLocation && !validCoordinates(latitude, longitude))) {
      sendJson(response, 400, { error: "Please check the form details and try again." });
      return true;
    }

    const candidates = (await activePartners(db, latitude, longitude)).filter((partner) => partner.type === recipientType);
    candidates.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return Math.abs(a.capacity - foodQuantity) - Math.abs(b.capacity - foodQuantity);
    });
    const match = candidates[0] || null;
    const donationId = `SP-${randomUUID().slice(0, 8).toUpperCase()}`;
    await db.collection("donations").insertOne({ donationId, donorType, foodQuantity, preparedTime, area, phone, recipientType, foodNotes, latitude, longitude, partnerId: match ? new ObjectId(match.id) : null, status: "pending", createdAt: new Date() });
    sendJson(response, 201, { message: match ? "Donation request saved and matched." : "Donation request saved. No match is available yet.", donationId, match });
    return true;
  }

  return false;
}

const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, requestedPath);
  const allowedRoot = `${path.resolve(ROOT)}${path.sep}`;
  if (!filePath.startsWith(allowedRoot) || requestedPath.startsWith("data/") || requestedPath.startsWith("node_modules/")) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  setSecurityHeaders(response);
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  try {
    const db = await connectDatabase();
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url, db);
      if (!handled) sendJson(response, 404, { error: "API route not found." });
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }
    serveStatic(request, response, url.pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) sendJson(response, 500, { error: "Database connection failed. Make sure MongoDB is running." });
  }
});

module.exports = { server, connectDatabase, closeDatabase };
