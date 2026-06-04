# Smoke Test Checklist

Run this manually after every production deployment.

## Auth
- [ ] Sign in with Google completes and redirects back to the app
- [ ] User display name appears in the NavBar after login
- [ ] Logout clears the session — display name replaced by Sign in link
- [ ] Navigating to /search while logged out redirects to home

## Search
- [ ] Searching "radiohead" returns album results
- [ ] Results include cover art, title, artist, and year
- [ ] Clicking a result navigates to the album page

## Album & Artist
- [ ] Album page shows cover art, title, artist link, release year, type badge
- [ ] Rating picker saves a rating — score updates without page reload
- [ ] Log modal opens, submits, and shows "Logged!" confirmation
- [ ] Artist link navigates to the artist discography page
- [ ] Artist page shows a grid of albums and EPs

## Profile
- [ ] /user/:username loads without login
- [ ] Stats show correct totals (total rated, average, total listens)
- [ ] Recent ratings and diary entries appear with album info
- [ ] "This is you" badge appears on your own profile

## New Releases
- [ ] /releases loads results for "This week"
- [ ] Switching to "This month" re-fetches and shows more results
- [ ] Albums with listener counts display formatted numbers

## Health
- [ ] GET /health returns { "status": "ok", "db": "ok" } in production
