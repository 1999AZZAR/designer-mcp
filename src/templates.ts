import { generateTailwindConfig } from "./tailwind-config.js";
import { buildAnimeShell } from "./anime-motion.js";

function tailwindFontFamily(style: string): string {
  const map: Record<string, string> = {
    fluent: "font-family: 'Segoe UI', system-ui, -apple-system, sans-serif",
    ant: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    carbon: "font-family: 'IBM Plex Sans', system-ui, sans-serif",
    atlassian:
      "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "apple-hig":
      "font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    polaris:
      "font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    material: "font-family: 'Roboto', system-ui, sans-serif",
    minimal: "font-family: 'Inter', system-ui, sans-serif",
    glass: "font-family: 'Inter', system-ui, sans-serif",
    neumorphism: "font-family: 'Inter', system-ui, sans-serif",
    "neo-brutalism": "font-family: 'Space Grotesk', system-ui, sans-serif",
    claymorphism: "font-family: 'Nunito', system-ui, sans-serif",
    skeuomorphism: "font-family: Georgia, 'Times New Roman', serif",
    swiss: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif",
    "swiss-archival":
      "font-family: 'IBM Plex Sans', 'Helvetica Neue', sans-serif",
    "m3-pastel": "font-family: 'Google Sans', 'Roboto', system-ui, sans-serif",
    "neo-m3": "font-family: 'Space Grotesk', system-ui, sans-serif",
  };
  return map[style] ?? map.minimal;
}

function shellStyle(style: string, palette: string): string {
  const { code } = generateTailwindConfig(style, palette);
  const fontLine = tailwindFontFamily(style);
  const animeShell = buildAnimeShell(style);
  return `<script src="https://cdn.tailwindcss.com"></script>\n<script>\n${code}\n</script>\n<style>\n  body { ${fontLine}; }\n  ${style === "glass" ? "body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }" : ""}\n  ${style === "neo-brutalism" ? ".neo-shadow { box-shadow: 4px 4px 0px rgba(0,0,0,1); }" : ""}\n  ${style === "neumorphism" ? ".neu-surface { background: #e2e8f0; box-shadow: 6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.7); }" : ""}\n  ${style === "claymorphism" ? ".clay-card { box-shadow: 4px 4px 8px rgba(0,0,0,0.10), inset 0 -4px 8px rgba(0,0,0,0.06); }" : ""}\n</style>\n${animeShell}`;
}

function dashboardTemplate(style: string, palette: string): string {
  const shell = shellStyle(style, palette);
  const { config } = generateTailwindConfig(style, palette);
  const primaryColor = config.theme.extend.colors.primary;
  const secondaryColor = config.theme.extend.colors.secondary;

  const cardClass =
    style === "neo-brutalism"
      ? "bg-white neo-shadow border-2 border-black rounded-none"
      : style === "neumorphism"
        ? "neu-surface rounded-2xl p-6"
        : style === "claymorphism"
          ? "bg-white clay-card rounded-3xl p-6"
          : style === "glass"
            ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6"
            : "bg-white rounded-xl shadow-sm border border-slate-200 p-6";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  ${shell}
</head>
<body class="${style === "glass" ? "bg-transparent text-white" : "bg-slate-50 text-slate-900"} min-h-screen">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 ${style === "glass" ? "bg-white/5 border-white/10" : "bg-white border-slate-200"} border-r p-4 hidden lg:block">
      <div class="font-bold text-lg mb-8 ${style === "glass" ? "text-white" : "text-slate-900"}">Dashboard</div>
      <nav class="space-y-1">
        <a href="#" class="block px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">Overview</a>
        <a href="#" class="block px-3 py-2 rounded-lg ${style === "glass" ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100"}">Analytics</a>
        <a href="#" class="block px-3 py-2 rounded-lg ${style === "glass" ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100"}">Customers</a>
        <a href="#" class="block px-3 py-2 rounded-lg ${style === "glass" ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100"}">Products</a>
        <a href="#" class="block px-3 py-2 rounded-lg ${style === "glass" ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100"}">Settings</a>
      </nav>
    </aside>

    <!-- Main -->
    <main class="flex-1 p-6 lg:p-8">
      <header class="mb-8" data-anime-hero>
        <h1 class="text-2xl font-bold ${style === "glass" ? "text-white" : "text-slate-900"}">Overview</h1>
        <p class="${style === "glass" ? "text-white/60" : "text-slate-500"} mt-1">Welcome back. Here's what's happening.</p>
      </header>

      <!-- KPI Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="${cardClass}" data-anime-card>
          <p class="text-sm ${style === "glass" ? "text-white/60" : "text-slate-500"} mb-1">Revenue</p>
          <p class="text-2xl font-bold ${style === "glass" ? "text-white" : "text-slate-900"}">$48,352</p>
          <p class="text-xs text-emerald-500 mt-1">+12.5% from last month</p>
        </div>
        <div class="${cardClass}" data-anime-card>
          <p class="text-sm ${style === "glass" ? "text-white/60" : "text-slate-500"} mb-1">Users</p>
          <p class="text-2xl font-bold ${style === "glass" ? "text-white" : "text-slate-900"}">2,420</p>
          <p class="text-xs text-emerald-500 mt-1">+8.2% from last month</p>
        </div>
        <div class="${cardClass}" data-anime-card>
          <p class="text-sm ${style === "glass" ? "text-white/60" : "text-slate-500"} mb-1">Orders</p>
          <p class="text-2xl font-bold ${style === "glass" ? "text-white" : "text-slate-900"}">1,210</p>
          <p class="text-xs text-rose-500 mt-1">-3.1% from last month</p>
        </div>
        <div class="${cardClass}" data-anime-card>
          <p class="text-sm ${style === "glass" ? "text-white/60" : "text-slate-500"} mb-1">Conversion</p>
          <p class="text-2xl font-bold ${style === "glass" ? "text-white" : "text-slate-900"}">3.24%</p>
          <p class="text-xs text-emerald-500 mt-1">+0.4% from last month</p>
        </div>
      </div>

      <!-- Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2 ${cardClass}">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold ${style === "glass" ? "text-white" : "text-slate-900"}">Analytics Overview</h2>
            <div class="text-xs ${style === "glass" ? "text-white/40" : "text-slate-400"}">Real-time updates</div>
          </div>
          <div id="analytics-chart" class="w-full h-64"></div>
        </div>
        <div class="${cardClass}">
          <h2 class="font-semibold ${style === "glass" ? "text-white" : "text-slate-900"} mb-4">Quick Actions</h2>
          <div class="space-y-2">
            <button class="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">New Order</button>
            <button class="w-full px-4 py-2 ${style === "glass" ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} rounded-lg text-sm font-medium transition-colors">View Reports</button>
            <button class="w-full px-4 py-2 ${style === "glass" ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} rounded-lg text-sm font-medium transition-colors">Manage Users</button>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="${cardClass}">
        <h2 class="font-semibold ${style === "glass" ? "text-white" : "text-slate-900"} mb-4">Recent Activity</h2>
        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 rounded-lg ${style === "glass" ? "bg-white/5" : "bg-slate-50"}">
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">JD</div>
            <div class="flex-1">
              <p class="text-sm font-medium ${style === "glass" ? "text-white" : "text-slate-900"}">New order #1234</p>
              <p class="text-xs ${style === "glass" ? "text-white/40" : "text-slate-500"}">2 minutes ago</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg ${style === "glass" ? "bg-white/5" : "bg-slate-50"}">
            <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm font-medium">MK</div>
            <div class="flex-1">
              <p class="text-sm font-medium ${style === "glass" ? "text-white" : "text-slate-900"}">Payment received</p>
              <p class="text-xs ${style === "glass" ? "text-white/40" : "text-slate-500"}">15 minutes ago</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg ${style === "glass" ? "bg-white/5" : "bg-slate-50"}">
            <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-medium">AL</div>
            <div class="flex-1">
              <p class="text-sm font-medium ${style === "glass" ? "text-white" : "text-slate-900"}">New user registered</p>
              <p class="text-xs ${style === "glass" ? "text-white/40" : "text-slate-500"}">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const isDark = ${style === "glass" ? "true" : "false"};
      const primaryColor = "${primaryColor}";
      const secondaryColor = "${secondaryColor}";

      const options = {
        series: [{
          name: 'Revenue',
          data: [31, 40, 28, 51, 42, 109, 100]
        }, {
          name: 'Users',
          data: [11, 32, 45, 32, 34, 52, 41]
        }],
        chart: {
          height: 250,
          type: 'area',
          toolbar: { show: false },
          background: 'transparent',
          foreColor: isDark ? '#94a3b8' : '#64748b'
        },
        colors: [primaryColor.trim(), secondaryColor.trim()],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        grid: {
          borderColor: isDark ? '#334155' : '#f1f5f9',
          strokeDashArray: 4
        },
        xaxis: {
          categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            formatter: function (val) {
              return val + "k";
            }
          }
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light'
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right'
        }
      };

      const chart = new ApexCharts(document.querySelector("#analytics-chart"), options);
      chart.render();
    });
  </script>
</body>
</html>`;
}

function marketingHeroTemplate(style: string, palette: string): string {
  const shell = shellStyle(style, palette);
  const cardClass =
    style === "neo-brutalism"
      ? "bg-white neo-shadow border-2 border-black rounded-none"
      : style === "glass"
        ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl"
        : style === "neumorphism"
          ? "neu-surface rounded-2xl"
          : "bg-white rounded-xl shadow-sm border border-slate-200";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  ${shell}
</head>
<body class="bg-white">
  <!-- Nav -->
  <nav class="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-100">
    <div class="font-bold text-xl text-slate-900">Brand</div>
    <div class="hidden md:flex items-center gap-8 text-sm text-slate-600">
      <a href="#" class="hover:text-slate-900">Features</a>
      <a href="#" class="hover:text-slate-900">Pricing</a>
      <a href="#" class="hover:text-slate-900">About</a>
      <a href="#" class="hover:text-slate-900">Blog</a>
    </div>
    <button class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Get Started</button>
  </nav>

  <!-- Hero -->
  <section class="px-6 lg:px-12 py-20 lg:py-32 max-w-5xl mx-auto text-center" data-anime-hero>
    <h1 class="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
      Build something <span class="text-primary">remarkable</span>
    </h1>
    <p class="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
      The modern platform for teams who ship fast. From idea to production in minutes, not months.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Start Free Trial</button>
      <button class="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">View Demo</button>
    </div>
  </section>

  <!-- Features -->
  <section class="px-6 lg:px-12 py-20 bg-slate-50">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-slate-900 mb-12">Everything you need</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="${cardClass} p-6" data-anime-card>
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-2">Lightning Fast</h3>
          <p class="text-sm text-slate-500">Optimized for speed at every layer. Sub-100ms response times guaranteed.</p>
        </div>
        <div class="${cardClass} p-6" data-anime-card>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-2">Secure by Default</h3>
          <p class="text-sm text-slate-500">Enterprise-grade security with end-to-end encryption and SOC 2 compliance.</p>
        </div>
        <div class="${cardClass} p-6" data-anime-card>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-2">Modular System</h3>
          <p class="text-sm text-slate-500">Plug-and-play components that scale with your architecture.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="px-6 lg:px-12 py-20 max-w-5xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
    <p class="text-slate-500 mb-8">Join thousands of teams building the future.</p>
    <button class="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Start Free Trial</button>
  </section>

  <!-- Footer -->
  <footer class="px-6 lg:px-12 py-8 border-t border-slate-100 text-center text-sm text-slate-400">
    &copy; 2025 Brand. All rights reserved.
  </footer>
</body>
</html>`;
}

function settingsTemplate(style: string, palette: string): string {
  const shell = shellStyle(style, palette);
  const inputClass =
    style === "neo-brutalism"
      ? "w-full px-3 py-2 border-2 border-black rounded-none text-sm bg-white"
      : style === "glass"
        ? "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-900 placeholder-slate-400"
        : "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings</title>
  ${shell}
</head>
<body class="bg-slate-50 min-h-screen">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 p-4 hidden lg:block">
      <div class="font-bold text-lg mb-8 text-slate-900">Settings</div>
      <nav class="space-y-1">
        <a href="#" class="block px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">General</a>
        <a href="#" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Security</a>
        <a href="#" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Notifications</a>
        <a href="#" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Billing</a>
        <a href="#" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Team</a>
      </nav>
    </aside>

    <!-- Main -->
    <main class="flex-1 p-6 lg:p-8 max-w-3xl">
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">General Settings</h1>
        <p class="text-slate-500 mt-1">Manage your account preferences.</p>
      </header>

      <form class="space-y-8">
        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="font-semibold text-slate-900 mb-4">Profile</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" class="${inputClass}" placeholder="John" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" class="${inputClass}" placeholder="Doe" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" class="${inputClass}" placeholder="john@example.com" />
            </div>
          </div>
        </section>

        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="font-semibold text-slate-900 mb-4">Notifications</h2>
          <div class="space-y-3" data-anime-list>
            <label class="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span class="text-sm text-slate-700">Email notifications</span>
              <div class="w-10 h-6 bg-primary rounded-full relative cursor-pointer"><div class="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
            </label>
            <label class="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span class="text-sm text-slate-700">Push notifications</span>
              <div class="w-10 h-6 bg-slate-300 rounded-full relative cursor-pointer"><div class="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div></div>
            </label>
            <label class="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span class="text-sm text-slate-700">Weekly digest</span>
              <div class="w-10 h-6 bg-primary rounded-full relative cursor-pointer"><div class="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
            </label>
          </div>
        </section>

        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">Save Changes</button>
        </div>
      </form>
    </main>
  </div>
</body>
</html>`;
}

function tableDetailTemplate(style: string, palette: string): string {
  const shell = shellStyle(style, palette);
  const cellClass =
    style === "neo-brutalism"
      ? "px-4 py-3 text-sm border-b-2 border-black"
      : "px-4 py-3 text-sm border-b border-slate-100";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Table Detail</title>
  ${shell}
</head>
<body class="bg-slate-50 min-h-screen p-6 lg:p-8">
  <div class="max-w-6xl mx-auto">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Users</h1>
        <p class="text-slate-500 mt-1">Manage your team members and their roles.</p>
      </div>
      <button class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Add User</button>
    </header>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
      <input type="text" placeholder="Search users..." class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
      <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600">
        <option>All Roles</option><option>Admin</option><option>Editor</option><option>Viewer</option>
      </select>
      <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600">
        <option>All Status</option><option>Active</option><option>Inactive</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover:bg-slate-50 cursor-pointer">
            <td class="${cellClass}"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">JD</div><span class="font-medium text-slate-900">John Doe</span></div></td>
            <td class="${cellClass} text-slate-600">Admin</td>
            <td class="${cellClass}"><span class="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Active</span></td>
            <td class="${cellClass} text-slate-500">2 min ago</td>
            <td class="${cellClass} text-right"><button class="text-slate-400 hover:text-slate-600">...</button></td>
          </tr>
          <tr class="hover:bg-slate-50 cursor-pointer">
            <td class="${cellClass}"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-sm font-medium">MK</div><span class="font-medium text-slate-900">Mary Kim</span></div></td>
            <td class="${cellClass} text-slate-600">Editor</td>
            <td class="${cellClass}"><span class="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Active</span></td>
            <td class="${cellClass} text-slate-500">1 hour ago</td>
            <td class="${cellClass} text-right"><button class="text-slate-400 hover:text-slate-600">...</button></td>
          </tr>
          <tr class="hover:bg-slate-50 cursor-pointer">
            <td class="${cellClass}"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-medium">AL</div><span class="font-medium text-slate-900">Alex Lee</span></div></td>
            <td class="${cellClass} text-slate-600">Viewer</td>
            <td class="${cellClass}"><span class="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Inactive</span></td>
            <td class="${cellClass} text-slate-500">3 days ago</td>
            <td class="${cellClass} text-right"><button class="text-slate-400 hover:text-slate-600">...</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

function editorialLandingTemplate(style: string, palette: string): string {
  const shell = shellStyle(style, palette);
  const isMinimal = style === "minimal" || style === "swiss";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editorial</title>
  ${shell}
</head>
<body class="bg-white">
  <nav class="px-6 lg:px-12 py-6 flex items-center justify-between">
    <div class="font-bold text-xl text-slate-900">Journal</div>
    <div class="hidden md:flex gap-8 text-sm text-slate-600">
      <a href="#" class="hover:text-slate-900">Stories</a>
      <a href="#" class="hover:text-slate-900">Essays</a>
      <a href="#" class="hover:text-slate-900">Archive</a>
    </div>
  </nav>

  <article class="max-w-3xl mx-auto px-6 lg:px-12 py-16">
    <div class="mb-8">
      <span class="text-sm text-primary font-medium tracking-wide uppercase">Design Systems</span>
    </div>
    <h1 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
      The quiet art of building interfaces that last
    </h1>
    <div class="flex items-center gap-4 text-sm text-slate-500 mb-12">
      <span>By Author Name</span>
      <span>&middot;</span>
      <span>January 2025</span>
      <span>&middot;</span>
      <span>8 min read</span>
    </div>

    <div class="prose prose-slate max-w-none">
      <p class="text-lg text-slate-600 leading-relaxed mb-8">
        Good design systems are not built in a day. They emerge from consistent decisions made over months and years, each one reinforcing a shared language between designers and engineers.
      </p>

      <h2 class="text-2xl font-bold text-slate-900 mt-12 mb-4">The Foundation</h2>
      <p class="text-slate-600 leading-relaxed mb-8">
        Every strong design system begins with constraints. Not the kind that limit creativity, but the kind that channel it. A spacing scale, a type ramp, a color palette — these are not restrictions. They are the grammar that makes the language possible.
      </p>

      <blockquote class="border-l-4 border-primary pl-6 my-8 italic text-slate-600">
        "The details are not the details. They make the design."
        <cite class="block text-sm text-slate-400 mt-2 not-italic">— Charles Eames</cite>
      </blockquote>

      <h2 class="text-2xl font-bold text-slate-900 mt-12 mb-4">Building Consistency</h2>
      <p class="text-slate-600 leading-relaxed mb-8">
        Consistency is not about making everything look the same. It is about making everything feel like it belongs together. A button, a card, a navigation element — each should carry the same DNA without losing its individual purpose.
      </p>

      <div class="grid grid-cols-2 gap-6 my-12">
        <div class="bg-slate-50 rounded-xl p-6">
          <h3 class="font-semibold text-slate-900 mb-2">Tokens</h3>
          <p class="text-sm text-slate-500">The atomic values that define your visual language.</p>
        </div>
        <div class="bg-slate-50 rounded-xl p-6">
          <h3 class="font-semibold text-slate-900 mb-2">Components</h3>
          <p class="text-sm text-slate-500">Composable patterns built from tokens.</p>
        </div>
      </div>
    </div>
  </article>

  <footer class="px-6 lg:px-12 py-8 border-t border-slate-100 text-center text-sm text-slate-400">
    &copy; 2025 Journal. All rights reserved.
  </footer>
</body>
</html>`;
}

export function generateTemplate(
  style: string,
  palette: string,
  archetype: string,
): string {
  switch (archetype) {
    case "dashboard":
      return dashboardTemplate(style, palette);
    case "marketing-hero":
      return marketingHeroTemplate(style, palette);
    case "settings":
      return settingsTemplate(style, palette);
    case "table-detail":
      return tableDetailTemplate(style, palette);
    case "editorial-landing":
      return editorialLandingTemplate(style, palette);
    default:
      return marketingHeroTemplate(style, palette);
  }
}
