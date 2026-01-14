# Josh & Joy — Wedding Invitation

A beautiful, modern wedding invitation website for Josh Macaraig and Joy Delantar's wedding on January 22, 2026.

## Features

### Design
- **Dusty Blue Theme** - Matching the physical invitation's elegant color scheme
- **Elegant Typography** - Playfair Display for both titles and body copy
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Smooth Animations** - Scroll-triggered fade-in animations
- **SVG Icons** - Clean, scalable icons throughout (no emojis)

### Sections
1. **Hero** - Full-screen header with couple names, date, and countdown timer
2. **Event Details** - Date, time, venue, and attire guide
3. **Wedding Timeline** - Visual timeline: Ceremony, Photos, Dinner, Toast, Party
4. **Our Story** - Love story timeline from elementary to wedding day
5. **Gallery Carousel** - Single-image carousel with counter and navigation
6. **Bridal Entourage** - Complete wedding party information
7. **Reminders & Gift Note** - Important reminders and gift preferences
8. **RSVP Form** - Supabase-powered form for guest responses

### RSVP Management Dashboard
- `/manage-rsvp` dashboard hosted alongside the invitation (not inside the wedding socials app)
- Live Supabase feed with search, status filters, and quick refresh
- RSVP and guest-count totals to help with seating + catering
- One-click CSV export of the currently filtered view for spreadsheets or sharing

### Wedding Social Moments
- Dedicated `social.html` page where guests create a quick profile, upload wedding-day posts, and add 24-hour stories
- Instagram-style feed with real-time comments and multi-reaction picker backed by Supabase tables (`guests`, `posts`, `comments`, `reactions`)
- Story viewer with reaction buttons and automatic progression, plus viewed-story tracking per browser
- Floating composer modal that uploads images/videos directly to the `wedding-media` Supabase Storage bucket
- **Expo Mobile App** (`wedding-social-app/`) - Native Josh & Joy Moments experience with camera/gallery uploads, dark-mode UI, Supabase-powered feed, stories, and reactions ready for Expo Go testing

### Music Widget
- **Collapsible Circle Button** - Spotify-style floating button when collapsed
- **Auto-play** - Attempts to play automatically on page load
- **Click to Expand** - Full player with playlist when expanded
- **Shows Current Track** - Header displays current song title

## Project Structure

```
prenup/
├── index.html              # Main HTML file
├── styles.css              # Main CSS (imports all components)
├── api/                    # Serverless handlers (deployed on Vercel)
│   └── rsvp.js             # Secure RSVP proxy to Supabase
├── components/             # Componentized JavaScript
│   ├── countdown.js        # Countdown timer
│   ├── carousel.js         # Photo carousel
│   ├── music-widget.js     # Widget toggle logic
│   ├── scroll-animations.js# Intersection observer
│   ├── react-music-player.js
│   └── react-rsvp-form.js
├── css/                    # Componentized CSS (base, hero, etc.)
├── photos/                 # Prenup photos
├── songs/                  # MP3 files for music player
├── physical invitation/    # Reference images
├── details.md              # Wedding details reference
└── README.md               # This file
```


## How to Run

Simply open `index.html` in a modern browser. No build step required!

To explore the social feed, open `social.html` after configuring Supabase keys and the storage bucket (see below).

For host-only management, serve the project (or run `npx http-server .`) and visit `http://localhost:8080/manage-rsvp` to open the RSVP dashboard.

### Mobile App (Expo)
1. `cd wedding-social-app`
2. `npm install` (only needed the first time)
3. `npm start` then scan the QR code with Expo Go (iOS/Android)

The app already points to the same Supabase project via `app.json > extra`. Update those values if you switch projects.

## Supabase Configuration

1. In Supabase, create the `responses` table (SQL below) and confirm the `anon` role can `insert` (and optionally `select`) rows.
2. In Vercel (or `vercel dev`), add the following environment variables so `api/rsvp.js` can talk to Supabase securely:
   - `SUPABASE_URL` – e.g. `https://YOUR-PROJECT.supabase.co`
   - `SUPABASE_ANON_KEY` – your anon public key (now kept server-side)
3. Redeploy so the new environment variables are available to the serverless function.

The frontend never loads Supabase credentials anymore; all reads/writes proxy through `api/rsvp.js`.

### Database Table
```sql
create table if not exists public.responses (
  id bigserial primary key,
  name text not null,
  status text not null check (status in ('yes','no','maybe')),
  message text,
  created_at timestamptz not null default now()
);

alter table public.responses enable row level security;
create policy "Allow inserts from anon"
  on public.responses for insert
  to anon
  with check (true);
```

## Music Playlist

1. Bless The Broken Road - Boyce Avenue
2. Tenerife Sea - Ed Sheeran
3. Jesus & You - Matthew West
4. PALAGI - TJxKZ
5. When I Say I Do

To modify, edit the `PLAYLIST` array in `components/react-music-player.js`.

## Attire Guide

- **Ninong**: Dusty Blue or Black Suit
- **Ninang**: Formal attire in Dusty Blue
- **Guests**: Formal or Semi-formal in Beige
- **Avoid**: Sando, T-shirts, Shorts, Slippers

## Venue

**Greenridge Resort**
Sitio Dita, Masalukot 1, Candelaria, Quezon

[Open in Google Maps](https://maps.app.goo.gl/QEPMUNr198oxWy3U8)

## Color Palette

| Color | Hex |
|-------|-----|
| Dusty Blue | `#7B9AAB` |
| Dusty Blue Dark | `#5A7A8A` |
| Dusty Blue Light | `#A8C4D4` |
| Navy | `#2C3E50` |
| Cream | `#F5F1EB` |
| Gold | `#C9A962` |

---

With love, Josh & Joy
