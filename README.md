# SmartFlow StockSense UI

Vue frontend for the SmartFlow StockSense inventory management and AI forecasting system.

## Overview

This repository contains the frontend application of StockSense. It provides the user interface for managing products, warehouses, inventory, stock transactions, reorder alerts, and AI forecasting results.

The UI connects to two services:

- `smartflow-stocksense-backend`: Spring Boot backend for inventory business APIs.
- `smartflow-stocksense-ai`: FastAPI AI service for forecasting, clustering, drift detection, and inventory risk analysis.

## Features

- Dashboard overview
  - Total products
  - Total warehouses
  - Open reorder alerts
  - AI accuracy summary
  - Inventory movement chart
  - Low-stock / inventory risk list

- Product management
  - View products
  - Create products
  - Update products
  - Delete products
  - Show total inventory per product

- Warehouse management
  - View warehouses
  - Create warehouses
  - Update warehouses
  - Delete warehouses
  - Show total inventory per warehouse

- Inventory and stock transactions
  - View current inventory
  - View import/export transaction history
  - Record stock IN / OUT transactions
  - Update inventory after transactions

- AI forecasting page
  - Run demand forecasting for selected product and warehouse
  - Poll background forecast jobs
  - Display model competition results for Prophet, ETS, and XGBoost
  - Show sMAPE and 7/14/30-day forecasts
  - Display K-Means SKU clustering results
  - Display drift detection logs
  - Trigger forecast retraining from drift view

- Reorder alerts
  - View reorder alerts
  - Search and filter alerts
  - Resolve open alerts
  - Show forecasted stock and recommended order quantity

> Note: The login screen is currently a frontend navigation screen. The current source does not implement a real login API, JWT flow, or role-based frontend guard.

## Tech Stack

- Vue 3
- Vite
- Vuetify 3
- Pinia
- Vue Router
- Axios
- ApexCharts / vue3-apexcharts
- Material Design Icons
- Docker
- Nginx

## Repository Structure

```text
smartflow-stocksense-ui/
├─ public/
│  ├─ favicon.svg
│  └─ icons.svg
├─ src/
│  ├─ api/
│  │  └─ index.js
│  ├─ assets/
│  ├─ components/
│  ├─ layouts/
│  │  └─ MainLayout.vue
│  ├─ router/
│  │  └─ index.js
│  ├─ stores/
│  │  └─ forecast.js
│  ├─ views/
│  │  ├─ AlertsView.vue
│  │  ├─ DashboardView.vue
│  │  ├─ ForecastView.vue
│  │  ├─ InventoryView.vue
│  │  ├─ LoginView.vue
│  │  ├─ ProductsView.vue
│  │  └─ WarehousesView.vue
│  ├─ App.vue
│  ├─ main.js
│  └─ style.css
├─ Dockerfile
├─ nginx.conf
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ .gitignore
└─ README.md