document.addEventListener("DOMContentLoaded", () => {
    const weekSlider = document.getElementById("weekSlider");
    const weekLabel = document.getElementById("weekLabel");
  
    weekSlider.addEventListener("input", () => {
      weekLabel.innerText = `Woche ${weekSlider.value}`;
    });
  
    const categories = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
    const cerealNames = ["Maize", "Sorghum", "Millet", "Groundnuts"];
  
    fetch("/api/data")
      .then(response => response.json())
      .then(data => {
        console.log("Fetched data:", data);
  
        const maize = data.filter(d => d.getreideart === "Maize");
        const sorghum = data.filter(d => d.getreideart === "Sorghum");
        const millet = data.filter(d => d.getreideart === "Millet");
        const groundnuts = data.filter(d => d.getreideart === "Groundnuts");
        
        console.log("maize array: ", maize);
        const temperatureSeries = [
          { name: "Maize", data: maize.map(d => d.temperature) },
          { name: "Sorghum", data: sorghum.map(d => d.temperature) },
          { name: "Millet", data: millet.map(d => d.temperature) },
          { name: "Groundnuts", data: groundnuts.map(d => d.temperature) }
        ];

        console.log("temp array: ", temperatureSeries);
  
        const humiditySeries = [
          { name: "Maize", data: maize.map(d => d.humidity) },
          { name: "Sorghum", data: sorghum.map(d => d.humidity) },
          { name: "Millet", data: millet.map(d => d.humidity) },
          { name: "Groundnuts", data: groundnuts.map(d => d.humidity) }
        ];
  
        const co2Series = [
          { name: "Maize", data: maize.map(d => d.co2) },
          { name: "Sorghum", data: sorghum.map(d => d.co2) },
          { name: "Millet", data: millet.map(d => d.co2) },
          { name: "Groundnuts", data: groundnuts.map(d => d.co2) }
        ];
  
        const aflatoxinSeries = [
          { name: "Maize", data: maize.map(d => d.aflatoxin) },
          { name: "Sorghum", data: sorghum.map(d => d.aflatoxin) },
          { name: "Millet", data: millet.map(d => d.aflatoxin) },
          { name: "Groundnuts", data: groundnuts.map(d => d.aflatoxin) }
        ];

      const allTemperatures = data.map(d => parseFloat(d.temperature));
      const allHumidities = data.map(d => parseFloat(d.humidity));
      const allCO2 = data.map(d => parseFloat(d.co2));
      const allAflatoxins = data.map(d => parseFloat(d.aflatoxin));
      
      const avgTemp = average(allTemperatures);
      const avgHumidity = average(allHumidities);
      const avgCO2 = average(allCO2);
      const avgAflatoxin = average(allAflatoxins);
      
      document.getElementById("avgTemp").textContent = `${avgTemp} °C`;
      document.getElementById("avgHumidity").textContent = `${avgHumidity} %`;
      document.getElementById("avgCO2").textContent = `${avgCO2} ppm`;
      document.getElementById("avgAflatoxin").textContent = `${avgAflatoxin} µg/kg`;
  
        new ApexCharts(document.querySelector("#chart1"), {
          chart: { type: "line", height: 250, background: "transparent" },
          series: temperatureSeries,
          xaxis: { categories: categories }
        }).render();
  
        new ApexCharts(document.querySelector("#chart2"), {
          chart: { type: "area", height: 250, background: "transparent" },
          series: humiditySeries,
          xaxis: { categories: categories }
        }).render();
  
        new ApexCharts(document.querySelector("#chart3"), {
          chart: { type: "bar", height: 250, background: "transparent" },
          series: co2Series,
          xaxis: { categories: categories }
        }).render();
  
        function average(arr) {
          if (arr.length === 0) return 0;
          const sum = arr.reduce((acc, val) => acc + val, 0);
          return (sum / arr.length).toFixed(2);
        }

        new ApexCharts(document.querySelector("#chart4"), {
          chart: { type: "radialBar", height: 250, background: "transparent" },
          series: [average(aflatoxinSeries[0].data),
          average(aflatoxinSeries[1].data),
          average(aflatoxinSeries[2].data),
          average(aflatoxinSeries[3].data)
        ], 
          labels: cerealNames,
          plotOptions: {
            radialBar: {
              startAngle: -90,
              endAngle: 90,
              track: {
                background: "#1e2a38",
                strokeWidth: "97%",
                margin: 5,
                dropShadow: {
                  enabled: true,
                  top: 2,
                  left: 0,
                  blur: 4,
                  opacity: 0.15
                }
              },
              dataLabels: {
                total: {
                  show: true,
                  label: 'Total',
                  formatter: () => "4 Cereals"
                }
              }
            }
          }
        }).render();
      })
      .catch(error => console.error("Error loading data:", error));
      
  
    // Leaflet Map
    const map = L.map('map').setView([0.0236, 37.9062], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
  
    L.marker([0.52, 37.45])
      .addTo(map)
      .bindPopup("Beispiel Messort")
      .openPopup();
  });
  