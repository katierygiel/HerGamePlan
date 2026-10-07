import emilyImg from "../assets/emily-parker.jpg";
import emmaImg from "../assets/emma-wilson.jpg";
import trainersImg from "../assets/article-trainers.jpg";

const H = 3600e3;
const D = 24 * H;
const ago = (ms) => Date.now() - ms;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

export const DEMO_EMAIL = "demo@hergameplan.app";
export const DEMO_PASSWORD = "playmaker";

export const ROLES = [
  { id: "Athlete", blurb: "Competing or recently retired" },
  { id: "Coach", blurb: "Leading teams and athletes" },
  { id: "Media & Content", blurb: "Reporting, producing, creating" },
  { id: "Marketing & Sponsorship", blurb: "Brand, partnerships, growth" },
  { id: "Operations & Management", blurb: "Front office and events" },
  { id: "Design & Creative", blurb: "Visual, motion, product" },
  { id: "Student", blurb: "Breaking into the industry" },
  { id: "Fan & Advocate", blurb: "Championing women in sports" },
];

export const INTEREST_OPTIONS = [
  "Design", "Entry Level", "New York", "Photoshop", "Social Media", "Illustration",
  "Web", "Marketing", "Video", "Branding", "Copywriting", "Photography", "Sports",
  "Motion Design", "UX/UI Design", "Public Relations", "App Development",
  "Coaching", "Analytics", "Journalism", "Sponsorship", "Events", "Operations",
  "Leadership", "Remote", "Internship", "Strength & Conditioning", "Content Creation",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Freelance"];
export const APP_STATUSES = [
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "closed", label: "Closed" },
];

/* ---------------- people ---------------- */
const goal = (id, term, title, steps, extra = {}) => ({
  id, term, title, isPublic: true, ts: ago(6 * D), completedAt: null, cheers: [], comments: [],
  steps: steps.map(([label, done], i) => ({ id: `${id}_s${i}`, label, done })), ...extra,
});

const PEOPLE = () => [
  {
    id: "u_carla", name: "Carla Jennings", headline: "Creative Director at Her Game Plan", role: "Design & Creative",
    city: "New York", state: "NY", mentor: false, years: 9,
    bio: "Building brands for women's sports. I hire designers who care about the game as much as the grid.",
    interests: ["Design", "Branding", "Sports", "Leadership"], goals: [],
  },
  {
    id: "u_emily", name: "Emily Parker", headline: "Sports Reporter · Toronto", role: "Media & Content", photo: emilyImg,
    city: "Toronto", state: "ON", mentor: true, field: "Media", years: 6, capacity: "Open to 2 mentees",
    expertise: ["Journalism", "Video", "Social Media", "Content Creation"],
    bio: "Rising voice in sports reporting and content creation. I broke into a male-dominated press box and I'm happy to share the playbook.",
    interests: ["Journalism", "Video", "Sports"], goals: [],
  },
  {
    id: "u_sarah", name: "Sarah Johnson", headline: "Head Athletic Trainer, USA Women's Basketball", role: "Coach",
    city: "Colorado Springs", state: "CO", mentor: true, field: "Wellness", years: 14, capacity: "Open to 1 mentee",
    expertise: ["Strength & Conditioning", "Leadership", "Coaching"],
    bio: "Fourteen years keeping elite athletes healthy, and learning to keep myself healthy too. Ask me about boundaries and burnout.",
    interests: ["Coaching", "Leadership", "Sports"], goals: [],
  },
  {
    id: "u_olivia", name: "Olivia Carter", headline: "Sports Marketing Manager, Sports Apparel", role: "Marketing & Sponsorship",
    city: "Portland", state: "OR", mentor: true, field: "Marketing", years: 8, capacity: "Open to 3 mentees",
    expertise: ["Marketing", "Branding", "Social Media", "Public Relations"],
    bio: "I help athletes and early-career pros build personal brands that open doors.",
    interests: ["Marketing", "Branding", "Social Media"], goals: [],
  },
  {
    id: "u_isabella", name: "Isabella Tran", headline: "Marketing Manager, Sports Sponsorship", role: "Marketing & Sponsorship",
    city: "Chicago", state: "IL", mentor: true, field: "Sponsorship", years: 7, capacity: "Open to 2 mentees",
    expertise: ["Sponsorship", "Marketing", "Events", "Entry Level"],
    bio: "Turned a lifelong fandom into a career in sponsorship. Happy to map entry points with you.",
    interests: ["Sponsorship", "Events", "Marketing"], goals: [],
  },
  {
    id: "u_jevans", name: "Jessica Evans", headline: "Head Coach, D1 NCAA Men's Basketball", role: "Coach",
    city: "Durham", state: "NC", mentor: true, field: "Leadership", years: 16, capacity: "Waitlist",
    expertise: ["Coaching", "Leadership", "Operations"],
    bio: "Leading in rooms that weren't built with me in mind. I coach confidence, negotiation, and voice.",
    interests: ["Coaching", "Leadership"], goals: [],
  },
  {
    id: "u_nina", name: "Nina Torres", headline: "Brand Designer, Courtside Collective", role: "Design & Creative",
    city: "Brooklyn", state: "NY", mentor: true, field: "Design", years: 5, capacity: "Open to 2 mentees",
    expertise: ["Design", "Branding", "Illustration", "Motion Design", "UX/UI Design"],
    bio: "Designing for sports brands. I review portfolios and tell you what I actually think.",
    interests: ["Design", "Branding", "Illustration"],
    goals: [
      goal("g_nina1", "long", "Redesign my portfolio", [["Audit current work", true], ["Write 3 case studies", true], ["Rebuild site in Figma", false], ["Launch and share", false]], {
        comments: [{ id: "gc1", authorId: "u_emily", text: "Case studies are what get you interviews. You've got this!", ts: ago(2 * D) }], cheers: ["u_carla"],
      }),
    ],
  },
  {
    id: "u_priya", name: "Priya Anand", headline: "Performance Analyst, WNBA", role: "Operations & Management",
    city: "Seattle", state: "WA", mentor: true, field: "Analytics", years: 6, capacity: "Open to 1 mentee",
    expertise: ["Analytics", "Operations", "Sports"],
    bio: "Data nerd for hoops. Ask me how to turn a stats class into a front-office job.",
    interests: ["Analytics", "Sports"], goals: [],
  },
  {
    id: "u_jthomas", name: "Jessica Thomas", headline: "Talent Partner, Victory Creative", role: "Marketing & Sponsorship",
    city: "New York", state: "NY", mentor: false, years: 5,
    bio: "Recruiting creative talent for sports and entertainment brands.", interests: ["Design", "Marketing"], goals: [],
  },
  {
    id: "u_ecarter", name: "Emily Carter", headline: "Hiring Manager, Promotion Media", role: "Marketing & Sponsorship",
    city: "Brooklyn", state: "NY", mentor: false, years: 7,
    bio: "Always looking for sharp junior designers.", interests: ["Design", "Social Media"], goals: [],
  },
  {
    id: "u_maria", name: "Maria Lopez", headline: "Senior, Sport Management", role: "Student",
    city: "Boston", state: "MA", mentor: false, years: 0,
    bio: "Soccer player turned aspiring sports marketer.", interests: ["Marketing", "Internship", "Sports"],
    goals: [
      goal("g_maria1", "short", "Apply to 5 marketing internships", [["Update resume", true], ["Draft cover letter", true], ["Apply to 3 teams", false], ["Apply to 2 agencies", false]], {
        cheers: ["u_olivia", "u_isabella"], comments: [{ id: "gc2", authorId: "u_olivia", text: "Tailor each cover letter to the team's recent campaigns. Rooting for you!", ts: ago(1 * D) }],
      }),
    ],
  },
  {
    id: "u_devon", name: "Devon Price", headline: "Operations Intern, Metro Women's Hockey", role: "Operations & Management",
    city: "Boston", state: "MA", mentor: false, years: 1,
    bio: "Game-day ops and spreadsheets.", interests: ["Operations", "Events"],
    goals: [
      goal("g_devon1", "long", "Run game-day ops for a full home stand", [["Shadow ops lead", true], ["Own the volunteer schedule", true], ["Lead a pregame briefing", false]], { cheers: ["u_sarah"] }),
    ],
  },
  { id: "u_rachel", name: "Rachel Kim", headline: "Team Operations Coordinator", role: "Operations & Management", city: "Austin", state: "TX", mentor: false, years: 3, bio: "Logistics for a pro soccer club.", interests: ["Operations"], goals: [] },
  { id: "u_sam", name: "Sam Okafor", headline: "Sophomore, Communications", role: "Student", city: "Atlanta", state: "GA", mentor: false, years: 0, bio: "Learning the ropes.", interests: ["Journalism", "Video"], goals: [] },
];

/* ---------------- jobs ---------------- */
const JOBS = () => [
  { id: "j1", title: "Graphic Designer", company: "Her Game Plan", hgp: true, location: "New York, NY", remote: false, type: "Full-time", pay: "$50K–$60K/yr", ts: ago(7 * D), tags: ["Design", "Branding", "Illustration", "Photoshop", "Social Media"], postedBy: "u_carla", interested: 5,
    desc: "Shape the visual identity of the network built by and for women in sports. You'll design campaign assets, app marketing, event collateral, and social content that feels bold and welcoming.",
    reqs: ["1–3 years of professional or freelance design experience", "Fluency in Photoshop, Illustrator, and Figma", "A portfolio that shows range and a clear point of view", "Passion for women's sports and community"] },
  { id: "j2", title: "Jr. Graphic Designer", company: "Promotion Media", location: "Brooklyn, NY", remote: false, type: "Full-time", pay: "$50K/yr", ts: ago(3 * D), tags: ["Design", "Entry Level", "Social Media", "Photoshop"], postedBy: "u_ecarter", interested: 3,
    desc: "Support our creative team producing promotional graphics for sports and entertainment clients. Great first role for a recent grad who loves fast turnarounds.",
    reqs: ["Degree or equivalent experience in graphic design", "Photoshop and Illustrator", "Comfortable with feedback and deadlines"] },
  { id: "j3", title: "Motion Graphics Intern", company: "NextPlay Digital", location: "Hoboken, NJ", remote: false, type: "Internship", pay: "$22/hr", ts: ago(1 * D), tags: ["Motion Design", "Video", "Internship", "Design"], postedBy: null, interested: 4,
    desc: "Animate highlight packages and social bumpers for live sports streams. You'll learn broadcast graphics workflows from a team that ships weekly.",
    reqs: ["After Effects basics", "A reel or portfolio, even student work", "Available 20+ hours per week"] },
  { id: "j4", title: "Digital Design Assistant", company: "Champion Branding Co.", location: "Long Island, NY", remote: false, type: "Full-time", pay: "$50K/yr", ts: ago(30 * D), tags: ["Design", "Web", "Branding", "Entry Level"], postedBy: null, interested: 4,
    desc: "Assist senior designers on brand systems and websites for athletic apparel and training brands.",
    reqs: ["Figma or Sketch", "Understanding of brand systems", "Strong attention to detail"] },
  { id: "j5", title: "Graphic Design Assistant", company: "Victory Creative", location: "Manhattan, NY", remote: false, type: "Part-time", pay: "$45K/yr", ts: ago(5 * D), tags: ["Design", "Entry Level", "Illustration", "Sports"], postedBy: "u_jthomas", interested: 4,
    desc: "Part-time role supporting a boutique agency that creates campaigns for women's leagues and athletes.",
    reqs: ["Portfolio link required", "Illustration skills a plus", "Hybrid, 3 days in office"] },
  { id: "j6", title: "Jr. Visual Communication Designer", company: "Courtvision Studios", location: "Manhattan, NY", remote: false, type: "Full-time", pay: "$47K/yr", ts: ago(14 * D), tags: ["Design", "UX/UI Design", "Entry Level", "Video"], postedBy: null, interested: 6,
    desc: "Create visual systems for broadcast and digital products covering college athletics.",
    reqs: ["Visual communication or design degree", "Presentation-ready portfolio", "Interest in broadcast and live production"] },
  { id: "j7", title: "Social Media Coordinator", company: "Metro Women's Hockey", location: "Boston, MA", remote: false, type: "Full-time", pay: "$48K/yr", ts: ago(2 * D), tags: ["Social Media", "Content Creation", "Sports", "Marketing", "Entry Level"], postedBy: "u_olivia", interested: 9,
    desc: "Own day-to-day social for a growing pro hockey club: game-day content, player features, and community storytelling.",
    reqs: ["Experience running social accounts", "Photo and short-form video editing", "Willing to work some nights and weekends"] },
  { id: "j8", title: "Brand Design Intern", company: "Courtside Collective", location: "Remote", remote: true, type: "Internship", pay: "$20/hr", ts: ago(4 * D), tags: ["Design", "Branding", "Internship", "Remote"], postedBy: "u_nina", interested: 7,
    desc: "Remote internship supporting brand refreshes for women-led sports startups. Mentorship from senior designers included.",
    reqs: ["Currently enrolled or recent grad", "Portfolio with at least two projects", "Reliable internet and a creative curiosity"] },
  { id: "j9", title: "Content Producer", company: "Ridge Sports Network", location: "Remote", remote: true, type: "Freelance", pay: "$35–$55/hr", ts: ago(6 * D), tags: ["Video", "Content Creation", "Journalism", "Remote", "Sports"], postedBy: "u_emily", interested: 5,
    desc: "Freelance producer for features and short-form video on women's sports across North America.",
    reqs: ["Shooting and editing experience", "Story instincts", "Quick turnaround"] },
  { id: "j10", title: "Partnerships Associate", company: "Summit Athletics", location: "Philadelphia, PA", remote: false, type: "Full-time", pay: "$55K/yr", ts: ago(9 * D), tags: ["Sponsorship", "Marketing", "Events", "Sports"], postedBy: "u_isabella", interested: 8,
    desc: "Support the partnerships team activating sponsors across a multi-sport athletic department.",
    reqs: ["Strong writing and organization", "Interest in sponsorship and events", "Bachelor's degree"] },
];

/* ---------------- articles ---------------- */
const ARTICLES = () => [
  {
    id: "a1", cat: "Wellness", read: 5, photo: trainersImg, authorId: "u_sarah",
    title: "Balancing Work and Wellness: Self-Care Tips for Women in Sports Careers",
    author: "Sarah Johnson", role: "Head Athletic Trainer | USA Women's Basketball",
    excerpt: "Sarah Johnson, Head Athletic Trainer for the USA Women's National Basketball Team, provides tips for managing the stress and physical demands of the sports industry while maintaining a healthy work-life balance.",
    blocks: [
      { p: "Working in professional sports, especially as a woman, can be incredibly rewarding, but it's also a fast-paced, high-pressure environment. When you're constantly managing players' injuries, coordinating team schedules, and attending to the needs of high-performance athletes, it can be easy to neglect your own wellness." },
      { p: "In this article, I'll discuss my journey to finding balance between my career and personal well-being, along with practical self-care strategies that can be applied to any woman working in the sports industry." },
      { h: "Prioritize Physical Activity", p: "I've always been active, but working in a physically demanding environment has sometimes made it difficult to prioritize my own fitness. As an athletic trainer, my days revolve around physical care for the players, so it's easy to forget my own body. Whether it's a morning walk or a restorative yoga session before bed, physical activity helps me recharge. It's easy to skip out on self-care when your job demands so much of you, but I've found that investing in my health ultimately helps me perform better at work, too." },
      { h: "Set Boundaries", p: "Another critical aspect of wellness is setting boundaries, which I've struggled with throughout my career. In sports, especially in the competitive environment of professional basketball, there's often an unspoken expectation to be \"on\" 24/7. But I've learned that constantly saying \"yes\" to every request, whether from coaches or players, leads to burnout.\n\nSetting clear boundaries around work hours and learning to say \"no\" has been one of the most effective strategies I've used to protect my well-being. This might mean turning off emails after hours or scheduling \"me time\" on my calendar." },
      { h: "Mental Health Matters", p: "The mental and emotional side of wellness is just as important as physical health. The stress of working in sports can sometimes feel overwhelming, and I've realized that taking care of my mental health is crucial.\n\nFor me, journaling and talking with a therapist has been extremely helpful in managing work-related stress. A lot of the time, I don't realize how much tension I'm carrying until I take a moment to reflect. Being able to process emotions and thoughts outside of the workplace has helped me maintain a healthier perspective." },
      { h: "Build a Support System", p: "Having a network of women who understand the unique challenges I face in sports has been invaluable. I've found support through other women in similar roles, and I try to be that support for others as well. Whether it's swapping advice on how to manage stress or simply sharing experiences, having these relationships makes a huge difference.\n\nUltimately, self-care isn't a luxury — it's a necessity. By prioritizing my health and setting boundaries, I'm not only better equipped to handle the demands of my job, but I'm also setting a positive example for the players I work with." },
    ],
    comments: [
      { id: "ac1", authorId: "u_maria", text: "The boundaries section hit home. Needed this today.", ts: ago(2 * H) },
      { id: "ac2", authorId: "u_devon", text: "Starting a journaling habit tonight because of this.", ts: ago(5 * H) },
    ],
  },
  {
    id: "a2", cat: "Branding", read: 4, authorId: "u_olivia",
    title: "Building a Personal Brand in Sports: How to Stand Out and Get Noticed",
    author: "Olivia Carter", role: "Sports Marketing Manager | Sports Apparel Company",
    excerpt: "Olivia Carter, Sports Marketing Manager for a Sports Apparel Company, discusses ways to create a strong personal brand through social media, networking, and showcasing expertise.",
    blocks: [
      { p: "Your personal brand is how the industry remembers you before you're even in the room. The good news: you don't need a huge following. You need a clear point of view and consistency." },
      { h: "Get specific", p: "Finish this sentence: \"I help ___ by ___.\" Women who are known for something specific, like game-day content, analytics, or athlete storytelling, get the call when that need comes up." },
      { h: "Treat social like a portfolio in motion", p: "Post the work, and the process behind it. Share a lesson from a project, a takeaway from a panel, or a behind-the-scenes look at your craft. Two thoughtful posts a week beats a daily scramble." },
      { h: "Network in real time", p: "Every conversation, DM, or panel question is a chance to reinforce what you stand for. Follow up within 48 hours with something useful: an article, an intro, a specific compliment." },
      { h: "Share expertise generously", p: "Sharing what you know builds trust faster than any resume line. Answer questions in communities like this one, and you'll be surprised who's watching." },
    ],
    comments: [{ id: "ac3", authorId: "u_nina", text: "Great breakdown, saving this for later.", ts: ago(1 * D) }],
  },
  {
    id: "a3", cat: "Career", read: 4, authorId: "u_isabella",
    title: "From Fan to Pro: How to Transition from a Passion for Sports to a Career",
    author: "Isabella Tran", role: "Marketing Manager | Sports Sponsorship",
    excerpt: "Isabella Tran, Marketing Manager in Sports Sponsorship, guides women on how to leverage their love of sports into a meaningful and successful career, whether in management, media, coaching, or behind-the-scenes.",
    blocks: [
      { p: "Loving a sport and building a career around it are two different skill sets, and the second one is learned on purpose." },
      { h: "Map the roles you don't see on TV", p: "Sponsorship, operations, analytics, content, community, partnerships, ticketing. Most entry points live behind the scenes. Browse job boards by function, not just by team." },
      { h: "Get proximity early", p: "Volunteer at events, intern relentlessly, and say yes to the unglamorous shifts. Proximity teaches you the industry's language faster than any course." },
      { h: "Turn fandom into insight", p: "Your fandom is an asset. You understand what fans want. Translate that into pitches: a campaign idea, a content series, a better game-day moment." },
      { h: "Ask for 15 minutes", p: "People in this industry remember who helped them. A specific, short ask (\"Could I get 15 minutes of your advice on breaking into partnerships?\") gets a yes more often than you'd think." },
    ],
    comments: [{ id: "ac4", authorId: "u_sam", text: "Wish I'd read this before applying to internships!", ts: ago(3 * D) }],
  },
  {
    id: "a4", cat: "Confidence", read: 5, authorId: "u_jevans",
    title: "Workplace Confidence: How to Speak Up and Own Your Space in Male-Dominated Environments",
    author: "Jessica Evans", role: "Head Coach | D1 NCAA Men's Basketball Team",
    excerpt: "Jessica Evans, Head Coach of a D1 NCAA Men's Basketball Team, offers tips for cultivating confidence and assertiveness, from negotiating salaries to contributing ideas in meetings.",
    blocks: [
      { p: "Confidence in rooms that weren't built with you in mind is a practiced skill, not a personality trait you either have or don't." },
      { h: "Prepare your first sentence", p: "Knowing exactly how you'll start removes the hesitation of speaking up. Write down your point before the meeting and plan to speak in the first ten minutes." },
      { h: "Negotiate like it's part of the job", p: "Because it is. Come with market data and a specific number, not apologies. Practice out loud with a mentor or friend before the real conversation." },
      { h: "Don't shrink the ask", p: "Cut filler like \"just\" and \"sorry, but.\" Say \"I recommend\" or \"I'd like to propose.\" Direct isn't rude. It's respected." },
      { h: "Take space, make space", p: "Every time you take up space well, you make it a little easier for the next woman in the room. Then hold the door: credit others' ideas out loud and sponsor someone coming up behind you." },
    ],
    comments: [
      { id: "ac5", authorId: "u_priya", text: "\"Negotiate like it's part of the job.\" Needed to hear that.", ts: ago(6 * H) },
      { id: "ac6", authorId: "u_rachel", text: "Sharing this with my whole team.", ts: ago(1 * D) },
    ],
  },
];

export const VIDEO = {
  id: "v1", series: "Journey to Today", name: "Emily Parker", personId: "u_emily", role: "Sports Reporter", location: "Toronto, Ontario",
  title: "Sports Reporter: Day in My Life", length: 192, photo: emilyImg,
  blurb: "In the Video of the Week, Emily Parker, a rising star in sports reporting and content creation, shares her journey from breaking into the male-dominated sports media world to becoming a trusted voice in the industry. She discusses the challenges, the breakthroughs, and the key moments that shaped her career, offering valuable insights and advice for anyone looking to carve their own path in sports journalism. Whether you're passionate about sports or pursuing a career in media, Emily's story is a must-watch for motivation and practical tips.",
  chapters: [[0, "Breaking into the press box"], [58, "Finding your voice on camera"], [121, "Advice for your first year"], [170, "Where to start this week"]],
};

/* ---------------- feed ---------------- */
const POSTS = () => [
  { id: "p1", authorId: "u_maria", type: "win", ts: ago(3 * H), text: "Just got an interview with a pro women's soccer club for their marketing internship! Thank you to everyone who reviewed my resume here.", likes: ["u_olivia", "u_isabella", "u_nina", "u_carla"], comments: [{ id: "pc1", authorId: "u_olivia", text: "So proud of you! Send me your prep questions if you want a mock interview.", ts: ago(2 * H) }] },
  { id: "p2", authorId: "u_isabella", type: "event", ts: ago(8 * H), text: "Hosting a free virtual meetup for women starting out in sports sponsorship. Bring your questions!", event: { when: "Thu, Oct 16 · 7:00 PM ET", where: "Virtual" }, likes: ["u_maria", "u_sam", "u_devon"], comments: [] },
  { id: "p3", authorId: "u_devon", type: "question", ts: ago(1 * D), text: "How did you all approach salary negotiation for your first sports job? I'm nervous about asking for more than the posted number.", likes: ["u_maria"], comments: [
    { id: "pc2", authorId: "u_jevans", text: "Always counter. Come with market data and say it out loud with confidence. Most offers have room.", ts: ago(20 * H) },
    { id: "pc3", authorId: "u_priya", text: "Check what comparable analyst/ops roles pay in your city, then anchor 5–10% above.", ts: ago(18 * H) } ] },
  { id: "p4", authorId: "u_emily", type: "update", ts: ago(1.5 * D), text: "New Video of the Week is live! I talk about breaking into sports media and what I wish I'd known in year one.", likes: ["u_maria", "u_sam", "u_nina", "u_carla", "u_devon"], comments: [] },
  { id: "p5", authorId: "u_nina", type: "update", ts: ago(2 * D), text: "Portfolio tip: lead with one project and tell the whole story (problem, process, result). Recruiters spend about 60 seconds on a first pass.", likes: ["u_maria", "u_carla", "u_jthomas"], comments: [] },
  { id: "p6", authorId: "u_rachel", type: "win", ts: ago(3 * D), text: "Promoted to Team Operations Coordinator today. Mentors, this network is real. Thank you.", likes: ["u_sarah", "u_priya", "u_devon", "u_isabella"], comments: [] },
  { id: "p7", authorId: "u_sam", type: "question", ts: ago(4 * D), text: "Any recommendations for beginner-friendly ways to build a sports journalism portfolio while still in school?", likes: [], comments: [{ id: "pc4", authorId: "u_emily", text: "Start a student-athlete spotlight series. It's easy to shoot, easy to share, and it shows range.", ts: ago(3.5 * D) }] },
];

/* ---------------- shared + personal ---------------- */
export const SEED_SHARED = () => ({ people: PEOPLE(), jobs: JOBS(), articles: ARTICLES(), posts: POSTS(), reports: [] });

export const blankPersonal = ({ firstName = "", lastName = "", email = "" } = {}) => ({
  me: { id: "me", firstName, lastName, email, role: "", headline: "", bio: "", city: "", state: "", phone: "", portfolio: "", resume: "", photo: null, interests: [], onboarded: false },
  goals: [], saved: [], applications: [], mentorRequests: [], bookmarks: [], connections: [], blocked: [], activity: [],
  conversations: [],
  notifications: [{ id: "n_welcome", kind: "welcome", text: "Welcome to Her Game Plan. Set your first goal to get started.", ts: Date.now(), read: false, to: { name: "goals" } }],
  settings: { notifications: true, discoverable: true },
});

export const demoPersonal = () => {
  const now = Date.now();
  return {
    me: { id: "me", firstName: "Emma", lastName: "Wilson", email: DEMO_EMAIL, role: "Design & Creative", headline: "Class of 2025 Visual Design Student", bio: "Visual design grad who loves sports branding. Looking for my first role on a creative team.", city: "Mahwah", state: "NJ", phone: "123-456-7890", portfolio: "emmawilson.portfolio.com", resume: "emmawilsonresume.pdf", photo: emmaImg, interests: ["Design", "Entry Level", "New York", "Photoshop", "Social Media", "Illustration"], onboarded: true },
    goals: [
      goal("g1", "short", "Apply to 2 jobs today", [["Jr. Graphic Designer NYY", true], ["Jr. Graphic Designer PHI", false]], { isPublic: false, ts: ago(2 * H) }),
      goal("g2", "long", "Complete Capstone Project", [
        ["Project scope and goals", true], ["Conduct research", true], ["Develop a design brief", true], ["Sketch and brainstorm", true],
        ["Select design tools", true], ["Create low-fidelity prototypes", true], ["Test prototypes", true], ["Refine prototypes", true],
        ["Gather more feedback", true], ["Create case study", false], ["Final essay", false], ["Presentation", false],
      ], { isPublic: true, ts: ago(30 * D), cheers: ["u_carla", "u_jthomas", "u_nina"], comments: [
        { id: "gc10", authorId: "u_jthomas", text: "You're almost there. The case study is the fun part!", ts: ago(1 * D) },
        { id: "gc11", authorId: "u_carla", text: "Following along, can't wait to see the final presentation.", ts: ago(2 * D) } ] }),
    ],
    saved: ["j3", "j7"],
    applications: [
      { id: "ap1", jobId: "j2", jobSnap: { title: "Jr. Graphic Designer", company: "Promotion Media" }, status: "interviewing", ts: ago(4 * D), note: "Phone screen went well. Portfolio review Friday.", form: {} },
      { id: "ap2", jobId: "j5", jobSnap: { title: "Graphic Design Assistant", company: "Victory Creative" }, status: "applied", ts: ago(2 * D), note: "", form: {} },
    ],
    mentorRequests: [], bookmarks: ["a1"], connections: ["u_carla", "u_emily"], blocked: [],
    activity: [dayKey(now), dayKey(now - D), dayKey(now - 2 * D)],
    conversations: [
      { id: "c_u_carla", userId: "u_carla", unread: 1, messages: [
        { id: "m1", from: "u_carla", text: "Hi Emma! Loved your capstone case study. We have a Graphic Designer opening you should look at.", ts: ago(26 * H) },
        { id: "m2", from: "me", text: "Thank you so much, Carla! I'm applying this week.", ts: ago(25 * H) },
        { id: "m3", from: "u_carla", text: "Would love to see your portfolio. Feel free to apply!", ts: ago(2 * H) } ] },
      { id: "c_u_jthomas", userId: "u_jthomas", unread: 0, messages: [
        { id: "m4", from: "u_jthomas", text: "Happy to chat more about the Graphic Design Assistant role. Any questions?", ts: ago(1 * D) } ] },
      { id: "c_u_ecarter", userId: "u_ecarter", unread: 0, messages: [
        { id: "m5", from: "u_ecarter", text: "Thanks for applying. We'll be in touch this week.", ts: ago(2 * D) } ] },
    ],
    notifications: [
      { id: "n1", kind: "cheer", text: "Carla Jennings and 2 others cheered on your goal “Complete Capstone Project”", ts: ago(3 * H), read: false, to: { name: "goalSupport", params: { goalId: "g2" } } },
      { id: "n2", kind: "message", text: "Carla Jennings sent you a message", ts: ago(2 * H), read: false, to: { name: "chat", params: { userId: "u_carla" } } },
      { id: "n3", kind: "application", text: "Promotion Media moved your application to Interviewing", ts: ago(1 * D), read: true, to: { name: "tracker" } },
    ],
    settings: { notifications: true, discoverable: true },
  };
};

export { dayKey };
