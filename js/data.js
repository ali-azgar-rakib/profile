/* =====================================================================
   CV DATA — Ali Azgar Rakib
   ---------------------------------------------------------------------
   This one file powers BOTH the resume homepage (index.html) and the
   game (play.html). Edit here and both update.

   • Empty strings ("") hide a field. Empty lists [] hide a whole section.
   • Optional extras you can add later:
       - skills: level 1–5 shows level pips  e.g. { name: "C++", level: 5 }
       - about.stats: [{ label: "...", value: 1–10 }] shows stat bars
       - projects: see the commented example below
   ===================================================================== */

window.CV = {
  name: "Ali Azgar Rakib",
  title: "Game Programmer",
  roles: ["Game Programmer", "Unreal Engine Developer"],
  tagline: "Unreal Engine Developer building gameplay systems with C++ and Blueprint.",
  location: "Bashundhara R/A, Dhaka",
  email: "aliazgarrakib@gmail.com",
  phone: "01628651490",
  avatar: "",       // e.g. "assets/me.jpg"
  resumePdf: "",    // e.g. "assets/Ali-Azgar-Rakib-CV.pdf"

  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/rakib5" },
    { label: "GitHub",   url: "https://github.com/ali-azgar-rakib" }
  ],

  /* ---------- ABOUT ---------- */
  about: {
    years: "3.5+",
    summary:
      "Unreal Engine Developer with over 3.5 years of experience building gameplay systems using " +
      "C++ and Blueprint. Skilled in AI, animation blueprints, and multiplayer systems, with a strong " +
      "focus on performance optimization.",
    summary2:
      "Previously worked as a game programmer, programming instructor and backend web developer, " +
      "bringing strong problem-solving, teamwork, and communication skills to every project. " +
      "Passionate about creating high-quality, immersive gameplay experiences.",
    stats: [],
    perks: []
  },

  /* ---------- SKILLS (each skill becomes a crystal in the game) ---------- */
  skills: [
    { category: "Unreal Engine", items: [
      { name: "C++" },
      { name: "Blueprint" },
      { name: "Gameplay Ability System (GAS)" },
      { name: "Animation Blueprint Setup" }
    ]},
    { category: "AI", items: [
      { name: "Behaviour Tree" },
      { name: "StateTree" }
    ]},
    { category: "Multiplayer", items: [
      { name: "Dedicated Server" },
      { name: "Listen Server" }
    ]},
    { category: "Version Control", items: [
      { name: "Git" },
      { name: "SVN" }
    ]}
  ],

  /* ---------- EXPERIENCE (newest first; each job is a building in the game) ---------- */
  experience: [
    {
      role: "Unreal Engine Developer",
      company: "Future Studios Bangladesh",
      period: "Sep 2025 — Present",
      duration: "1 yr 3 mos",
      location: "Full-time",
      current: true,
      points: [
        "Developed multiplayer games using both dedicated server and listen server architectures in Unreal Engine",
        "Implemented AI behaviors using Behaviour Tree and StateTree",
        "Built gameplay systems for a sports game",
        "Independently managed and developed a complete project using the Gameplay Ability System (GAS)",
        "Set up animation blueprints to drive character animation and gameplay",
        "Maintained and updated existing studio projects as an Unreal Engine developer"
      ],
      tech: ["Behaviour Tree", "StateTree", "Unreal Engine Multiplayer", "GAS", "Animation Blueprint"]
    },
    {
      role: "Game Programmer",
      company: "BDGame Studio",
      period: "Aug 2023 — May 2025",
      points: [
        "Developed gameplay systems using C++ and Blueprint scripting within Unreal Engine",
        "Implemented AI behaviors and animation blueprints to enhance gameplay experience",
        "Worked on multiplayer system features including replication and server-client architecture",
        "Utilized Unreal Engine's Rewind Debugger for advanced debugging and issue resolution",
        "Optimized game performance and debugged issues using Unreal Engine tools",
        "Collaborated with designers to refine core mechanics and deliver polished gameplay"
      ],
      tech: ["C++", "Blueprint", "Unreal Engine"]
    },
    {
      role: "Junior Instructor",
      company: "Munshiganj Polytechnic Institute",
      period: "Oct 2022 — May 2023",
      points: [
        "Taught programming courses and guided students on academic projects",
        "Delivered lectures on C, Python, C#, and Web Development (HTML, CSS, JavaScript, PHP)",
        "Guided students through hands-on lab sessions and real-world programming tasks"
      ],
      tech: ["C", "Python", "C#", "HTML", "CSS", "JavaScript", "PHP"]
    },
    {
      role: "Web Developer",
      company: "Paramorsho Consultancy Mobile App",
      period: "Jan 2021 — Dec 2021",
      points: [
        "Co-founded and developed a startup offering paid consultations with professionals (e.g., doctors, lawyers, gym trainers, nutritionists, psychologists) via video and audio calls through a mobile app",
        "Designed and built the web backend using PHP (Laravel) to support mobile app features"
      ],
      tech: ["PHP", "Laravel"]
    }
  ],

  /* ---------- PROJECTS (each becomes an arcade cabinet in the game) ----------
     Empty = the section is hidden. Example:
     { title: "My Game", year: "2025", role: "Programmer", genre: "Action · PC",
       description: "...", tech: ["Unreal Engine", "C++"],
       image: "assets/my-game.png", video: "https://youtu.be/ID",
       links: [{ label: "Steam", url: "https://..." }] }                    */
  projects: [],

  /* ---------- EDUCATION (each becomes an academy tower in the game) ---------- */
  education: [
    {
      degree: "Diploma in Computer Engineering",
      school: "Munshiganj Polytechnic Institute",
      period: "2016 — 2020",
      gpa: 3.5,
      gpaMax: 4,
      details: ["CGPA: 3.50 (out of 4.00)"]
    }
  ],

  /* ---------- ACHIEVEMENTS (each becomes a trophy) ---------- */
  achievements: [],

  /* ---------- CONTACT ---------- */
  contact: {
    heading: "Contact",
    message: ""
  }
};
