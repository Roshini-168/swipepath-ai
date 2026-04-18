SwipePath AI — Complete Project Summary

What is SwipePath AI?
SwipePath AI is a mobile-first Progressive Web App (PWA) that helps users discover their ideal career through a Tinder-style swiping experience, powered by a personalized AI recommendation engine. Think of it as "Spotify Wrapped meets career counseling" — it doesn't just suggest jobs, it builds your career identity.

The Problem It Solves
Most career guidance tools give generic advice based on a short questionnaire. SwipePath AI learns from behavior — how you react to different careers — and builds a dynamic preference model in real time. It's designed for students and young professionals in India who are overwhelmed by career choices and need a fun, engaging way to self-discover.

How It Works — User Flow
1. Splash & Auth
The app opens with an animated splash screen. Users can Sign Up with email/password, continue with Google, or use Guest mode. All three paths lead to onboarding.
2. Onboarding (5 questions)
New users answer 5 questions — age, gender, location, interests (up to 3 from 8 categories), and education level. This data seeds the recommendation engine so career cards relevant to the user appear first in the quiz.
3. Dashboard
After onboarding, users land on a personal dashboard showing their name, quiz stats (quizzes taken, total matches, streak), their latest top matches, and a scrollable career spotlight. A floating ⚡ "Take Quiz" badge pulses persistently.
4. Instructions Modal
Before every quiz, a modal explains all four swipe gestures. It has a close button and can be dismissed.
5. The Quiz (Swipe Engine)
Users swipe through 12 career cards per session drawn from a pool of 20 careers. Every card shows a full-screen cover image, career title, description, skill tags, and average salary. Swipe mechanics:

Right → Like
Left → Pass
Up / Double-tap → Dream Career (super like, 3× weight)
Down → Definitely Not (super dislike, −3× weight)

6. Micro-Quizzes (personality signals)
Every 4 career cards, a special "check-in" card appears asking a personality question like "Do you enjoy solving complex puzzles?" or "Does creative expression energize you?" with Yes / No / Skip options. These answers silently boost or penalize career clusters in the recommendation engine.
7. AI Recommendation Engine
The engine tracks liked/disliked tags and career clusters with weighted scoring. Super likes count 3×, regular likes 1×, dislikes −1×, super dislikes −3×. Micro-quiz answers add ±1.5× cluster boosts. All 20 careers are scored and the top 3 are returned — even if all cards were swiped (the "empty results" bug was fixed specifically for this).
8. Career Personality Reveal
This is the signature feature. After the quiz, before showing results, the app reveals your "Career Personality" — one of 6 archetypes computed from your swipe patterns and micro-quiz answers. Example: "You are a Creative Strategist — you think visually, prefer autonomy, and dislike repetition." Each personality shows positive traits (green), negative traits (red), and neutral traits (cyan).
9. Results Page
Shows top 3 matched careers with rank badges (🥇🥈🥉), an AI match percentage, salary range, job market growth rate, a visual learning roadmap, and clickable LinkedIn profiles of real professionals in that field with deep-link support for the LinkedIn app.
10. History, Profile, Bottom Nav
A bottom navigation bar (Home / History / ⚡Quiz / Results / Profile) gives access to past quiz attempts (stored with personality + top matches), full user profile with onboarding data, and sign-out.

Technical Architecture
Frontend — Vanilla JavaScript (no framework), CSS custom properties, CSS animations. Mobile-first with fixed-position screens, overflow: hidden containment, and overscroll-behavior: none to prevent horizontal scroll on phones. All swipe logic is built from scratch using native Touch and Mouse events.
Backend — Node.js + Express REST API. Serves 20 career objects with tags, clusters, interest mappings, study paths, salary data, and LinkedIn profiles. The /api/careers endpoint accepts an ?interests= query parameter and returns careers sorted by the user's onboarding interests first. The /api/recommendations endpoint runs server-side scoring as a fallback, though the primary logic now runs client-side for reliability.
Data Layer — No database. All user data (profile, quiz history, sessions) is stored in localStorage. Career data lives in-memory on the server with a full client-side fallback so the app works even if the server is unreachable.
PWA — A manifest.json and service worker (sw.js) make the app installable on Android and iPhone home screens. The service worker caches static assets for offline use, never intercepts external origins (fixing a LinkedIn link bug), and handles API calls with a graceful fallback.
Smart Quiz Rotation — Uses a seeded shuffle algorithm (seededShuffle(arr, seed)) where the seed is derived from Date.now() XOR (quizAttempt × largeNumber), guaranteeing a different career order every session.
