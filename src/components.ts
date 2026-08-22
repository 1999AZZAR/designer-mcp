import { mapComponent } from "./map-component.js";

export type ComponentType =
  | "button" | "card" | "navbar" | "hero" | "form-input"
  | "badge" | "modal" | "sidebar" | "table" | "footer" | "chart" | "map";

export type OutputFramework = 'html' | 'react' | 'vue';
export const OUTPUT_FRAMEWORKS: OutputFramework[] = ['html', 'react', 'vue'];

export const COMPONENT_TYPES: ComponentType[] = [
  "button", "card", "navbar", "hero", "form-input",
  "badge", "modal", "sidebar", "table", "footer", "chart", "map",
];

export function variantClasses(style: string): Record<string, string> {
  const base: Record<string, Record<string, string>> = {
    "neo-brutalism": {
      btnPrimary: "bg-primary text-white px-4 py-2 font-semibold border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all",
      btnSecondary: "bg-white text-slate-900 px-4 py-2 font-semibold border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all",
      btnOutline: "bg-transparent text-slate-900 px-4 py-2 font-semibold border-2 border-black hover:bg-slate-100 transition-colors",
      btnGhost: "bg-transparent text-slate-900 px-4 py-2 font-semibold hover:bg-slate-100 transition-colors",
      card: "bg-white border-2 border-black neo-shadow p-6",
      input: "w-full px-3 py-2 border-2 border-black rounded-none text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none",
      badge: "px-2 py-1 text-xs font-bold border border-black",
    },
    glass: {
      btnPrimary: "bg-white/20 backdrop-blur-md text-white px-4 py-2 font-medium border border-white/30 rounded-lg hover:bg-white/30 transition-all",
      btnSecondary: "bg-white/10 backdrop-blur-md text-white px-4 py-2 font-medium border border-white/20 rounded-lg hover:bg-white/20 transition-all",
      btnOutline: "bg-transparent text-white px-4 py-2 font-medium border border-white/30 rounded-lg hover:bg-white/10 transition-all",
      btnGhost: "bg-transparent text-white/80 px-4 py-2 font-medium hover:text-white hover:bg-white/10 transition-all",
      card: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6",
      input: "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 outline-none",
      badge: "px-2 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full",
    },
    neumorphism: {
      btnPrimary: "bg-primary text-white px-4 py-2 font-medium rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-2px_-2px_4px_rgba(255,255,255,0.7)] transition-shadow",
      btnSecondary: "bg-slate-200 text-slate-700 px-4 py-2 font-medium rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-2px_-2px_4px_rgba(255,255,255,0.7)] transition-shadow",
      btnOutline: "bg-transparent text-slate-600 px-4 py-2 font-medium rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]",
      btnGhost: "bg-transparent text-slate-600 px-4 py-2 font-medium hover:bg-slate-100 transition-colors",
      card: "neu-surface rounded-2xl p-6",
      input: "w-full px-3 py-2 bg-slate-100 rounded-xl text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] focus:ring-2 focus:ring-primary outline-none",
      badge: "px-2 py-1 text-xs font-medium rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]",
    },
    claymorphism: {
      btnPrimary: "bg-primary text-white px-4 py-2 font-semibold rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.10),inset_0_-4px_8px_rgba(0,0,0,0.06)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.10),inset_0,-2px,4px,rgba(0,0,0,0.06)] transition-shadow",
      btnSecondary: "bg-white text-slate-700 px-4 py-2 font-semibold rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.10),inset_0,-4px,8px,rgba(0,0,0,0.06)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.10),inset_0,-2px,4px,rgba(0,0,0,0.06)] transition-shadow",
      btnOutline: "bg-transparent text-slate-600 px-4 py-2 font-semibold rounded-2xl border-2 border-slate-200",
      btnGhost: "bg-transparent text-slate-600 px-4 py-2 font-semibold rounded-xl hover:bg-slate-100 transition-colors",
      card: "bg-white clay-card rounded-3xl p-6",
      input: "w-full px-3 py-2 bg-slate-50 rounded-2xl text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px,-2px,4px,rgba(255,255,255,0.8)] focus:ring-2 focus:ring-primary outline-none",
      badge: "px-2 py-1 text-xs font-semibold rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.08)]",
    },
  };

  const defaults: Record<string, string> = {
    btnPrimary: "bg-primary text-white px-4 py-2 font-medium rounded-lg hover:opacity-90 transition-opacity",
    btnSecondary: "bg-slate-100 text-slate-700 px-4 py-2 font-medium rounded-lg hover:bg-slate-200 transition-colors",
    btnOutline: "bg-transparent text-slate-700 px-4 py-2 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors",
    btnGhost: "bg-transparent text-slate-600 px-4 py-2 font-medium rounded-lg hover:bg-slate-100 transition-colors",
    card: "bg-white rounded-xl shadow-sm border border-slate-200 p-6",
    input: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none",
    badge: "px-2 py-1 text-xs font-medium rounded-full",
  };

  return base[style] ?? defaults;
}

function buttonComponent(style: string): string {
  const v = variantClasses(style);
  return `<!-- Button Component -->
<div class="flex flex-wrap gap-3 items-center">
  <button class="${v.btnPrimary}">Primary</button>
  <button class="${v.btnSecondary}">Secondary</button>
  <button class="${v.btnOutline}">Outline</button>
  <button class="${v.btnGhost}">Ghost</button>
  <button class="${v.btnPrimary} opacity-50 cursor-not-allowed" disabled>Disabled</button>
</div>`;
}

function cardComponent(style: string): string {
  const v = variantClasses(style);
  return `<!-- Card Component -->
<div class="${v.card} max-w-sm">
  <h3 class="font-semibold text-slate-900 mb-2">Card Title</h3>
  <p class="text-sm text-slate-500 mb-4">This is a card component with a title, description, and action button.</p>
  <button class="${v.btnPrimary} text-sm">Learn More</button>
</div>`;
}

function navbarComponent(style: string): string {
  const v = variantClasses(style);
  const bg = style === "glass" ? "bg-black/20 backdrop-blur-xl border-b border-white/10" : "bg-white border-b border-slate-200";
  const logo = style === "glass" ? "text-white font-bold text-xl" : "font-bold text-xl text-slate-900";
  const link = style === "glass" ? "text-white/70 hover:text-white text-sm" : "text-slate-600 hover:text-slate-900 text-sm";

  return `<!-- Navbar Component -->
<nav class="px-6 py-4 ${bg}">
  <div class="max-w-6xl mx-auto flex items-center justify-between">
    <div class="${logo}">Brand</div>
    <div class="hidden md:flex items-center gap-6">
      <a href="#" class="${link}">Home</a>
      <a href="#" class="${link}">Features</a>
      <a href="#" class="${link}">Pricing</a>
      <a href="#" class="${link}">About</a>
    </div>
    <button class="${v.btnPrimary} text-sm">Get Started</button>
  </div>
</nav>`;
}

function heroComponent(style: string): string {
  const v = variantClasses(style);
  const heading = style === "glass" ? "text-white" : "text-slate-900";
  const sub = style === "glass" ? "text-white/60" : "text-slate-500";

  return `<!-- Hero Component -->
<section class="py-20 text-center">
  <h1 class="text-4xl lg:text-5xl font-bold ${heading} mb-4">Build something great</h1>
  <p class="text-lg ${sub} max-w-xl mx-auto mb-8">Ship faster with a design system that scales. From prototype to production in minutes.</p>
  <div class="flex justify-center gap-4">
    <button class="${v.btnPrimary}">Get Started</button>
    <button class="${v.btnOutline}">Documentation</button>
  </div>
</section>`;
}

function formInputComponent(style: string): string {
  const v = variantClasses(style);
  return `<!-- Form Input Component -->
<div class="space-y-4 max-w-sm">
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
    <input type="email" class="${v.input}" placeholder="you@example.com" />
    <p class="text-xs text-slate-400 mt-1">We'll never share your email.</p>
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
    <input type="password" class="${v.input}" placeholder="••••••••" />
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1">Username (error state)</label>
    <input type="text" class="${v.input} border-red-500 focus:ring-red-500" value="ab" />
    <p class="text-xs text-red-500 mt-1">Username must be at least 3 characters.</p>
  </div>
</div>`;
}

function badgeComponent(style: string): string {
  const v = variantClasses(style);
  const colors = style === "glass"
    ? { success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", warning: "bg-amber-500/20 text-amber-300 border-amber-500/30", error: "bg-red-500/20 text-red-300 border-red-500/30", info: "bg-blue-500/20 text-blue-300 border-blue-500/30" }
    : { success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", error: "bg-red-50 text-red-700", info: "bg-blue-50 text-blue-700" };

  return `<!-- Badge Component -->
<div class="flex flex-wrap gap-2">
  <span class="${v.badge} ${colors.success}">Success</span>
  <span class="${v.badge} ${colors.warning}">Warning</span>
  <span class="${v.badge} ${colors.error}">Error</span>
  <span class="${v.badge} ${colors.info}">Info</span>
</div>`;
}

function modalComponent(style: string): string {
  const v = variantClasses(style);
  const overlay = style === "glass" ? "bg-black/60 backdrop-blur-sm" : "bg-black/50";
  const panel = style === "glass"
    ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
    : style === "neo-brutalism"
    ? "bg-white border-2 border-black neo-shadow rounded-none p-6"
    : "bg-white rounded-xl shadow-xl p-6";

  return `<!-- Modal Component -->
<div class="fixed inset-0 ${overlay} flex items-center justify-center p-4">
  <div class="${panel} max-w-md w-full">
    <h2 class="text-lg font-semibold text-slate-900 mb-2">Confirm Action</h2>
    <p class="text-sm text-slate-500 mb-6">Are you sure you want to proceed? This action cannot be undone.</p>
    <div class="flex justify-end gap-3">
      <button class="${v.btnGhost} text-sm">Cancel</button>
      <button class="${v.btnPrimary} text-sm">Confirm</button>
    </div>
  </div>
</div>`;
}

function sidebarComponent(style: string): string {
  const v = variantClasses(style);
  const bg = style === "glass" ? "bg-white/5 backdrop-blur-xl border-r border-white/10" : "bg-white border-r border-slate-200";
  const link = style === "glass" ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  const active = style === "glass" ? "text-white bg-white/15" : "text-primary bg-primary/10";

  return `<!-- Sidebar Component -->
<aside class="w-64 ${bg} p-4 h-screen">
  <div class="${style === 'glass' ? 'text-white' : 'text-slate-900'} font-bold text-lg mb-6">Menu</div>
  <nav class="space-y-1">
    <a href="#" class="block px-3 py-2 rounded-lg ${active} font-medium text-sm">Dashboard</a>
    <a href="#" class="block px-3 py-2 rounded-lg ${link} text-sm">Analytics</a>
    <a href="#" class="block px-3 py-2 rounded-lg ${link} text-sm">Customers</a>
    <a href="#" class="block px-3 py-2 rounded-lg ${link} text-sm">Products</a>
    <a href="#" class="block px-3 py-2 rounded-lg ${link} text-sm">Settings</a>
  </nav>
</aside>`;
}

function tableComponent(style: string): string {
  const headerBg = style === "glass" ? "bg-white/5" : "bg-slate-50";
  const border = style === "neo-brutalism" ? "border-b-2 border-black" : "border-b border-slate-100";
  const cellPad = "px-4 py-3 text-sm";

  return `<!-- Table Component -->
<div class="${style === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20' : 'bg-white border border-slate-200'} rounded-xl overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="${headerBg} ${border}">
        <th class="${cellPad} text-left text-xs font-medium text-slate-500 uppercase">Name</th>
        <th class="${cellPad} text-left text-xs font-medium text-slate-500 uppercase">Status</th>
        <th class="${cellPad} text-left text-xs font-medium text-slate-500 uppercase">Role</th>
        <th class="${cellPad} text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr class="${border} hover:bg-slate-50">
        <td class="${cellPad} font-medium text-slate-900">John Doe</td>
        <td class="${cellPad}"><span class="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Active</span></td>
        <td class="${cellPad} text-slate-600">Admin</td>
        <td class="${cellPad} text-right"><button class="text-slate-400 hover:text-slate-600">Edit</button></td>
      </tr>
      <tr class="${border} hover:bg-slate-50">
        <td class="${cellPad} font-medium text-slate-900">Mary Kim</td>
        <td class="${cellPad}"><span class="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Active</span></td>
        <td class="${cellPad} text-slate-600">Editor</td>
        <td class="${cellPad} text-right"><button class="text-slate-400 hover:text-slate-600">Edit</button></td>
      </tr>
      <tr class="hover:bg-slate-50">
        <td class="${cellPad} font-medium text-slate-900">Alex Lee</td>
        <td class="${cellPad}"><span class="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Inactive</span></td>
        <td class="${cellPad} text-slate-600">Viewer</td>
        <td class="${cellPad} text-right"><button class="text-slate-400 hover:text-slate-600">Edit</button></td>
      </tr>
    </tbody>
  </table>
</div>`;
}

function footerComponent(style: string): string {
  const bg = style === "glass" ? "bg-black/30 backdrop-blur-xl border-t border-white/10" : "bg-slate-900";
  const text = style === "glass" ? "text-white/40" : "text-slate-400";
  const heading = style === "glass" ? "text-white" : "text-white";
  const link = style === "glass" ? "text-white/50 hover:text-white" : "text-slate-400 hover:text-white";

  return `<!-- Footer Component -->
<footer class="${bg} py-12 px-6">
  <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
    <div>
      <h4 class="${heading} font-semibold mb-4">Product</h4>
      <ul class="space-y-2"><li><a href="#" class="${link} text-sm">Features</a></li><li><a href="#" class="${link} text-sm">Pricing</a></li><li><a href="#" class="${link} text-sm">Changelog</a></li></ul>
    </div>
    <div>
      <h4 class="${heading} font-semibold mb-4">Company</h4>
      <ul class="space-y-2"><li><a href="#" class="${link} text-sm">About</a></li><li><a href="#" class="${link} text-sm">Blog</a></li><li><a href="#" class="${link} text-sm">Careers</a></li></ul>
    </div>
    <div>
      <h4 class="${heading} font-semibold mb-4">Resources</h4>
      <ul class="space-y-2"><li><a href="#" class="${link} text-sm">Documentation</a></li><li><a href="#" class="${link} text-sm">Guides</a></li><li><a href="#" class="${link} text-sm">Support</a></li></ul>
    </div>
    <div>
      <h4 class="${heading} font-semibold mb-4">Legal</h4>
      <ul class="space-y-2"><li><a href="#" class="${link} text-sm">Privacy</a></li><li><a href="#" class="${link} text-sm">Terms</a></li><li><a href="#" class="${link} text-sm">Security</a></li></ul>
    </div>
  </div>
  <div class="max-w-6xl mx-auto mt-8 pt-8 border-t ${style === 'glass' ? 'border-white/10' : 'border-slate-800'} text-center ${text} text-sm">
    &copy; 2025 Brand. All rights reserved.
  </div>
</footer>`;
}

function chartComponent(style: string): string {
  const v = variantClasses(style);
  const cardBg = style === "glass" ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl"
    : style === "neo-brutalism" ? "bg-white border-2 border-black neo-shadow rounded-none"
    : style === "neumorphism" ? "neu-surface rounded-2xl"
    : "bg-white rounded-xl shadow-sm border border-slate-200";

  return `<!-- Chart Component (Powered by ApexCharts) -->
<div class="${cardBg} p-6 max-w-xl w-full">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="font-semibold text-slate-900">Performance Metrics</h3>
      <p class="text-xs text-slate-400">Activity and conversion over time</p>
    </div>
    <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Live</span>
  </div>
  <div id="apex-performance-chart" class="w-full h-64"></div>
</div>

<!-- Add this script to load ApexCharts and initialize -->
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    const isDark = ${style === "glass" ? "true" : "false"};
    let primaryColor = '#3b82f6';
    let secondaryColor = '#10b981';
    
    if (window.tailwind && window.tailwind.config && window.tailwind.config.theme) {
      const extendColors = window.tailwind.config.theme.extend && window.tailwind.config.theme.extend.colors;
      if (extendColors) {
        primaryColor = extendColors.primary || primaryColor;
        secondaryColor = extendColors.secondary || secondaryColor;
      }
    }

    const options = {
      series: [{
        name: 'Conversions',
        data: [44, 55, 41, 67, 22, 43, 21]
      }, {
        name: 'Engagement',
        data: [13, 23, 20, 8, 13, 27, 33]
      }],
      chart: {
        type: 'bar',
        height: 250,
        stacked: true,
        toolbar: { show: false },
        background: 'transparent',
        foreColor: isDark ? '#94a3b8' : '#64748b'
      },
      colors: [primaryColor.trim(), secondaryColor.trim()],
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: ${style === "neo-brutalism" ? "0" : "4"},
        },
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      grid: {
        borderColor: isDark ? '#334155' : '#f1f5f9',
        strokeDashArray: 4
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
      },
      fill: {
        opacity: 0.95
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light'
      }
    };

    const chart = new ApexCharts(document.querySelector("#apex-performance-chart"), options);
    chart.render();
  });
</script>`;
}
// ---------------------------------------------------------------------------
// Framework helpers
// ---------------------------------------------------------------------------

/**
 * Convert an HTML string to JSX-compatible syntax:
 * - Rename HTML attributes to their JSX equivalents
 * - Self-close void elements
 * - Convert HTML comments to JSX expression comments
 */
export function htmlToJSX(html: string): string {
  return html
    // Attribute renames (order matters — longest/most-specific first)
    .replace(/\bautocomplete=/g, 'autoComplete=')
    .replace(/\bmaxlength=/g, 'maxLength=')
    .replace(/\btabindex=/g, 'tabIndex=')
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/\breadonly\b/g, 'readOnly')
    // Self-close void elements that are not already self-closed
    .replace(/<(input|img|br|hr|meta|link)(\b[^>]*?)(?<!\/)>/g, '<$1$2 />')
    // HTML comments → JSX expression comments
    .replace(/<!--(.*?)-->/gs, '{/* $1*/}');
}

/** Capitalise first character of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Per-component prop interface bodies for React wrappers. */
const REACT_PROP_INTERFACES: Record<string, string> = {
  Button: `  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;`,
  Card: `  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;`,
  Navbar: `  className?: string;
  brand?: string;
  links?: Array<{ label: string; href: string }>;
  ctaLabel?: string;`,
  Hero: `  className?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  secondaryLabel?: string;`,
  FormInput: `  className?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  type?: string;`,
  Badge: `  className?: string;
  label?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';`,
  Modal: `  className?: string;
  title?: string;
  description?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;`,
  Sidebar: `  className?: string;
  activeItem?: string;
  items?: string[];`,
  Table: `  className?: string;`,
  Footer: `  className?: string;`,
  Chart: `  className?: string;`,
  Map: `  className?: string;`,
};

/** Per-component Vue prop definitions for SFC wrappers. */
const VUE_PROP_DEFS: Record<string, { props: string; defaults: string }> = {
  Button: {
    props: `  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;`,
    defaults: `className: '',
    variant: 'primary',
    disabled: false`,
  },
  Card: {
    props: `  className?: string;
  title?: string;
  description?: string;`,
    defaults: `className: '',
    title: 'Card Title',
    description: ''`,
  },
  Navbar: {
    props: `  className?: string;
  brand?: string;
  ctaLabel?: string;`,
    defaults: `className: '',
    brand: 'Brand',
    ctaLabel: 'Get Started'`,
  },
  Hero: {
    props: `  className?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  secondaryLabel?: string;`,
    defaults: `className: '',
    heading: 'Build something great',
    subheading: 'Ship faster with a design system that scales.',
    ctaLabel: 'Get Started',
    secondaryLabel: 'Documentation'`,
  },
  FormInput: {
    props: `  className?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  type?: string;`,
    defaults: `className: '',
    label: '',
    placeholder: '',
    error: '',
    type: 'text'`,
  },
  Badge: {
    props: `  className?: string;
  label?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';`,
    defaults: `className: '',
    label: 'Badge',
    variant: 'info'`,
  },
  Modal: {
    props: `  className?: string;
  title?: string;
  description?: string;
  isOpen?: boolean;`,
    defaults: `className: '',
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    isOpen: true`,
  },
  Sidebar: {
    props: `  className?: string;
  activeItem?: string;
  items?: string[];`,
    defaults: `className: '',
    activeItem: 'Dashboard',
    items: () => ['Dashboard', 'Analytics', 'Customers', 'Products', 'Settings']`,
  },
  Table: { props: `  className?: string;`, defaults: `className: ''` },
  Footer: { props: `  className?: string;`, defaults: `className: ''` },
  Chart: { props: `  className?: string;`, defaults: `className: ''` },
  Map: { props: `  className?: string;`, defaults: `className: ''` },
};

/**
 * Wrap JSX markup in a full React functional component with typed props.
 * Injects motion.dev if applicable.
 */
export function wrapReact(componentName: string, jsx: string, style?: string): string {
  const propsBody = REACT_PROP_INTERFACES[componentName] ??
    `  className?: string;`;

  // Inject motion.dev physics if style is provided
  let finalJsx = jsx;
  let imports = `import React from 'react';\nimport { motion } from 'motion/react';`;
  
  if (style) {
    const scaleHover = style === "claymorphism" || style === "m3-pastel" ? 1.06 : 1.03;
    const pushTap = style === "neo-brutalism" ? "y: 2, x: 2" : "scale: 0.97";
    
    // Replace <button with <motion.button
    finalJsx = finalJsx.replace(/<button\b/g, `<motion.button whileHover={{ scale: ${scaleHover} }} whileTap={{ ${pushTap} }}`);
    finalJsx = finalJsx.replace(/<\/button>/g, `</motion.button>`);
    
    // For Card, replace the outer div with motion.div
    if (componentName === "Card") {
      finalJsx = finalJsx.replace(/<div\b/, `<motion.div whileHover={{ y: -4 }}`);
      finalJsx = finalJsx.replace(/<\/div>$/, `</motion.div>`);
    }
  }

  // Indent every line of the JSX by 6 spaces (inside the return fragment)
  const indentedJsx = finalJsx
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');

  return `${imports}

interface ${componentName}Props {
${propsBody}
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <>
${indentedJsx}
    </>
  );
};

export default ${componentName};
`;
}

/**
 * Wrap HTML markup in a Vue 3 SFC with typed props and Tailwind style note.
 */
export function wrapVue(componentName: string, html: string, style?: string): string {
  const vueDef = VUE_PROP_DEFS[componentName] ?? {
    props: `  className?: string;`,
    defaults: `className: ''`,
  };

  // For Vue, we could inject @vueuse/motion or vanilla motion. 
  // We'll leave the HTML mostly as is but you could add v-motion directives here.

  return `<template>
${html}
</template>

<script setup lang="ts">
interface Props {
${vueDef.props}
}
const props = withDefaults(defineProps<Props>(), {
  ${vueDef.defaults},
});
</script>

<style scoped>
/* Style note: uses Tailwind CSS classes */
</style>
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getComponent(
  type: ComponentType,
  style: string,
  framework: OutputFramework = 'html'
): string {
  let html: string;
  switch (type) {
    case "button":     html = buttonComponent(style);    break;
    case "card":       html = cardComponent(style);      break;
    case "navbar":     html = navbarComponent(style);    break;
    case "hero":       html = heroComponent(style);      break;
    case "form-input": html = formInputComponent(style); break;
    case "badge":      html = badgeComponent(style);     break;
    case "modal":      html = modalComponent(style);     break;
    case "sidebar":    html = sidebarComponent(style);   break;
    case "table":      html = tableComponent(style);     break;
    case "footer":     html = footerComponent(style);    break;
    case "chart":      html = chartComponent(style);     break;
    case "map":        html = mapComponent(style);       break;
    default:           html = `<!-- Unknown component: ${type} -->`;
  }

  if (framework === 'html') return html;

  // Derive a PascalCase component name from the type (e.g. "form-input" → "FormInput")
  const name = type
    .split('-')
    .map(capitalize)
    .join('');

  if (framework === 'react') return wrapReact(name, htmlToJSX(html), style);
  if (framework === 'vue')   return wrapVue(name, html, style);

  return html;
}
