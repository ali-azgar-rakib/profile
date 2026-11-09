/* =====================================================================
   CV DATA — Ali Azgar Rakib
   ---------------------------------------------------------------------
   This one file powers BOTH the resume homepage (index.html) and the
   game (play.html). Edit here and both update.

   • Empty strings ("") hide a field. Empty lists [] hide a whole section.
   • Images go in /assets, e.g. image: "assets/sports-game.png"
   • video: a YouTube link or ID ("https://youtu.be/XXXX")
   • Skill level 1–5, stat value 1–10 (self-assessment, tweak freely).
   ===================================================================== */

window.CV = {
  name: "Ali Azgar Rakib",
  title: "Game Programmer",
  roles: ["Unreal Engine Developer", "Gameplay Programmer", "Multiplayer Systems", "AI & Animation"],
  tagline: "Unreal Engine developer building gameplay, AI and multiplayer systems in C++ and Blueprint.",
  location: "Bashundhara R/A, Dhaka, Bangladesh",
  email: "aliazgarrakib@gmail.com",
  phone: "01628651490",
  avatar: "",       // e.g. "assets/me.jpg" (square). "" shows the pixel character / initials.
  resumePdf: "",    // e.g. "assets/Ali-Azgar-Rakib-CV.pdf" adds a Download button.

  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/rakib5" },
    { label: "GitHub",   url: "https://github.com/ali-azgar-rakib" }
  ],

  /* ---------- ABOUT ---------- */
  about: {
    level: 4,          // shown as "LVL 4"
    years: "3.5+",     // years of experience, shown in the stats strip
    summary:
      "Unreal Engine Developer with over 3.5 years of experience building gameplay systems " +
      "using C++ and Blueprint. Skilled in AI, animation blueprints and multiplayer systems, " +
      "with a strong focus on performance optimization.",
    summary2:
      "Previously worked as a game programmer, programming instructor and backend web developer, " +
      "bringing strong problem-solving, teamwork and communication skills to every project. " +
      "Passionate about creating high-quality, immersive gameplay experiences.",
    stats: [
      { label: "Gameplay Programming", value: 9 },
      { label: "Multiplayer & Replication", value: 8 },
      { label: "AI Systems", value: 8 },
      { label: "Animation Blueprints", value: 7 },
      { label: "Performance & Debugging", value: 8 }
    ],
    perks: [
      "Ships both dedicated-server and listen-server multiplayer games",
      "Owns a full Unreal project solo, built on the Gameplay Ability System",
      "Former programming instructor: explains complex systems clearly"
    ]
  },

  /* ---------- SKILLS (each skill becomes a crystal in the game) ---------- */
  skills: [
    { category: "Unreal Engine", items: [
      { name: "C++", level: 5 },
      { name: "Blueprint", level: 5 },
      { name: "Gameplay Ability System", level: 4 },
      { name: "Animation Blueprint Setup", level: 4 }
    ]},
    { category: "AI", items: [
      { name: "Behaviour Tree", level: 5 },
      { name: "StateTree", level: 4 }
    ]},
    { category: "Multiplayer", items: [
      { name: "Replication", level: 4 },
      { name: "Dedicated Server", level: 4 },
      { name: "Listen Server", level: 4 }
    ]},
    { category: "Tools & Debugging", items: [
      { name: "Performance Optimization", level: 4 },
      { name: "Rewind Debugger", level: 4 },
      { name: "Git", level: 4 },
      { name: "SVN", level: 3 }
    ]},
    { category: "Also Speaks", items: [
      { name: "C# / Python / C", level: 3 },
      { name: "PHP (Laravel)", level: 3 }
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
        "Develop dedicated-server and listen-server multiplayer games in Unreal Engine",
        "Built gameplay and AI for a sports game using Behaviour Tree and StateTree",
        "Own a complete project single-handedly, architected around the Gameplay Ability System (GAS)",
        "Set up animation blueprints and replicated gameplay for networked play",
        "Maintain and update the studio's existing Unreal projects"
      ],
      tech: ["Unreal Engine", "C++", "GAS", "Behaviour Tree", "StateTree", "Multiplayer", "Anim BP"]
    },
    {
      role: "Game Programmer",
      company: "BDGame Studio",
      period: "Aug 2023 — May 2025",
      duration: "1 yr 10 mos",
      location: "Full-time",
      points: [
        "Developed gameplay systems using C++ and Blueprint scripting within Unreal Engine",
        "Implemented AI behaviors and animation blueprints to enhance gameplay experience",
        "Worked on multiplayer features including replication and server-client architecture",
        "Used Unreal Engine's Rewind Debugger for advanced debugging and issue resolution",
        "Optimized game performance and debugged issues using Unreal Engine tools",
        "Collaborated with designers to refine core mechanics and deliver polished gameplay"
      ],
      tech: ["Unreal Engine", "C++", "Blueprint", "AI", "Replication", "Rewind Debugger"]
    },
    {
      role: "Junior Instructor",
      company: "Munshiganj Polytechnic Institute",
      period: "Oct 2022 — May 2023",
      duration: "8 mos",
      location: "Teaching",
      points: [
        "Taught programming courses and guided students on academic projects",
        "Delivered lectures on C, Python, C# and web development (HTML, CSS, JavaScript, PHP)",
        "Guided students through hands-on lab sessions and real-world programming tasks"
      ],
      tech: ["C", "Python", "C#", "JavaScript", "PHP"]
    },
    {
      role: "Web Developer",
      company: "Paramorsho Consultancy",
      period: "Jan 2021 — Dec 2021",
      duration: "1 yr",
      location: "Co-founder",
      points: [
        "Co-founded a startup offering paid video and audio consultations with doctors, lawyers, trainers, nutritionists and psychologists through a mobile app",
        "Designed and built the web backend in PHP (Laravel) powering the mobile app's features"
      ],
      tech: ["PHP", "Laravel", "REST API", "MySQL"]
    }
  ],

  /* ---------- PROJECTS (each becomes an arcade cabinet in the game) ----------
     Add real titles, screenshots (image) and trailers (video) when you can. */
  projects: [
    {
      title: "Multiplayer Sports Game",
      year: "2025–26",
      role: "Unreal Engine Developer",
      company: "Future Studios Bangladesh",
      genre: "Sports · Online multiplayer",
      description:
        "Networked sports game with AI-controlled players. Built team AI with Behaviour Tree " +
        "and StateTree, replicated gameplay and animation blueprint setup for smooth online play.",
      tech: ["Unreal Engine", "C++", "StateTree", "Behaviour Tree", "Replication"],
      image: "", video: "", links: []
    },
    {
      title: "GAS Solo Project",
      year: "2025–26",
      role: "Sole Developer",
      company: "Future Studios Bangladesh",
      genre: "Unreal Engine · Gameplay Ability System",
      description:
        "A full project I manage on my own: abilities, attributes and effects driven by the " +
        "Gameplay Ability System, with AI and animation integrated end to end.",
      tech: ["Unreal Engine", "GAS", "C++", "Blueprint", "Anim BP"],
      image: "", video: "", links: []
    },
    {
      title: "Dedicated Server Game",
      year: "2023–26",
      role: "Gameplay / Network Programmer",
      company: "Future Studios · BDGame Studio",
      genre: "Online multiplayer · Dedicated & listen server",
      description:
        "Server-authoritative multiplayer gameplay: replication, RPCs and server-client " +
        "architecture, debugged with the Rewind Debugger and optimized with Unreal's profiling tools.",
      tech: ["Dedicated Server", "Listen Server", "C++", "Rewind Debugger", "Profiling"],
      image: "", video: "", links: []
    },
    {
      title: "Paramorsho App Backend",
      year: "2021",
      role: "Co-founder · Backend Developer",
      company: "Paramorsho Consultancy",
      genre: "Mobile app · Web backend",
      description:
        "Backend for a consultation app connecting users with doctors, lawyers, trainers, " +
        "nutritionists and psychologists over video and audio calls.",
      tech: ["PHP", "Laravel", "REST API"],
      image: "", video: "", links: []
    }
  ],

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

  /* ---------- ACHIEVEMENTS (each becomes a trophy) — add yours here ---------- */
  achievements: [],

  /* ---------- CONTACT ---------- */
  contact: {
    heading: "Ready Player Two?",
    message:
      "I'm open to Unreal Engine and gameplay programming roles, especially multiplayer, AI and " +
      "systems work. Send me a message and I'll get back to you quickly."
  }
};
