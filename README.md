# 🌍 Global Explorer & Planner

**Dashboard voyageur** — SPA en **HTML5 / CSS3 / JavaScript ES6+ (Vanilla-js)**, sans framework ni build.

> 🔗 **Démo :** _à compléter après déploiement_ · **Code :** _lien du dépôt_

![Aperçu](assets/cover.jpg)

---

## ✨ Ce que ça fait

- ✈️ **Voyages** — CRUD complet, drapeaux auto, checklists dépliables, drag & drop entre voyages
- 🗺️ **Carte interactive** — Leaflet + OpenStreetMap, marqueurs et itinéraires
- 🌍 **Recherche de pays** — API temps réel, météo et heure locale
- 🧳 **Checklist par voyage** — modèle par défaut, copie, progression live
- 💰 **Planificateur** — durée, budget, **conversion en devise locale**
- 🎯 **Quiz destination** — POO, 4 profils personnalisés
- 📊 **Statistiques** — agrégations, répartition, top 3
- ⌘ **Command Palette** — navigation et actions au clavier
- 🌓 **Thème clair/sombre** + générateur de couleurs d'accent
- 💾 **Export / Import JSON** — sauvegarde complète

---

## 🛠️ Stack technique

|                     |                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **Front**           | HTML5 sémantique · CSS3 (Grid, Flexbox, custom properties) · JavaScript ES6+ (modules natifs) |
| **DOM**             | 100 % DOM API (`createElement`, `textContent`) — **aucun `innerHTML`**                        |
| **APIs navigateur** | `<dialog>`, `localStorage`, `Notification`, `Clipboard`, Service Worker                       |
| **APIs externes**   | SampleAPIs · Open-Meteo · open.er-api.com · flagcdn · OpenStreetMap + Leaflet                 |

---

## 🏗️ Architecture

- **Modules ES natifs** — un fichier par fonctionnalité, init depuis `main.js`
- **Séparation logique / UI** — `planner.js` (fonctions pures) vs `trips.js` (DOM)
- **Utilitaires centralisés** — `utils.js` (évite les imports circulaires)
- **Persistance** — `storage.js` wrappe `localStorage`
- **CSS en couches** — tokens → reset → layout → composants → responsive
- **Mobile-first**, thème via `data-theme`

## Structure du projet

```
global-explorer-planner/
├── index.html
├── README.md
├── LICENSE
├── manifest.json
├── sw.js
├── .gitignore
├── assets/
│ └── cover.jpg
├── css/
└── js
```

## Installation

Le projet est 100 % statique : aucune dépendance ni build n'est nécessaire.

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/<votre-utilisateur>/global-explorer-planner.git
   cd global-explorer-planner
   ```
2. Lancer un serveur local (nécessaire pour que les modules ES fonctionnent correctement, les navigateurs bloquant `import` en `file://`) :
   ```bash
   # Avec VS Code : extension "Live Server", ou
   npx serve .
   # ou
   python3 -m http.server 5500
   ```
3. Ouvrir `http://localhost:5500` (ou le port indiqué) dans le navigateur.

## ♿ Qualité

Sémantique stricte + ARIA (aria-expanded, aria-live, aria-current)

Navigation clavier complète + lien d'évitement

Images lazy + decoding="async", API en cache, debounce sur la recherche

## Accessibilité, SEO & Performance

- Sémantique HTML stricte (`header`, `nav`, `aside`, `main`, `section`, `footer`), un seul `<h1>` par page.
- Attributs ARIA sur les composants dynamiques (`aria-expanded`, `aria-hidden`, `aria-live="polite"`, `aria-current`).
- Navigation clavier complète avec `:focus-visible` visible et lien d'évitement ("Aller au contenu principal").
- Images (drapeaux) avec `alt` explicite, `loading="lazy"` et `decoding="async"`.
- Balises meta SEO/Open Graph et `lang="fr"` sur `<html>`.

## 📄 Licence

MIT © 2026
