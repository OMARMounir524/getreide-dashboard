document.addEventListener("DOMContentLoaded", () => {
  const cerealNames = ["Maize", "Sorghum", "Millet", "Groundnuts"];
  let dataAll = [];
  let currentWeek = 1;
  let firstDate = null;
  let totalWeeks = 1;
  let currentLoc = "";

// Marker-Koordinaten definieren
const locationCoords = {
  "Location A": [ -1.301897, 36.900087 ],
  "Location B": [ -1.303044, 36.899320 ],
  "Location C":  [ -1.305786, 36.897733 ]
};

// Leaflet Map
const map = L.map("map").setView([-1.3, 36.8], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let markerRefs = {};

function updateMapMarkers() {
  Object.values(markerRefs).forEach(m => map.removeLayer(m));
  markerRefs = {};

  Object.entries(locationCoords).forEach(([loc, coords]) => {
    const label = loc.replace("Location ", "");
    const rows = dataAll.filter(d => mapLocation(d.location) === loc && getWeekNumber(d.zeitpunkt) === currentWeek);

    const avgTemp = average(rows.map(r => +r.temperatur));
const avgCO2 = average(rows.map(r => +r.co2));
const avgHum = average(rows.map(r => +r.feuchtigkeit));
const avgAfl = average(rows.map(r => +r.aflatoxin));

const popup = `
  <strong>Location ${label}</strong><br>
  Temperatur: ${avgTemp} °C<br>
  CO₂: ${avgCO2} ppm<br>
  Feuchtigkeit: ${avgHum} %<br>
  Aflatoxin: ${avgAfl} µg/kg
`;
    const marker = L.marker(coords).addTo(map).bindPopup(popup);
    markerRefs[loc] = marker;
  });
}

function average(arr) {
  const vals = arr.filter(v => !isNaN(v));
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "--";
}

function getWeekNumber(dateStr) {
  if (!firstDate) return 1;
  const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
  const diff = new Date(dateStr) - firstDate;
  return Math.floor(diff / ONE_WEEK) + 1;
}

  // Datumsauswahl
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");
  const applyBtn = document.getElementById("btn-apply-range");

  // Location Buttons
  const locButtons = document.querySelectorAll(".location-buttons button");
  locButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      locButtons.forEach(b => b.classList.toggle("active", b === btn));
      currentLoc = btn.dataset.loc;
      renderCharts();
    });
  });

  // KPI-Elemente
  const avgTempEl = document.getElementById("avgTemp");
  const avgHumidityEl = document.getElementById("avgHumidity");
  const avgCO2El = document.getElementById("avgCO2");
  const avgAflatoxinEl = document.getElementById("avgAflatoxin");

  // Charts initialisieren
  const chartTemp = new ApexCharts(document.querySelector("#chart1"), {
    chart: { type: "line", height: 240, background: "transparent" },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 4 },
    xaxis: { categories: [] },
    title: { text: "Temperatur (°C)", style: { color: "#e0e0e0" } },
    series: []
  });

  const chartHum = new ApexCharts(document.querySelector("#chart2"), {
    chart: { type: "area", height: 240, background: "transparent" },
    stroke: { curve: "smooth", width: 2 },
    fill: { opacity: 0.3 },
    markers: { size: 4 },
    xaxis: { categories: [] },
    title: { text: "Feuchtigkeit (%)", style: { color: "#e0e0e0" } },
    series: []
  });

  const chartCO2 = new ApexCharts(document.querySelector("#chart3"), {
    chart: { type: "bar", height: 240, background: "transparent" },
    plotOptions: { bar: { columnWidth: "50%" } },
    dataLabels: { enabled: true },
    xaxis: { categories: [] },
    title: { text: "CO₂ (ppm)", style: { color: "#e0e0e0" } },
    series: []
  });

  const chartAfl = new ApexCharts(document.querySelector("#chart4"), {
    chart: { type: "bar", height: 240, background: "transparent" },
  
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4
      }
    },
  
    colors: ["#00E396", "#FEB019", "#008FFB", "#FF4560"],
  
    dataLabels: {
      enabled: true,
      formatter: val => val.toFixed(1),
      style: { colors: ["#fff"] }
    },
  
    tooltip: {
      y: { formatter: val => `${val.toFixed(1)} µg/kg` }
    },
  
    xaxis: {
      categories: [],
      labels: { style: { colors: "#e0e0e0" } },
      title: { text: "Datum", style: { color: "#e0e0e0" } }
    },
  
    yaxis: {
      title: { text: "Aflatoxin (µg/kg)", style: { color: "#e0e0e0" } },
      labels: { style: { colors: "#e0e0e0" } }
    },
  
    legend: {
      show: true,
      labels: { colors: "#e0e0e0" }
    },
  
    title: { text: "Aflatoxin (µg/kg)", style: { color: "#e0e0e0" } },
  
    series: cerealNames.map(name => ({ name, data: [] }))
  });
       

  [chartTemp, chartHum, chartCO2, chartAfl].forEach(c => c.render());

  // Daten laden
  fetch("/api/data")
  .then(r => r.json())
  .then(json => {
    dataAll = json;
initDatePickers();

// frühestes Datum bestimmen
const dates = dataAll.map(d => new Date(d.zeitpunkt));
firstDate = new Date(Math.min(...dates));

// Slider-Max setzen
totalWeeks = getWeekNumber(Math.max(...dates));
const weekSlider = document.getElementById("week-slider");
weekSlider.max = totalWeeks;

renderCharts();
updateMapMarkers();
  })
    .catch(err => console.error("Fehler beim Laden der Daten:", err));

  function initDatePickers() {
    const dates = Array.from(new Set(dataAll.map(d => d.zeitpunkt.slice(0, 10)))).sort();
    if (!dates.length) return;
    startInput.value = dates[0];
    endInput.value = dates[dates.length - 1];
  }

  applyBtn.addEventListener("click", renderCharts);

  const weekLabel = document.getElementById("week-label");
weekLabel.textContent = `Woche 1 / ${totalWeeks}`;

document.getElementById("week-slider").addEventListener("input", (e) => {
  currentWeek = +e.target.value;
  weekLabel.textContent = `Woche ${currentWeek} / ${totalWeeks}`;
  updateMapMarkers();
});  
  
  function mapLocation(loc) {
    if (loc === "A") return "Location A";
    if (loc === "B") return "Location B";
    if (loc === "C") return "Location C";
    return loc;
  }

  function renderCharts() {
    const start = startInput.value;
    const end = endInput.value;
    if (!start || !end) return;

    const rows = dataAll.filter(d => {
      const date = d.zeitpunkt.slice(0, 10);
      return date >= start && date <= end && (!currentLoc || mapLocation(d.location) === currentLoc);
    });

    const dates = Array.from(new Set(rows.map(r => r.zeitpunkt.slice(0, 10)))).sort();

    const seriesTemp = cerealNames.map(name => ({
      name,
      data: dates.map(d => {
        const match = rows.find(r => r.getreideart === name && r.zeitpunkt.slice(0, 10) === d);
        return match ? +match.temperatur : null;
      })
    }));

    const seriesHum = cerealNames.map(name => ({
      name,
      data: dates.map(d => {
        const match = rows.find(r => r.getreideart === name && r.zeitpunkt.slice(0, 10) === d);
        return match ? +match.feuchtigkeit : null;
      })
    }));

    const seriesCO2 = cerealNames.map(name => ({
      name,
      data: dates.map(d => {
        const match = rows.find(r => r.getreideart === name && r.zeitpunkt.slice(0, 10) === d);
        return match ? +match.co2 : null;
      })
    }));

    const seriesAflDetailed = cerealNames.map(name => ({
      name,
      data: dates.map(d => {
        const match = rows.find(r => r.getreideart === name && r.zeitpunkt.slice(0, 10) === d);
        return match ? +match.aflatoxin : null;
      })
    }));
    
    // KPIs berechnen
    const avg = arr => {
      const vals = arr.flat().filter(v => v != null);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "--";
    };

    avgTempEl.textContent = `${avg(seriesTemp.map(s => s.data))} °C`;
    avgHumidityEl.textContent = `${avg(seriesHum.map(s => s.data))} %`;
    avgCO2El.textContent = `${avg(seriesCO2.map(s => s.data))} ppm`;
    avgAflatoxinEl.textContent = `${avg(rows.map(r => r.aflatoxin))} µg/kg`;
    document.getElementById("avgAflatoxin").textContent = `${avg(seriesAflDetailed.map(s => s.data))} µg/kg`;

    // Charts aktualisieren
    chartTemp.updateOptions({ xaxis: { categories: dates } });
    chartTemp.updateSeries(seriesTemp);

    chartHum.updateOptions({ xaxis: { categories: dates } });
    chartHum.updateSeries(seriesHum);

    chartCO2.updateOptions({ xaxis: { categories: dates } });
    chartCO2.updateSeries(seriesCO2);

    chartAfl.updateOptions({ xaxis: { categories: dates } });
chartAfl.updateSeries(seriesAflDetailed);      
  }

  // Profil & Logout
  document.getElementById("btn-logout").onclick = () => fetch("/logout", { method: "POST" }).then(() => location = "/login");
  document.getElementById("btn-profile").onclick = () => location = "/profile";
});
