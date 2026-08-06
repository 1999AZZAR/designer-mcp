import { variantClasses } from "./components.js";

export function mapComponent(style: string): string {
  const v = variantClasses(style);
  const cardBg = style === "glass" ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl"
    : style === "neo-brutalism" ? "bg-white border-2 border-black neo-shadow rounded-none"
    : style === "neumorphism" ? "neu-surface rounded-2xl"
    : "bg-white rounded-xl shadow-sm border border-slate-200";

  return `<!-- Map Component (Powered by Leaflet/OpenStreetMap) -->
<div class="${cardBg} p-2 w-full h-96 relative flex flex-col z-0">
  <div class="flex items-center justify-between mb-2 px-2">
    <div>
      <h3 class="font-semibold text-slate-900">Location Map</h3>
      <p class="text-xs text-slate-500">Interactive OpenStreetMap render</p>
    </div>
    <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Global</span>
  </div>
  <div id="leaflet-map-container" class="w-full flex-grow rounded-lg overflow-hidden border border-slate-200 z-0"></div>
</div>

<!-- Leaflet CSS and JS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    const map = L.map('leaflet-map-container').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([51.505, -0.09]).addTo(map)
      .bindPopup('We are here.')
      .openPopup();
  });
</script>`;
}
