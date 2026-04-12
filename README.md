# SwipePath AI 🚀

A Tinder-style career discovery app with AI-powered recommendations.

## Setup & Run

```bash
npm install
npm start
```

Open: http://localhost:3000

## How It Works

- Swipe **right** → Like a career
- Swipe **left** → Pass
- Swipe **up** / Double-tap → Super Like (Dream career!)
- Swipe **down** → Definitely not interested

After 5 swipes, the AI learns your preferences and the results page shows personalized career matches with:
- AI match percentage
- Salary range
- Learning roadmap
- Real LinkedIn profiles of pros in that field

## Tech Stack

- **Frontend**: Vanilla JS, CSS animations, Touch/drag events
- **Backend**: Node.js + Express
- **Data**: In-memory (no DB required)
- **Design**: Mobile-first, dark theme, glassmorphism

## Features

- 12 curated careers across Tech, Business, Design, Finance, Science
- Smart recommendation engine based on tag + cluster preferences
- Smooth swipe animations with visual feedback
- Premium dark UI with gradient effects
- LinkedIn profiles for real-world inspiration