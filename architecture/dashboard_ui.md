# 🎨 Dashboard UI SOP (Layer 1)

## 🎯 Goal
Build a premium, high-performance pharmacy dashboard using React, Vite, and Tailwind CSS v4 with a Glassmorphism aesthetic.

## 🏗️ Structure
- **Main Layout**: Sidebar navigation + Top header + Dynamic content area.
- **Glassmorphism Base**:
  - `backdrop-blur-lg`
  - `bg-white/10` (Light mode) or `bg-black/30` (Dark mode)
  - `border-white/20`
  - `shadow-xl`

## 🧩 Components
1. **StatCard**: Displays KPIs (Revenue, Sales Count). Uses a "Pulse" animation for alerts.
2. **InventoryTable**: Glassy table showing stock levels with color-coded status (Red for low stock).
3. **BranchToggle**: Switcher between "Santa" and "Masala" branches.
4. **PredictiveActionPanel**: AI-driven suggestions (e.g., "Order 50 units of Panadol").

## 🎨 Design Tokens
- **ProBlue**: `#0c72bc` (Accents)
- **ProGreen**: `#8BC34A` (Success)
- **Typography**: Montserrat (Headings), Open Sans (Body)
