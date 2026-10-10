import emilyImg from "../assets/emily-parker.jpg";

export const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

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

/** role categories offered on the "Jobs are coming soon" interest list */
export const JOB_INTEREST_ROLES = [
  "Design & Creative", "Social Media & Content", "Marketing & Sponsorship", "Operations & Events",
  "Coaching & Performance", "Media & Journalism", "Analytics & Data", "Internships & Entry Level", "Remote Roles",
];

export const FEEDBACK_KINDS = [
  { id: "idea", label: "Idea" }, { id: "bug", label: "Something's broken" }, { id: "love", label: "I love this" }, { id: "other", label: "Other" },
];

/** Video of the Week: a clearly-labeled concept sample until real episodes are produced */
export const VIDEO = {
  id: "v1", series: "Journey to Today", name: "Featured guest", role: "Sports Reporter", location: "Concept sample",
  title: "Sports Reporter: Day in My Life", length: 192, photo: emilyImg, sample: true,
  blurb: "Concept sample. Each week this space will feature a woman working in sports sharing her path: the challenges, the breakthroughs, and the advice she wishes she'd had in year one. This episode shows the format and is not a real interview.",
  chapters: [[0, "Breaking into the press box"], [58, "Finding your voice on camera"], [121, "Advice for your first year"], [170, "Where to start this week"]],
};
