const state = {
  consented: false,
  language: "hi",
  lastSpeechText: "",
  metadata: null,
};

const consentPanel = document.getElementById("consent-panel");
const searchPanel = document.getElementById("search-panel");
const responsePanel = document.getElementById("response-panel");
const consentStatus = document.getElementById("consent-status");
const voiceStatus = document.getElementById("voice-status");
const form = document.getElementById("search-form");
const locationInput = document.getElementById("location");
const categoryInput = document.getElementById("category");
const facilityList = document.getElementById("facility-list");
const alertBanner = document.getElementById("alert-banner");

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => voice.lang.toLowerCase() === (state.language === "hi" ? "hi-in" : "en-in"))
    || voices.find((voice) => voice.lang.toLowerCase().startsWith(state.language === "hi" ? "hi" : "en"));
  if (state.language === "hi" && !preferredVoice) {
    document.getElementById("voice-support").textContent = "इस ब्राउज़र में हिंदी बोलने की आवाज़ उपलब्ध नहीं है। डिवाइस में हिंदी स्पीच वॉइस चालू करें; तब तक टेक्स्ट उपलब्ध रहेगा।";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = preferredVoice?.lang || (state.language === "hi" ? "hi-IN" : "en-IN");
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.94;
  window.speechSynthesis.speak(utterance);
}

function updateVoiceSupport() {
  const support = document.getElementById("voice-support");
  if (!("speechSynthesis" in window)) {
    support.textContent = state.language === "hi"
      ? "इस ब्राउज़र में बोलकर सुनाने की सुविधा उपलब्ध नहीं है।"
      : "Speech playback is not available in this browser.";
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  const hasVoice = voices.some((voice) => voice.lang.toLowerCase().startsWith(state.language === "hi" ? "hi" : "en"));
  support.textContent = state.language === "hi"
    ? (hasVoice ? "हिंदी आवाज़ तैयार है।" : "हिंदी आवाज़ लोड हो रही है या इस डिवाइस पर उपलब्ध नहीं है; टेक्स्ट खोज फिर भी काम करेगी।")
    : (hasVoice ? "English voice ready." : "No English voice is listed by this browser; text search remains available.");
}

function renderNotice() {
  if (!state.metadata) return;
  const title = document.getElementById("notice-title");
  const body = document.getElementById("notice-body");
  if (state.metadata.data_mode === "synthetic_demo") {
    title.textContent = state.language === "hi" ? "काल्पनिक नमूना रिकॉर्ड" : "Fictional sample records";
    body.textContent = state.language === "hi"
      ? "ये रिकॉर्ड केवल डेमो के लिए बनाए गए हैं। ये ABDM HFR की सूची या असली स्वास्थ्य सुविधाएँ नहीं हैं। इलाज या यात्रा के लिए इनका उपयोग न करें।"
      : (state.metadata.dataset_note || "These records are fictional and are not live ABDM HFR listings.");
  } else {
    title.textContent = state.language === "hi" ? "स्थानीय रूप से लोड किए गए रिकॉर्ड" : "Locally loaded facility records";
    body.textContent = state.language === "hi"
      ? "यह डेमो live ABDM HFR से जुड़ा नहीं है। भरोसा करने से पहले सुविधा की जानकारी की पुष्टि करें।"
      : "This demo is not connected to live ABDM HFR. Confirm each facility’s information before relying on it.";
  }
}

function setLanguage(language) {
  state.language = language;
  document.querySelectorAll(".language-option").forEach((button) => {
    const selected = button.dataset.language === language;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.documentElement.lang = language;
  const hi = language === "hi";
  document.getElementById("search-heading").textContent = hi ? "आपको क्या चाहिए?" : "What do you need?";
  document.getElementById("category-label").textContent = hi ? "सुविधा का प्रकार" : "Facility type";
  document.getElementById("category-all").textContent = hi ? "कोई भी सुविधा" : "Any facility";
  document.getElementById("category-hospital").textContent = hi ? "अस्पताल" : "Hospital";
  document.getElementById("category-clinic").textContent = hi ? "क्लिनिक" : "Clinic";
  document.getElementById("category-diagnostics").textContent = hi ? "जाँच केंद्र / लैब" : "Diagnostic centre / lab";
  document.getElementById("category-pharmacy").textContent = hi ? "फार्मेसी / दवा की दुकान" : "Pharmacy / medical store";
  document.getElementById("location-label").textContent = hi ? "इलाका या पिन कोड" : "Area or PIN code";
  locationInput.placeholder = hi ? "उदाहरण: कानपुर या 208001" : "For example: Kanpur or 208001";
  document.getElementById("field-hint").textContent = hi
    ? "डेमो में कानपुर के काल्पनिक रिकॉर्ड हैं। पिन कोड से दूरी अनुमानित होती है।"
    : "The demo has sample records for Kanpur only. PIN-based location is approximate.";
  document.getElementById("search-button").innerHTML = hi
    ? "नज़दीकी सुविधाएँ खोजें <span aria-hidden=\"true\">→</span>"
    : "Find nearby facilities <span aria-hidden=\"true\">→</span>";
  document.getElementById("results-title").textContent = hi ? "नज़दीकी परिणाम" : "Nearby matches";
  document.getElementById("speak-button").textContent = hi ? "▶ सुनें" : "▶ Read aloud";
  document.getElementById("consent-button").textContent = hi ? "मैं समझता/समझती हूँ और सहमत हूँ" : "I understand and agree";
  document.getElementById("decline-button").textContent = hi ? "सहमति के बिना जारी रखें" : "Continue without consent";
  consentStatus.textContent = state.consented
    ? (hi ? "इस पेज सत्र के लिए सहमति दी गई है। पेज रीफ़्रेश करने पर सत्र साफ़ हो जाएगा।" : "Consent given for this page session. Refreshing the page clears the session.")
    : (hi ? "सहमति देने तक खोज और माइक्रोफ़ोन बंद रहेंगे।" : "Search and microphone are disabled until you agree.");
  renderNotice();
  updateVoiceSupport();
}

function showSafetyMessage(message) {
  alertBanner.textContent = message;
  alertBanner.classList.remove("is-hidden");
  speak(message);
  window.setTimeout(() => alertBanner.classList.add("is-hidden"), 12000);
}

async function interpretTranscript(text) {
  const response = await fetch("/api/voice/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: state.language }),
  });
  if (!response.ok) throw new Error("Voice request could not be interpreted.");
  return response.json();
}

async function startRecognition() {
  if (!state.consented) {
    consentStatus.textContent = "Agree to the privacy notice before using speech input.";
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceStatus.textContent = state.language === "hi"
      ? "इस ब्राउज़र में बोलकर खोज उपलब्ध नहीं है। इलाका टाइप करें।"
      : "Speech recognition is not available in this browser. Type the area instead.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = state.language === "hi" ? "hi-IN" : "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  voiceStatus.textContent = state.language === "hi" ? "सुन रहा हूँ…" : "Listening…";
  document.getElementById("mic-button").disabled = true;

  recognition.onresult = async (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    state.lastSpeechText = transcript;
    voiceStatus.textContent = `${state.language === "hi" ? "आपने कहा" : "You said"}: ${transcript}`;
    try {
      const interpreted = await interpretTranscript(transcript);
      if (interpreted.action === "emergency" || interpreted.action === "medical_advice") {
        showSafetyMessage(interpreted.message);
        return;
      }
      if (interpreted.action === "facility_search") {
        categoryInput.value = interpreted.category;
        locationInput.value = interpreted.location;
        locationInput.focus();
        window.setTimeout(() => form.requestSubmit(), 150);
      } else if (interpreted.message) {
        voiceStatus.textContent = interpreted.message;
        speak(interpreted.message);
      }
    } catch (error) {
      voiceStatus.textContent = error.message;
    }
  };

  recognition.onerror = (event) => {
    voiceStatus.textContent = event.error === "not-allowed"
      ? (state.language === "hi" ? "माइक्रोफ़ोन की अनुमति नहीं मिली। आप इलाका टाइप कर सकते हैं।" : "Microphone access was not granted. You can type the area instead.")
      : (state.language === "hi" ? "आवाज़ समझ नहीं आई। फिर से बोलें या इलाका टाइप करें।" : "Speech could not be recognized. Try again or type the area.");
  };
  recognition.onend = () => { document.getElementById("mic-button").disabled = false; };
  recognition.start();
}

function renderFacility(match) {
  const record = match.facility;
  const card = document.createElement("article");
  card.className = "facility-card";

  const top = document.createElement("div");
  top.className = "facility-card-top";
  const heading = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = state.language === "hi" ? (record.name_hi || record.name) : record.name;
  heading.append(title);
  const type = document.createElement("span");
  type.className = "facility-type";
  const categoryLabelsHi = {
    hospital: "अस्पताल",
    clinic: "क्लिनिक",
    diagnostic_center: "जाँच केंद्र",
    pharmacy: "फार्मेसी",
    other: "अन्य",
  };
  type.textContent = state.language === "hi" ? (categoryLabelsHi[record.category] || "सुविधा") : record.category.replaceAll("_", " ");
  top.append(heading, type);
  card.append(top);

  const address = document.createElement("p");
  const displayAddress = state.language === "hi" ? (record.address_hi || record.address) : record.address;
  address.textContent = [displayAddress, record.pincode].filter(Boolean).join(" · ");
  card.append(address);

  const meta = document.createElement("div");
  meta.className = "facility-meta";
  const distance = state.language === "hi"
    ? (match.distance_km == null ? "दूरी उपलब्ध नहीं" : `लगभग ${match.distance_km.toFixed(1)} किमी, सीधी दूरी`)
    : (match.distance_label || "Distance unavailable");
  const ownership = state.language === "hi"
    ? (record.ownership === "Demo record" ? "डेमो रिकॉर्ड" : (record.ownership || "स्वामित्व दर्ज नहीं"))
    : (record.ownership || "Ownership not listed");
  const hours = state.language === "hi"
    ? (record.operating_hours || "समय उपलब्ध नहीं")
    : (record.operating_hours || "Hours not listed");
  const sourceDate = state.language === "hi"
    ? (record.source_as_of ? `डेटा की तारीख: ${record.source_as_of}` : "डेटा की तारीख दर्ज नहीं")
    : (record.source_as_of ? `Data date: ${record.source_as_of}` : "Data date not listed");
  [distance, ownership, hours, sourceDate].forEach((text) => {
    const item = document.createElement("span");
    item.textContent = text;
    meta.append(item);
  });
  card.append(meta);

  const note = document.createElement("p");
  note.className = "facility-note";
  const recordNote = state.language === "hi" && record.record_note
    ? "काल्पनिक रिकॉर्ड; कॉल या नेविगेट न करें।"
    : record.record_note;
  const source = state.language === "hi" && record.source?.includes("Synthetic demo fixture")
    ? "काल्पनिक डेमो डेटा — ABDM HFR नहीं"
    : record.source;
  note.textContent = [source, recordNote].filter(Boolean).join(" · ");
  card.append(note);
  return card;
}

async function searchFacilities(event) {
  event.preventDefault();
  if (!state.consented) {
    consentStatus.textContent = "Agree to the privacy notice before searching.";
    return;
  }
  let location = locationInput.value.trim();
  if (!location) {
    locationInput.focus();
    return;
  }

  try {
    const safety = await interpretTranscript(location, state.language);
    if (safety.action === "emergency" || safety.action === "medical_advice") {
      showSafetyMessage(safety.message);
      return;
    }
    if (safety.action === "facility_search") {
      categoryInput.value = safety.category;
      location = safety.location;
      locationInput.value = location;
    }
  } catch (error) {
    voiceStatus.textContent = error.message;
    return;
  }

  const button = document.getElementById("search-button");
  button.disabled = true;
  button.textContent = state.language === "hi" ? "खोज रहे हैं…" : "Searching…";
  facilityList.replaceChildren();
  responsePanel.classList.remove("is-hidden");
    document.getElementById("assistant-message").textContent = state.language === "hi" ? "डेमो डायरेक्टरी में खोज जारी है…" : "Searching the demo directory…";

  try {
    const response = await fetch("/api/facilities/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: categoryInput.value, location, limit: 3 }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(state.language === "hi" ? "खोज पूरी नहीं हुई। फिर से कोशिश करें।" : (data.detail || "Search failed. Try again."));
    const assistantMessage = state.language === "hi" ? data.message_hi : data.message;
    const distanceBasis = state.language === "hi" ? data.distance_basis_hi : data.distance_basis;
    document.getElementById("assistant-message").textContent = assistantMessage;
    document.getElementById("distance-note").textContent = distanceBasis;
    if (!data.results.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = assistantMessage;
      facilityList.append(empty);
    } else {
      data.results.forEach((match) => facilityList.append(renderFacility(match)));
      speakResults(data.results, assistantMessage);
    }
  } catch (error) {
    document.getElementById("assistant-message").textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = state.language === "hi" ? "नज़दीकी सुविधाएँ खोजें <span aria-hidden=\"true\">→</span>" : "Find nearby facilities <span aria-hidden=\"true\">→</span>";
  }
}

function speakResults(results, intro) {
  const names = results.map((match, index) => {
    const place = state.language === "hi" ? (match.facility.name_hi || match.facility.name) : match.facility.name;
    const distance = state.language === "hi"
      ? (match.distance_km == null ? "" : `, लगभग ${match.distance_km.toFixed(1)} किलोमीटर की सीधी दूरी पर`)
      : (match.distance_label ? `, ${match.distance_label}` : "");
    return `${index + 1}. ${place}${distance}`;
  }).join(". ");
  speak(`${intro} ${names}`);
}

async function loadDemoMetadata() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) return;
    const metadata = await response.json();
    state.metadata = metadata;
    renderNotice();
  } catch {
    // Keep the explicit static warning if metadata is unavailable.
  }
}

document.getElementById("consent-button").addEventListener("click", () => {
  state.consented = true;
  consentPanel.classList.add("is-hidden");
  searchPanel.classList.remove("is-hidden");
  consentStatus.textContent = state.language === "hi"
    ? "इस पेज सत्र के लिए सहमति दी गई है। पेज रीफ़्रेश करने पर सत्र साफ़ हो जाएगा।"
    : "Consent given for this page session. Refreshing the page clears the session.";
  locationInput.focus();
  speak("नमस्ते। मैं MediNear का हिंदी वॉइस डेमो हूँ। अस्पताल, क्लिनिक, जाँच केंद्र या फार्मेसी खोजने के लिए बोलें या इलाका टाइप करें। ये नमूना रिकॉर्ड काल्पनिक हैं।");
});

document.getElementById("decline-button").addEventListener("click", () => {
  state.consented = false;
  consentStatus.textContent = state.language === "hi"
    ? "खोज या आवाज़ का डेटा नहीं भेजा गया। आप यह पेज बंद कर सकते हैं।"
    : "No search or speech data was sent. You can close this page.";
});

document.querySelectorAll(".language-option").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

document.getElementById("mic-button").addEventListener("click", startRecognition);
document.getElementById("speak-button").addEventListener("click", () => {
  const message = document.getElementById("assistant-message").textContent;
  const cards = [...facilityList.querySelectorAll("h3")].map((node) => node.textContent);
  speak(`${message}. ${cards.join(". ")}`);
});
form.addEventListener("submit", searchFacilities);
if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", updateVoiceSupport);
setLanguage("hi");
loadDemoMetadata();
