- FOLDER STRUCTURE -

franciscolobo1880.github.io/
├── content/
│   ├── database/
│   ├── pdfs/
│   └── photos/
│
├── assets/
│   ├── css/
│   │
│   ├── js/
│   │
│   ├── sass/
│   │
│   └── webfonts/
│
├── index.html
├── aboutme.html
├── publications.html
└── collaborations.html

- HOW IT WORKS -

The main. files of the different types are the ones that actually are custom made. 
Everything else is a third-party dependency that enables the site to work properly.

User visits page: HTML file loads with template structure
Data loading: main.js fetches JSON data from /content/database/ and finds placeholders
Template rendering: Placeholders are replaced with actual data and HTML is inserted into the page
Styling: main.css (compiled from main.scss) builds the page framework
Interactivity: Dependencies handle scrolling, animations, responsiveness, and browser compatibility

- FILES TYPES -

HTML (HyperText Markup Language) files:
Define the structure and content of a webpage. They tell the browser what elements exist: headings, paragraphs, images, videos, forms, buttons, layout containers, and other structural components. Think of HTML as the skeleton of the webpage.

CSS (Cascading Style Sheets) files:
Control the appearance of the elements defined in HTML. They set colors, fonts, spacing, layouts, animations, and general visual design. Think of CSS as the design or paint on the website.

SCSS files:
An enhanced, developer-friendly version of CSS. SCSS is a syntax of SASS, which is a CSS preprocessor. They allow variables, nesting, mixins, functions, partials, and imports. SCSS must be compiled into plain CSS before the browser can use it. Think of SCSS as CSS but better.

JS (JavaScript) files:
Provide interactivity and logic for the webpage. They enable things like dropdown menus, animations, form validation, sliders, dynamic content updates, and communication with servers through APIs. Think of JS as the brain of the website.

JSON (JavaScript Object Notation) files:
Store structured data or configuration settings in a clean, readable text format. Commonly used for project settings (like package.json), API responses, and passing data between frontend and backend systems. Think of JSON as a simple, human-readable database format.


