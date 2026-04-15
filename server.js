const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
//  CAREER DATA — 20 careers, verified LinkedIn URLs
//  Interest mapping for onboarding personalization:
//  Tech & Coding → Technology cluster
//  Art & Design → Design cluster
//  Business & Money → Business / Finance cluster
//  Science & Research → Science cluster
//  Writing & Media → Media cluster
//  Sports & Fitness → Health cluster
//  Music & Arts → Creative cluster
//  Helping People → Social / Health cluster
// ==========================================
const careers = [
  {
    _id: '1',
    title: 'AI/ML Engineer',
    description: 'Build intelligent systems that learn from data. Design neural networks, train models, and deploy AI solutions that reshape industries.',
    tags: ['Python', 'TensorFlow', 'Deep Learning', 'Math'],
    cluster: 'Technology',
    interests: ['Tech & Coding', 'Science & Research'],
    prerequisites: ['Python', 'Statistics', 'Linear Algebra'],
    studyPath: ['Python Basics', 'Statistics', 'ML Fundamentals', 'Deep Learning', 'MLOps'],
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    avgSalary: '₹18-45 LPA',
    growth: '40%',
    linkedinProfiles: [
      { name: 'Andrew Ng', title: 'AI Pioneer & Coursera Co-founder', url: 'https://www.linkedin.com/in/andrewyng/', avatar: 'https://i.pravatar.cc/150?img=1' },
      { name: 'Andrej Karpathy', title: 'Ex-Tesla AI Director, OpenAI', url: 'https://www.linkedin.com/in/andrej-karpathy-9a650716/', avatar: 'https://i.pravatar.cc/150?img=2' },
      { name: 'Lex Fridman', title: 'AI Researcher & Podcaster, MIT', url: 'https://www.linkedin.com/in/lexfridman/', avatar: 'https://i.pravatar.cc/150?img=3' }
    ]
  },
  {
    _id: '2',
    title: 'Product Manager',
    description: 'Own the vision. Bridge business, design, and engineering to build products millions love. Be the CEO of your product.',
    tags: ['Strategy', 'Leadership', 'Analytics', 'UX'],
    cluster: 'Business',
    interests: ['Business & Money', 'Tech & Coding'],
    prerequisites: ['Communication', 'Problem Solving', 'Data Analysis'],
    studyPath: ['Business Fundamentals', 'UX Research', 'Agile/Scrum', 'Data Analytics', 'Product Strategy'],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    avgSalary: '₹15-40 LPA',
    growth: '25%',
    linkedinProfiles: [
      { name: 'Shreyas Doshi', title: 'Ex-PM at Stripe, Twitter, Google', url: 'https://www.linkedin.com/in/shreyasdoshi/', avatar: 'https://i.pravatar.cc/150?img=4' },
      { name: 'Lenny Rachitsky', title: 'PM Coach & Newsletter Author', url: 'https://www.linkedin.com/in/lennyrachitsky/', avatar: 'https://i.pravatar.cc/150?img=5' },
      { name: 'Teresa Torres', title: 'Product Discovery Coach', url: 'https://www.linkedin.com/in/torresteresa/', avatar: 'https://i.pravatar.cc/150?img=6' }
    ]
  },
  {
    _id: '3',
    title: 'Full-Stack Developer',
    description: 'Architect and build complete web applications from database to UI. Turn ideas into real products that users interact with daily.',
    tags: ['React', 'Node.js', 'Databases', 'APIs'],
    cluster: 'Technology',
    interests: ['Tech & Coding'],
    prerequisites: ['HTML/CSS', 'JavaScript', 'Git'],
    studyPath: ['HTML/CSS/JS', 'React', 'Node.js', 'Databases', 'Cloud Deployment'],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    avgSalary: '₹8-30 LPA',
    growth: '22%',
    linkedinProfiles: [
      { name: 'Dan Abramov', title: 'React Core Team at Meta', url: 'https://www.linkedin.com/in/dan-abramov/', avatar: 'https://i.pravatar.cc/150?img=7' },
      { name: 'Guillermo Rauch', title: 'CEO of Vercel', url: 'https://www.linkedin.com/in/guillermo-rauch-b834b917b/', avatar: 'https://i.pravatar.cc/150?img=8' },
      { name: 'Wes Bos', title: 'Full-Stack Developer & Educator', url: 'https://www.linkedin.com/in/wesbos/', avatar: 'https://i.pravatar.cc/150?img=9' }
    ]
  },
  {
    _id: '4',
    title: 'UX/UI Designer',
    description: 'Craft experiences that feel magical. Research human behavior, prototype interactions, and design interfaces that users love.',
    tags: ['Figma', 'Prototyping', 'Research', 'Psychology'],
    cluster: 'Design',
    interests: ['Art & Design', 'Tech & Coding'],
    prerequisites: ['Visual Design', 'Empathy', 'Figma Basics'],
    studyPath: ['Design Principles', 'Figma', 'UX Research', 'Prototyping', 'Design Systems'],
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    avgSalary: '₹6-25 LPA',
    growth: '20%',
    linkedinProfiles: [
      { name: 'Julie Zhuo', title: 'Ex-VP Product Design at Facebook', url: 'https://www.linkedin.com/in/juliezhuo/', avatar: 'https://i.pravatar.cc/150?img=10' },
      { name: 'Fabricio Teixeira', title: 'UX Designer & Writer', url: 'https://www.linkedin.com/in/fabricioteixeira/', avatar: 'https://i.pravatar.cc/150?img=11' },
      { name: 'Tobias van Schneider', title: 'Designer & Founder, DESK Magazine', url: 'https://www.linkedin.com/in/tobiasvanschneider/', avatar: 'https://i.pravatar.cc/150?img=12' }
    ]
  },
  {
    _id: '5',
    title: 'Cybersecurity Analyst',
    description: 'Be the digital guardian. Hunt threats, protect systems, and outsmart hackers. High demand, always evolving field.',
    tags: ['Networking', 'Ethical Hacking', 'Firewalls', 'SIEM'],
    cluster: 'Technology',
    interests: ['Tech & Coding', 'Science & Research'],
    prerequisites: ['Networking Basics', 'Linux', 'Programming'],
    studyPath: ['Networking', 'Linux', 'Security+', 'Ethical Hacking', 'SOC Operations'],
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    avgSalary: '₹10-35 LPA',
    growth: '33%',
    linkedinProfiles: [
      { name: 'Rachel Tobac', title: 'CEO SocialProof Security, Ethical Hacker', url: 'https://www.linkedin.com/in/racheltobac/', avatar: 'https://i.pravatar.cc/150?img=14' },
      { name: 'Troy Hunt', title: 'Security Researcher, Creator HaveIBeenPwned', url: 'https://www.linkedin.com/in/troyhunt/', avatar: 'https://i.pravatar.cc/150?img=15' },
      { name: 'Parisa Tabriz', title: 'VP Engineering at Google, Security Lead', url: 'https://www.linkedin.com/in/parisa-tabriz/', avatar: 'https://i.pravatar.cc/150?img=13' }
    ]
  },
  {
    _id: '6',
    title: 'Data Scientist',
    description: 'Uncover hidden patterns in massive datasets. Drive billion-dollar decisions with insights extracted from data.',
    tags: ['Python', 'Statistics', 'SQL', 'Visualization'],
    cluster: 'Technology',
    interests: ['Tech & Coding', 'Science & Research', 'Business & Money'],
    prerequisites: ['Statistics', 'Python', 'SQL'],
    studyPath: ['Statistics', 'Python', 'SQL', 'ML Basics', 'Data Storytelling'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    avgSalary: '₹12-40 LPA',
    growth: '28%',
    linkedinProfiles: [
      { name: 'DJ Patil', title: 'First US Chief Data Scientist', url: 'https://www.linkedin.com/in/dpatil/', avatar: 'https://i.pravatar.cc/150?img=16' },
      { name: 'Monica Rogati', title: 'Data Science Advisor & Investor', url: 'https://www.linkedin.com/in/mrogati/', avatar: 'https://i.pravatar.cc/150?img=17' },
      { name: 'Cassie Kozyrkov', title: 'Chief Decision Scientist at Google', url: 'https://www.linkedin.com/in/cassiekozyrkov/', avatar: 'https://i.pravatar.cc/150?img=18' }
    ]
  },
  {
    _id: '7',
    title: 'Digital Marketing Manager',
    description: 'Grow brands in the digital age. Master SEO, social media, paid ads, and content to drive real business results.',
    tags: ['SEO', 'Social Media', 'Analytics', 'Content'],
    cluster: 'Marketing',
    interests: ['Business & Money', 'Writing & Media'],
    prerequisites: ['Communication', 'Creativity', 'Analytics Basics'],
    studyPath: ['Marketing Fundamentals', 'SEO/SEM', 'Social Media', 'Paid Ads', 'Analytics'],
    imageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80',
    avgSalary: '₹5-20 LPA',
    growth: '18%',
    linkedinProfiles: [
      { name: 'Neil Patel', title: 'Co-founder Neil Patel Digital', url: 'https://www.linkedin.com/in/neilkpatel/', avatar: 'https://i.pravatar.cc/150?img=19' },
      { name: 'Rand Fishkin', title: 'Founder SparkToro, Co-founder Moz', url: 'https://www.linkedin.com/in/randfishkin/', avatar: 'https://i.pravatar.cc/150?img=20' },
      { name: 'Ann Handley', title: 'Chief Content Officer, MarketingProfs', url: 'https://www.linkedin.com/in/annhandley/', avatar: 'https://i.pravatar.cc/150?img=21' }
    ]
  },
  {
    _id: '8',
    title: 'Cloud Architect',
    description: 'Design the backbone of the internet. Build scalable, resilient cloud infrastructure that powers modern software at massive scale.',
    tags: ['AWS', 'Azure', 'DevOps', 'Kubernetes'],
    cluster: 'Technology',
    interests: ['Tech & Coding', 'Science & Research'],
    prerequisites: ['Networking', 'Linux', 'Programming'],
    studyPath: ['Linux', 'Networking', 'AWS/Azure Basics', 'DevOps', 'Kubernetes'],
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
    avgSalary: '₹20-60 LPA',
    growth: '35%',
    linkedinProfiles: [
      { name: 'Werner Vogels', title: 'CTO & VP at Amazon', url: 'https://www.linkedin.com/in/wernervogels/', avatar: 'https://i.pravatar.cc/150?img=22' },
      { name: 'Kelsey Hightower', title: 'Distinguished Engineer at Google', url: 'https://www.linkedin.com/in/kelseyhightower/', avatar: 'https://i.pravatar.cc/150?img=23' },
      { name: 'Adrian Cockcroft', title: 'Ex-VP Cloud Architecture, AWS', url: 'https://www.linkedin.com/in/adriancockcroft/', avatar: 'https://i.pravatar.cc/150?img=24' }
    ]
  },
  {
    _id: '9',
    title: 'Investment Banker',
    description: 'Navigate high-stakes financial deals. Advise corporations on mergers, IPOs, and capital markets with elite analytical skills.',
    tags: ['Finance', 'Excel', 'Valuation', 'M&A'],
    cluster: 'Finance',
    interests: ['Business & Money'],
    prerequisites: ['Finance Basics', 'Excel', 'Economics'],
    studyPath: ['Financial Modeling', 'Accounting', 'Valuation', 'Excel/VBA', 'CFA Prep'],
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    avgSalary: '₹12-50 LPA',
    growth: '15%',
    linkedinProfiles: [
      { name: 'Joshua Rosenbaum', title: 'Author of Investment Banking Bible', url: 'https://www.linkedin.com/in/joshuarosenbaum/', avatar: 'https://i.pravatar.cc/150?img=27' },
      { name: 'Goldman Sachs', title: 'Top Investment Bank Worldwide', url: 'https://www.linkedin.com/company/goldman-sachs/', avatar: 'https://i.pravatar.cc/150?img=26' },
      { name: 'Morgan Stanley', title: 'Global Investment Banking Leader', url: 'https://www.linkedin.com/company/morgan-stanley/', avatar: 'https://i.pravatar.cc/150?img=25' }
    ]
  },
  {
    _id: '10',
    title: 'Biotech Researcher',
    description: 'Rewrite the code of life. Engineer solutions to diseases, develop new drugs, and push the frontier of what biology can do.',
    tags: ['Biology', 'Lab Skills', 'CRISPR', 'Research'],
    cluster: 'Science',
    interests: ['Science & Research', 'Helping People'],
    prerequisites: ['Biology', 'Chemistry', 'Statistics'],
    studyPath: ['Molecular Biology', 'Biochemistry', 'Lab Techniques', 'Bioinformatics', 'Research Methods'],
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    avgSalary: '₹8-30 LPA',
    growth: '20%',
    linkedinProfiles: [
      { name: 'Jennifer Doudna', title: 'Nobel Laureate, CRISPR Pioneer, UC Berkeley', url: 'https://www.linkedin.com/in/jennifer-doudna-81568421/', avatar: 'https://i.pravatar.cc/150?img=28' },
      { name: 'George Church', title: 'Professor of Genetics, Harvard Medical School', url: 'https://www.linkedin.com/in/george-church-38a1b71/', avatar: 'https://i.pravatar.cc/150?img=29' },
      { name: 'Feng Zhang', title: 'Core Member, Broad Institute of MIT & Harvard', url: 'https://www.linkedin.com/in/feng-zhang-broad/', avatar: 'https://i.pravatar.cc/150?img=30' }
    ]
  },
  {
    _id: '11',
    title: 'Game Developer',
    description: 'Build worlds from scratch. Craft immersive interactive experiences used by billions. The intersection of art, code, and psychology.',
    tags: ['Unity', 'C#', 'Game Design', '3D'],
    cluster: 'Technology',
    interests: ['Tech & Coding', 'Art & Design', 'Music & Arts'],
    prerequisites: ['Programming', 'Math', 'Creativity'],
    studyPath: ['C# Basics', 'Unity', 'Game Design Principles', '3D Modeling', 'Game Publishing'],
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
    avgSalary: '₹6-25 LPA',
    growth: '16%',
    linkedinProfiles: [
      { name: 'Tim Sweeney', title: 'CEO & Founder of Epic Games', url: 'https://www.linkedin.com/in/tim-sweeney-epicgames/', avatar: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Amy Hennig', title: 'Game Director, Uncharted Creator', url: 'https://www.linkedin.com/in/amy-hennig-5a3a6/', avatar: 'https://i.pravatar.cc/150?img=31' },
      { name: 'Hideo Kojima', title: 'Game Director, Founder Kojima Productions', url: 'https://www.linkedin.com/in/hideo-kojima-productions/', avatar: 'https://i.pravatar.cc/150?img=33' }
    ]
  },
  {
    _id: '12',
    title: 'Entrepreneur / Founder',
    description: 'Build something from nothing. Lead vision, attract talent, raise capital, and create companies that change how the world works.',
    tags: ['Vision', 'Leadership', 'Fundraising', 'Hustle'],
    cluster: 'Business',
    interests: ['Business & Money', 'Tech & Coding'],
    prerequisites: ['Problem Solving', 'Communication', 'Resilience'],
    studyPath: ['Business Basics', 'Lean Startup', 'Fundraising', 'Product Development', 'Marketing'],
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    avgSalary: 'Unlimited',
    growth: 'Self-determined',
    linkedinProfiles: [
      { name: 'Jensen Huang', title: 'CEO & Co-founder of NVIDIA', url: 'https://www.linkedin.com/in/jenhsunhuang/', avatar: 'https://i.pravatar.cc/150?img=35' },
      { name: 'Kunal Shah', title: 'Founder & CEO of CRED', url: 'https://www.linkedin.com/in/kunalshah1/', avatar: 'https://i.pravatar.cc/150?img=36' },
      { name: 'Ritesh Agarwal', title: 'Founder & CEO of OYO', url: 'https://www.linkedin.com/in/riteshagarwal/', avatar: 'https://i.pravatar.cc/150?img=34' }
    ]
  },
  {
    _id: '13',
    title: 'Content Creator / YouTuber',
    description: 'Build an audience around your passion. Create videos, podcasts, or posts that entertain, educate, and influence millions.',
    tags: ['Video Editing', 'Storytelling', 'SEO', 'Branding'],
    cluster: 'Media',
    interests: ['Writing & Media', 'Music & Arts', 'Art & Design'],
    prerequisites: ['Creativity', 'Camera Basics', 'Editing'],
    studyPath: ['Video Production', 'Editing (Premiere/DaVinci)', 'SEO & Thumbnails', 'Audience Growth', 'Monetization'],
    imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80',
    avgSalary: '₹2-50 LPA',
    growth: '30%',
    linkedinProfiles: [
      { name: 'MrBeast (Jimmy Donaldson)', title: 'YouTuber & Entrepreneur', url: 'https://www.linkedin.com/in/mrbeast/', avatar: 'https://i.pravatar.cc/150?img=37' },
      { name: 'Marques Brownlee', title: 'Tech YouTuber, MKBHD', url: 'https://www.linkedin.com/in/mkbhd/', avatar: 'https://i.pravatar.cc/150?img=38' },
      { name: 'Ali Abdaal', title: 'Doctor turned YouTuber & Author', url: 'https://www.linkedin.com/in/aliabdaal/', avatar: 'https://i.pravatar.cc/150?img=39' }
    ]
  },
  {
    _id: '14',
    title: 'Clinical Psychologist',
    description: 'Heal minds. Help people overcome trauma, anxiety, and mental illness through therapy and evidence-based interventions.',
    tags: ['Empathy', 'CBT', 'Research', 'Counselling'],
    cluster: 'Health',
    interests: ['Helping People', 'Science & Research'],
    prerequisites: ['Psychology Degree', 'Communication', 'Empathy'],
    studyPath: ['Psychology Degree', 'Clinical Training', 'CBT Certification', 'Internship', 'Licensure'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    avgSalary: '₹5-25 LPA',
    growth: '22%',
    linkedinProfiles: [
      { name: 'Adam Grant', title: 'Organizational Psychologist, Wharton', url: 'https://www.linkedin.com/in/adammgrant/', avatar: 'https://i.pravatar.cc/150?img=40' },
      { name: 'Brené Brown', title: 'Research Professor, Author, Speaker', url: 'https://www.linkedin.com/in/brenebrown/', avatar: 'https://i.pravatar.cc/150?img=41' },
      { name: 'Daniel Kahneman', title: 'Nobel Laureate, Behavioral Economist', url: 'https://www.linkedin.com/in/daniel-kahneman/', avatar: 'https://i.pravatar.cc/150?img=42' }
    ]
  },
  {
    _id: '15',
    title: 'Fashion Designer',
    description: 'Shape culture through clothing. Blend art, culture, and commerce to create collections that define how people express themselves.',
    tags: ['Illustration', 'Textiles', 'Trend Research', 'CAD'],
    cluster: 'Creative',
    interests: ['Art & Design', 'Music & Arts', 'Writing & Media'],
    prerequisites: ['Drawing', 'Sewing Basics', 'Art History'],
    studyPath: ['Fashion Illustration', 'Textile Design', 'Pattern Making', 'Portfolio Building', 'Fashion Business'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    avgSalary: '₹4-20 LPA',
    growth: '12%',
    linkedinProfiles: [
      { name: 'Virgil Abloh', title: 'Founder Off-White, Ex-Louis Vuitton CD', url: 'https://www.linkedin.com/in/virgil-abloh/', avatar: 'https://i.pravatar.cc/150?img=43' },
      { name: 'Sabyasachi Mukherjee', title: 'Founder Sabyasachi, India\'s Top Designer', url: 'https://www.linkedin.com/in/sabyasachi-mukherjee/', avatar: 'https://i.pravatar.cc/150?img=44' },
      { name: 'Masaba Gupta', title: 'Fashion Designer & Founder House of Masaba', url: 'https://www.linkedin.com/in/masaba-gupta/', avatar: 'https://i.pravatar.cc/150?img=45' }
    ]
  },
  {
    _id: '16',
    title: 'Sports Coach / Athlete',
    description: 'Turn physical excellence into a profession. Train athletes, build performance programs, or compete professionally in your sport.',
    tags: ['Fitness', 'Nutrition', 'Coaching', 'Performance'],
    cluster: 'Health',
    interests: ['Sports & Fitness', 'Helping People'],
    prerequisites: ['Sports Background', 'Fitness Knowledge', 'Communication'],
    studyPath: ['Sports Science', 'Coaching Certification', 'Nutrition', 'Performance Analytics', 'Sports Management'],
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    avgSalary: '₹4-30 LPA',
    growth: '18%',
    linkedinProfiles: [
      { name: 'Neeraj Chopra', title: 'Olympic Gold Medalist, Javelin Thrower', url: 'https://www.linkedin.com/in/neeraj-chopra-athlete/', avatar: 'https://i.pravatar.cc/150?img=46' },
      { name: 'Mary Kom', title: '6x World Boxing Champion, Olympic Medalist', url: 'https://www.linkedin.com/in/mc-mary-kom/', avatar: 'https://i.pravatar.cc/150?img=47' },
      { name: 'Pullela Gopichand', title: 'Chief Badminton Coach, India', url: 'https://www.linkedin.com/in/pullela-gopichand/', avatar: 'https://i.pravatar.cc/150?img=48' }
    ]
  },
  {
    _id: '17',
    title: 'Music Producer / Composer',
    description: 'Create the soundtracks of culture. Produce beats, compose film scores, and shape music that moves millions of people emotionally.',
    tags: ['DAW', 'Music Theory', 'Mixing', 'Sound Design'],
    cluster: 'Creative',
    interests: ['Music & Arts', 'Art & Design', 'Writing & Media'],
    prerequisites: ['Music Theory', 'Instrument/DAW Basics', 'Ear Training'],
    studyPath: ['Music Theory', 'DAW (Ableton/FL Studio)', 'Mixing & Mastering', 'Sound Design', 'Music Business'],
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    avgSalary: '₹3-40 LPA',
    growth: '15%',
    linkedinProfiles: [
      { name: 'A.R. Rahman', title: 'Oscar-winning Composer & Music Producer', url: 'https://www.linkedin.com/in/arrahman/', avatar: 'https://i.pravatar.cc/150?img=49' },
      { name: 'Rick Rubin', title: 'Legendary Music Producer, Co-founder Def Jam', url: 'https://www.linkedin.com/in/rickrubin/', avatar: 'https://i.pravatar.cc/150?img=50' },
      { name: 'Pritam Chakraborty', title: 'Bollywood Music Composer & Producer', url: 'https://www.linkedin.com/in/pritam-chakraborty/', avatar: 'https://i.pravatar.cc/150?img=51' }
    ]
  },
  {
    _id: '18',
    title: 'Civil / Structural Engineer',
    description: 'Build the physical world. Design bridges, skyscrapers, and infrastructure that billions of people rely on every single day.',
    tags: ['AutoCAD', 'Structural Analysis', 'Project Management', 'Math'],
    cluster: 'Engineering',
    interests: ['Science & Research', 'Tech & Coding'],
    prerequisites: ['Math', 'Physics', 'Drawing'],
    studyPath: ['Engineering Degree', 'AutoCAD/Revit', 'Structural Analysis', 'Site Management', 'PMP Certification'],
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    avgSalary: '₹5-25 LPA',
    growth: '11%',
    linkedinProfiles: [
      { name: 'Arup Group', title: 'Global Engineering & Design Firm', url: 'https://www.linkedin.com/company/arup/', avatar: 'https://i.pravatar.cc/150?img=52' },
      { name: 'Bechtel Corporation', title: 'World\'s Largest Construction Company', url: 'https://www.linkedin.com/company/bechtel/', avatar: 'https://i.pravatar.cc/150?img=53' },
      { name: 'Larsen & Toubro', title: 'India\'s Largest Engineering Conglomerate', url: 'https://www.linkedin.com/company/larsen-toubro/', avatar: 'https://i.pravatar.cc/150?img=54' }
    ]
  },
  {
    _id: '19',
    title: 'Journalist / Writer',
    description: 'Be the voice of truth. Investigate stories, interview world leaders, and shape public opinion through the power of words.',
    tags: ['Writing', 'Reporting', 'Research', 'Ethics'],
    cluster: 'Media',
    interests: ['Writing & Media', 'Helping People'],
    prerequisites: ['Writing Skills', 'Curiosity', 'Research'],
    studyPath: ['Journalism Degree', 'Beat Reporting', 'Investigative Journalism', 'Digital Media', 'Multimedia Storytelling'],
    imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    avgSalary: '₹3-20 LPA',
    growth: '8%',
    linkedinProfiles: [
      { name: 'Barkha Dutt', title: 'Senior Journalist & Founder Mojo Story', url: 'https://www.linkedin.com/in/barkha-dutt/', avatar: 'https://i.pravatar.cc/150?img=55' },
      { name: 'Rajdeep Sardesai', title: 'Consulting Editor, India Today Group', url: 'https://www.linkedin.com/in/rajdeep-sardesai/', avatar: 'https://i.pravatar.cc/150?img=56' },
      { name: 'Faye D\'Souza', title: 'Independent Journalist & Anchor', url: 'https://www.linkedin.com/in/faye-dsouza/', avatar: 'https://i.pravatar.cc/150?img=57' }
    ]
  },
  {
    _id: '20',
    title: 'Doctor / Physician',
    description: 'The most trusted profession. Diagnose, treat, and heal patients. Combine science and humanity to save and improve lives.',
    tags: ['Medicine', 'Diagnosis', 'Anatomy', 'Empathy'],
    cluster: 'Health',
    interests: ['Helping People', 'Science & Research'],
    prerequisites: ['Biology', 'Chemistry', 'Physics', 'Dedication'],
    studyPath: ['NEET / Medical Entrance', 'MBBS (5.5 yrs)', 'Internship', 'PG / Specialization', 'Practice'],
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
    avgSalary: '₹8-80 LPA',
    growth: '18%',
    linkedinProfiles: [
      { name: 'Devi Shetty', title: 'Founder Narayana Health, Cardiac Surgeon', url: 'https://www.linkedin.com/in/devi-shetty-narayana/', avatar: 'https://i.pravatar.cc/150?img=58' },
      { name: 'Atul Gawande', title: 'Surgeon, Author & Public Health Leader', url: 'https://www.linkedin.com/in/atul-gawande/', avatar: 'https://i.pravatar.cc/150?img=59' },
      { name: 'Soumya Swaminathan', title: 'Ex-Chief Scientist WHO, ICMR Director', url: 'https://www.linkedin.com/in/soumya-swaminathan-who/', avatar: 'https://i.pravatar.cc/150?img=60' }
    ]
  }
];

// ==========================================
//  INTEREST → CAREER MAPPING
// ==========================================
const INTEREST_MAP = {
  'Tech & Coding':      ['Technology', 'Engineering'],
  'Art & Design':       ['Design', 'Creative'],
  'Business & Money':   ['Business', 'Finance', 'Marketing'],
  'Science & Research': ['Science', 'Technology', 'Health', 'Engineering'],
  'Writing & Media':    ['Media', 'Creative'],
  'Sports & Fitness':   ['Health'],
  'Music & Arts':       ['Creative', 'Media'],
  'Helping People':     ['Health', 'Social']
};

// Sort careers by user interests: matching careers first
function sortCareersByInterests(allCareers, userInterests) {
  if (!userInterests || userInterests.length === 0) return allCareers;

  const preferredClusters = new Set();
  userInterests.forEach(interest => {
    (INTEREST_MAP[interest] || []).forEach(cluster => preferredClusters.add(cluster));
  });

  const matching = allCareers.filter(c =>
    preferredClusters.has(c.cluster) ||
    (c.interests || []).some(i => userInterests.includes(i))
  );
  const rest = allCareers.filter(c => !matching.find(m => m._id === c._id));

  // Shuffle both groups so it's not always the same order
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  return [...shuffle(matching), ...shuffle(rest)];
}

// Recommendation logic
function getRecommendations(swipeHistory, allCareers) {
  const likedTags = {};
  const likedClusters = {};

  swipeHistory.forEach(({ careerId, action }) => {
    const career = allCareers.find(c => c._id === careerId);
    if (!career) return;
    const weight = action === 'superlike' ? 3 : action === 'like' ? 1 : action === 'superDislike' ? -3 : -1;
    career.tags.forEach(tag => { likedTags[tag] = (likedTags[tag] || 0) + weight; });
    likedClusters[career.cluster] = (likedClusters[career.cluster] || 0) + weight;
  });

  const superDislikedIds = swipeHistory.filter(s => s.action === 'superDislike').map(s => s.careerId);
  const pool = superDislikedIds.length < allCareers.length
    ? allCareers.filter(c => !superDislikedIds.includes(c._id))
    : allCareers;

  const scored = pool.map(career => {
    let score = 0;
    career.tags.forEach(tag => { score += likedTags[tag] || 0; });
    score += (likedClusters[career.cluster] || 0) * 2;
    return { ...career, score };
  });

  const result = scored.sort((a, b) => b.score - a.score).slice(0, 3);
  return result.length > 0 ? result : allCareers.slice(0, 3);
}

// ── API Routes ──
app.get('/api/careers', (req, res) => {
  const { interests } = req.query;
  const userInterests = interests ? interests.split(',') : [];
  const sorted = sortCareersByInterests([...careers], userInterests);
  res.json(sorted);
});

app.post('/api/recommendations', (req, res) => {
  const { swipeHistory } = req.body;
  if (!swipeHistory || swipeHistory.length === 0) return res.json(careers.slice(0, 3));
  res.json(getRecommendations(swipeHistory, careers));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SwipePath AI running on http://localhost:${PORT}`));