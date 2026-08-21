# Closetly — PHASE 1

This is a lightweight static recreation of the Closetly landing page mockup.

## Structure

```text
closetly.io/
├── README.md
└── frontend/
    ├── index.html
    ├── assets/
    │   └── closet-hero.png
    ├── pages/
    │   ├── profile.html
    │   ├── search.html
    │   └── wardrobe.html
    ├── script/
    │   └── index.js
    ├── uploads/
    │   └── (uploaded clothing images)
    └── style/
        └── style.css
```

For now, `frontend/uploads/` acts as the database for storing images of clothes uploaded to the wardrobe.

## Run

No build step is required.

Open `index.html` directly in your browser, or use VS Code's Live Server extension.

The project uses:

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5.3 CDN
- Bootstrap Icons CDN
- Google Fonts CDN

## Current behavior

The four main navigation tabs work:

- Home
- Search
- Wardrobe
- Settings

The Home page is the detailed landing page. The other three are placeholder pages ready for the actual Closetly functionality.

The outfit cards currently use Unsplash image URLs so the page has realistic fashion imagery. Replace those URLs with your own wardrobe/outfit images when the backend is connected.
