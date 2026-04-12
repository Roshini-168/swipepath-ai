const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory career data (no MongoDB needed for demo)
const careers = [
  {
    _id: '1',
    title: 'AI/ML Engineer',
    description: 'Build intelligent systems that learn from data. Design neural networks, train models, and deploy AI solutions that reshape industries.',
    tags: ['Python', 'TensorFlow', 'Deep Learning', 'Math'],
    cluster: 'Technology',
    prerequisites: ['Python', 'Statistics', 'Linear Algebra'],
    studyPath: ['Python Basics', 'Statistics', 'ML Fundamentals', 'Deep Learning', 'MLOps'],
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    avgSalary: '₹18-45 LPA',
    growth: '40%',
    linkedinProfiles: [
      { name: 'Andrew Ng', title: 'AI Pioneer & Coursera Co-founder', url: 'https://www.linkedin.com/in/andrewyng/', avatar: 'https://i.pravatar.cc/150?img=1' },
      { name: 'Andrej Karpathy', title: 'Ex-Tesla AI Director', url: 'https://www.linkedin.com/in/andrej-karpathy-9a650716/', avatar: 'https://i.pravatar.cc/150?img=2' },
      { name: 'Lex Fridman', title: 'AI Researcher & Podcaster', url: 'https://www.linkedin.com/in/lexfridman/', avatar: 'https://i.pravatar.cc/150?img=3' }
    ]
  },
  {
    _id: '2',
    title: 'Product Manager',
    description: 'Own the vision. Bridge business, design, and engineering to build products millions love. Be the CEO of your product.',
    tags: ['Strategy', 'Leadership', 'Analytics', 'UX'],
    cluster: 'Business',
    prerequisites: ['Communication', 'Problem Solving', 'Data Analysis'],
    studyPath: ['Business Fundamentals', 'UX Research', 'Agile/Scrum', 'Data Analytics', 'Product Strategy'],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    avgSalary: '₹15-40 LPA',
    growth: '25%',
    linkedinProfiles: [
      { name: 'Shreyas Doshi', title: 'Ex-PM at Stripe, Twitter, Google', url: 'https://www.linkedin.com/in/shreyasdoshi/', avatar: 'https://i.pravatar.cc/150?img=4' },
      { name: 'Lenny Rachitsky', title: 'PM Coach & Newsletter Creator', url: 'https://www.linkedin.com/in/lennyrachitsky/', avatar: 'https://i.pravatar.cc/150?img=5' },
      { name: 'Teresa Torres', title: 'Product Discovery Coach', url: 'https://www.linkedin.com/in/torresteresa/', avatar: 'https://i.pravatar.cc/150?img=6' }
    ]
  },
  {
    _id: '3',
    title: 'Full-Stack Developer',
    description: 'Architect and build complete web applications from database to UI. Turn ideas into real products that users interact with daily.',
    tags: ['React', 'Node.js', 'Databases', 'APIs'],
    cluster: 'Technology',
    prerequisites: ['HTML/CSS', 'JavaScript', 'Git'],
    studyPath: ['HTML/CSS/JS', 'React', 'Node.js', 'Databases', 'Cloud Deployment'],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    avgSalary: '₹8-30 LPA',
    growth: '22%',
    linkedinProfiles: [
      { name: 'Dan Abramov', title: 'React Core Team at Meta', url: 'https://www.linkedin.com/in/dan-abramov/', avatar: 'https://i.pravatar.cc/150?img=7' },
      { name: 'Guillermo Rauch', title: 'CEO of Vercel', url: 'https://www.linkedin.com/in/guillermo-rauch-b834b917b/', avatar: 'https://i.pravatar.cc/150?img=8' },
      { name: 'Wes Bos', title: 'Full-Stack Dev & Educator', url: 'https://www.linkedin.com/in/wesbos/', avatar: 'https://i.pravatar.cc/150?img=9' }
    ]
  },
  {
    _id: '4',
    title: 'UX/UI Designer',
    description: 'Craft experiences that feel magical. Research human behavior, prototype interactions, and design interfaces that users love.',
    tags: ['Figma', 'Prototyping', 'Research', 'Psychology'],
    cluster: 'Design',
    prerequisites: ['Visual Design', 'Empathy', 'Figma Basics'],
    studyPath: ['Design Principles', 'Figma', 'UX Research', 'Prototyping', 'Design Systems'],
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    avgSalary: '₹6-25 LPA',
    growth: '20%',
    linkedinProfiles: [
      { name: 'Julie Zhuo', title: 'Ex-VP Design at Meta', url: 'https://www.linkedin.com/in/juliezhuo/', avatar: 'https://i.pravatar.cc/150?img=10' },
      { name: 'Fabricio Teixeira', title: 'UX Designer & Writer', url: 'https://www.linkedin.com/in/fabricioteixeira/', avatar: 'https://i.pravatar.cc/150?img=11' },
      { name: 'Tobias van Schneider', title: 'Designer & Founder at DESK', url: 'https://www.linkedin.com/in/tobiasvanschneider/', avatar: 'https://i.pravatar.cc/150?img=12' }
    ]
  },
  {
    _id: '5',
    title: 'Cybersecurity Analyst',
    description: 'Be the digital guardian. Hunt threats, protect systems, and outsmart hackers. High demand, always evolving field.',
    tags: ['Networking', 'Ethical Hacking', 'Firewalls', 'SIEM'],
    cluster: 'Technology',
    prerequisites: ['Networking Basics', 'Linux', 'Programming'],
    studyPath: ['Networking', 'Linux', 'Security+', 'Ethical Hacking', 'SOC Operations'],
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    avgSalary: '₹10-35 LPA',
    growth: '33%',
    linkedinProfiles: [
      { name: 'Bruce Schneier', title: 'Security Technologist & Author', url: 'https://www.linkedin.com/in/bruce-schneier-b8b8b8/', avatar: 'https://i.pravatar.cc/150?img=13' },
      { name: 'Rachel Tobac', title: 'Social Engineer & CEO SocialProof', url: 'https://www.linkedin.com/in/racheltobac/', avatar: 'https://i.pravatar.cc/150?img=14' },
      { name: 'Troy Hunt', title: 'Security Researcher & HaveIBeenPwned', url: 'https://www.linkedin.com/in/troyhunt/', avatar: 'https://i.pravatar.cc/150?img=15' }
    ]
  },
  {
    _id: '6',
    title: 'Data Scientist',
    description: 'Uncover hidden patterns in massive datasets. Drive billion-dollar decisions with insights extracted from data.',
    tags: ['Python', 'Statistics', 'SQL', 'Visualization'],
    cluster: 'Technology',
    prerequisites: ['Statistics', 'Python', 'SQL'],
    studyPath: ['Statistics', 'Python', 'SQL', 'ML Basics', 'Data Storytelling'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    avgSalary: '₹12-40 LPA',
    growth: '28%',
    linkedinProfiles: [
      { name: 'DJ Patil', title: 'First US Chief Data Scientist', url: 'https://www.linkedin.com/in/dpatil/', avatar: 'https://i.pravatar.cc/150?img=16' },
      { name: 'Monica Rogati', title: 'Data Science Advisor', url: 'https://www.linkedin.com/in/mrogati/', avatar: 'https://i.pravatar.cc/150?img=17' },
      { name: 'Cassie Kozyrkov', title: 'Chief Decision Scientist at Google', url: 'https://www.linkedin.com/in/cassiekozyrkov/', avatar: 'https://i.pravatar.cc/150?img=18' }
    ]
  },
  {
    _id: '7',
    title: 'Digital Marketing Manager',
    description: 'Grow brands in the digital age. Master SEO, social media, paid ads, and content to drive real business results.',
    tags: ['SEO', 'Social Media', 'Analytics', 'Content'],
    cluster: 'Marketing',
    prerequisites: ['Communication', 'Creativity', 'Analytics Basics'],
    studyPath: ['Marketing Fundamentals', 'SEO/SEM', 'Social Media', 'Paid Ads', 'Analytics'],
    imageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
    avgSalary: '₹5-20 LPA',
    growth: '18%',
    linkedinProfiles: [
      { name: 'Neil Patel', title: 'Digital Marketing Expert & Co-founder', url: 'https://www.linkedin.com/in/neilkpatel/', avatar: 'https://i.pravatar.cc/150?img=19' },
      { name: 'Rand Fishkin', title: 'Founder of SparkToro & Moz', url: 'https://www.linkedin.com/in/randfishkin/', avatar: 'https://i.pravatar.cc/150?img=20' },
      { name: 'Ann Handley', title: 'Chief Content Officer at MarketingProfs', url: 'https://www.linkedin.com/in/annhandley/', avatar: 'https://i.pravatar.cc/150?img=21' }
    ]
  },
  {
    _id: '8',
    title: 'Cloud Architect',
    description: 'Design the backbone of the internet. Build scalable, resilient cloud infrastructure that powers modern software at massive scale.',
    tags: ['AWS', 'Azure', 'DevOps', 'Kubernetes'],
    cluster: 'Technology',
    prerequisites: ['Networking', 'Linux', 'Programming'],
    studyPath: ['Linux', 'Networking', 'AWS/Azure Basics', 'DevOps', 'Kubernetes'],
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
    avgSalary: '₹20-60 LPA',
    growth: '35%',
    linkedinProfiles: [
      { name: 'Werner Vogels', title: 'CTO of Amazon', url: 'https://www.linkedin.com/in/wernervogels/', avatar: 'https://i.pravatar.cc/150?img=22' },
      { name: 'Kelsey Hightower', title: 'Principal Engineer at Google', url: 'https://www.linkedin.com/in/kelsey-hightower-b08b6b36/', avatar: 'https://i.pravatar.cc/150?img=23' },
      { name: 'Adrian Cockcroft', title: 'VP Cloud at AWS', url: 'https://www.linkedin.com/in/adriancockcroft/', avatar: 'https://i.pravatar.cc/150?img=24' }
    ]
  },
  {
    _id: '9',
    title: 'Investment Banker',
    description: 'Navigate high-stakes financial deals. Advise corporations on mergers, IPOs, and capital markets with elite analytical skills.',
    tags: ['Finance', 'Excel', 'Valuation', 'M&A'],
    cluster: 'Finance',
    prerequisites: ['Finance Basics', 'Excel', 'Economics'],
    studyPath: ['Financial Modeling', 'Accounting', 'Valuation', 'Excel/VBA', 'CFA Prep'],
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    avgSalary: '₹12-50 LPA',
    growth: '15%',
    linkedinProfiles: [
      { name: 'Jamie Dimon', title: 'CEO of JPMorgan Chase', url: 'https://www.linkedin.com/in/jamie-dimon-1234/', avatar: 'https://i.pravatar.cc/150?img=25' },
      { name: 'Goldman Sachs Careers', title: 'Top IB Firm', url: 'https://www.linkedin.com/company/goldman-sachs/', avatar: 'https://i.pravatar.cc/150?img=26' },
      { name: 'Rosenbaum & Pearl', title: 'Authors of Investment Banking Bible', url: 'https://www.linkedin.com/in/joshuarosenbaum/', avatar: 'https://i.pravatar.cc/150?img=27' }
    ]
  },
  {
    _id: '10',
    title: 'Biotech Researcher',
    description: 'Rewrite the code of life. Engineer solutions to diseases, develop new drugs, and push the frontier of what biology can do.',
    tags: ['Biology', 'Lab Skills', 'CRISPR', 'Research'],
    cluster: 'Science',
    prerequisites: ['Biology', 'Chemistry', 'Statistics'],
    studyPath: ['Molecular Biology', 'Biochemistry', 'Lab Techniques', 'Bioinformatics', 'Research Methods'],
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    avgSalary: '₹8-30 LPA',
    growth: '20%',
    linkedinProfiles: [
      { name: 'Jennifer Doudna', title: 'Nobel Prize Winner - CRISPR Pioneer', url: 'https://www.linkedin.com/in/jennifer-doudna/', avatar: 'https://i.pravatar.cc/150?img=28' },
      { name: 'George Church', title: 'Harvard Genetics Professor', url: 'https://www.linkedin.com/in/george-church-38a1b71/', avatar: 'https://i.pravatar.cc/150?img=29' },
      { name: 'Feng Zhang', title: 'CRISPR Researcher at Broad Institute', url: 'https://www.linkedin.com/in/feng-zhang-crispr/', avatar: 'https://i.pravatar.cc/150?img=30' }
    ]
  },
  {
    _id: '11',
    title: 'Game Developer',
    description: 'Build worlds from scratch. Craft immersive interactive experiences used by billions. The intersection of art, code, and psychology.',
    tags: ['Unity', 'C#', 'Game Design', '3D'],
    cluster: 'Technology',
    prerequisites: ['Programming', 'Math', 'Creativity'],
    studyPath: ['C# Basics', 'Unity', 'Game Design Principles', '3D Modeling', 'Game Publishing'],
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
    avgSalary: '₹6-25 LPA',
    growth: '16%',
    linkedinProfiles: [
      { name: 'John Carmack', title: 'CTO Oculus, Doom Creator', url: 'https://www.linkedin.com/in/john-carmack-3b7/', avatar: 'https://i.pravatar.cc/150?img=31' },
      { name: 'Tim Sweeney', title: 'CEO of Epic Games', url: 'https://www.linkedin.com/in/tim-sweeney-epic/', avatar: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Jade Raymond', title: 'VP at Google Stadia', url: 'https://www.linkedin.com/in/jade-raymond-b25b4b16/', avatar: 'https://i.pravatar.cc/150?img=33' }
    ]
  },
  {
    _id: '12',
    title: 'Entrepreneur / Founder',
    description: 'Build something from nothing. Lead vision, attract talent, raise capital, and create companies that change how the world works.',
    tags: ['Vision', 'Leadership', 'Fundraising', 'Hustle'],
    cluster: 'Business',
    prerequisites: ['Problem Solving', 'Communication', 'Resilience'],
    studyPath: ['Business Basics', 'Lean Startup', 'Fundraising', 'Product Development', 'Marketing'],
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    avgSalary: 'Unlimited',
    growth: 'Self-determined',
    linkedinProfiles: [
      { name: 'Elon Musk', title: 'Founder Tesla, SpaceX, xAI', url: 'https://www.linkedin.com/in/elonmusk/', avatar: 'https://i.pravatar.cc/150?img=34' },
      { name: 'Jensen Huang', title: 'CEO & Co-founder of NVIDIA', url: 'https://www.linkedin.com/in/jensen-huang-6b19b5/', avatar: 'https://i.pravatar.cc/150?img=35' },
      { name: 'Kunal Shah', title: 'Founder of CRED, India', url: 'https://www.linkedin.com/in/kunalshah1/', avatar: 'https://i.pravatar.cc/150?img=36' }
    ]
  }
];

// Recommendation logic
function getRecommendations(swipeHistory, allCareers) {
  const likedTags = {};
  const dislikedTags = {};
  const likedClusters = {};
  const dislikedClusters = {};

  swipeHistory.forEach(({ careerId, action }) => {
    const career = allCareers.find(c => c._id === careerId);
    if (!career) return;

    const weight = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -3 : -1;
    
    career.tags.forEach(tag => {
      likedTags[tag] = (likedTags[tag] || 0) + weight;
    });
    likedClusters[career.cluster] = (likedClusters[career.cluster] || 0) + weight;
  });

  // Score ALL careers (including swiped ones) — when all cards are swiped
  // we still want the top 3 best-matching ones shown as results
  const scored = allCareers.map(career => {
    let score = 0;
    career.tags.forEach(tag => { score += likedTags[tag] || 0; });
    score += (likedClusters[career.cluster] || 0) * 2;
    return { ...career, score };
  });

  // Only return careers with positive or neutral score (liked/super-liked)
  // Filter out ones the user explicitly super-disliked
  const superDislikedIds = swipeHistory
    .filter(s => s.action === 'superDislike')
    .map(s => s.careerId);

  const filtered = scored.filter(c => !superDislikedIds.includes(c._id));

  return filtered.sort((a, b) => b.score - a.score).slice(0, 3);
}

// API Routes
app.get('/api/careers', (req, res) => {
  res.json(careers);
});

app.post('/api/recommendations', (req, res) => {
  const { swipeHistory } = req.body;
  if (!swipeHistory || swipeHistory.length === 0) {
    return res.json(careers.slice(0, 3));
  }
  const recommendations = getRecommendations(swipeHistory, careers);
  res.json(recommendations);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SwipePath AI running on http://localhost:${PORT}`));