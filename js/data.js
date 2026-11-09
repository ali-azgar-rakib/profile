/* =====================================================================
   YOUR CV DATA
   ---------------------------------------------------------------------
   This is the only file you need to edit. The game world (levels,
   buildings, arcade cabinets, trophies…) and the printable "Quick CV"
   are generated from it automatically.

   • Empty strings ("") hide a field. Empty lists [] hide a whole world.
   • Images go in the /assets folder, e.g. image: "assets/neon-drift.png"
   • video: a YouTube link or ID ("https://youtu.be/XXXX" or "XXXX")
   • Skill level and stat values: skills 1–5, stats 1–10.
   ===================================================================== */

window.CV = {
  name: "Your Name",
  title: "Game Developer",
  tagline: "I build gameplay systems that feel great in the player's hands.",
  location: "City, Country",
  email: "you@example.com",
  avatar: "",       // e.g. "assets/me.png" (square). "" shows your initials.
  resumePdf: "",    // e.g. "assets/Your-Name-CV.pdf" adds a Download button.

  links: [
    { label: "GitHub",   url: "https://github.com/your-username" },
    { label: "itch.io",  url: "https://your-username.itch.io" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/your-username" },
    { label: "ArtStation", url: "" }
  ],

  /* ---------- WORLD 1 · ABOUT ---------- */
  about: {
    level: 4,   // shown as "LVL 4" — e.g. years of experience
    summary:
      "Game developer with 4+ years of experience shipping PC and mobile titles. " +
      "I specialise in gameplay programming and game feel: responsive controls, " +
      "readable AI and the small bits of juice that make a mechanic satisfying. " +
      "Happiest working closely with designers and artists to find the fun fast.",
    stats: [
      { label: "Gameplay Programming", value: 9 },
      { label: "Systems & AI",         value: 8 },
      { label: "Performance",          value: 7 },
      { label: "Tools & Pipelines",    value: 7 },
      { label: "Team Play",            value: 9 }
    ],
    perks: [
      "Shipped 3 commercial titles across PC, Steam Deck and mobile",
      "Obsessed with game feel: input buffering, coyote time, screen shake",
      "Game-jam regular — 12 jams and counting"
    ]
  },

  /* ---------- WORLD 2 · SKILLS (each skill becomes a crystal) ---------- */
  skills: [
    { category: "Engines", items: [
      { name: "Unity", level: 5 },
      { name: "Unreal Engine", level: 4 },
      { name: "Godot", level: 3 }
    ]},
    { category: "Languages", items: [
      { name: "C#", level: 5 },
      { name: "C++", level: 4 },
      { name: "HLSL / GLSL", level: 3 },
      { name: "Python", level: 3 }
    ]},
    { category: "Game Systems", items: [
      { name: "Gameplay & Controls", level: 5 },
      { name: "AI & Pathfinding", level: 4 },
      { name: "Physics", level: 3 },
      { name: "Multiplayer / Netcode", level: 3 }
    ]},
    { category: "Tools", items: [
      { name: "Git & Perforce", level: 4 },
      { name: "Blender", level: 3 },
      { name: "FMOD", level: 3 }
    ]}
  ],

  /* ---------- WORLD 3 · EXPERIENCE (each job becomes a building) ---------- */
  experience: [
    {
      role: "Gameplay Programmer",
      company: "Pixel Forge Studio",
      period: "2024 — Present",
      location: "Remote",
      points: [
        "Own the player controller, combat and camera systems for an unannounced action game",
        "Built a data-driven ability system used by designers to ship 40+ abilities without code changes",
        "Cut frame time by 30% on Steam Deck through profiling, pooling and job-system refactors"
      ],
      tech: ["Unity", "C#", "DOTS", "Addressables"]
    },
    {
      role: "Junior Game Developer",
      company: "Moonbyte Games",
      period: "2022 — 2024",
      location: "On-site",
      points: [
        "Developed core loop and UI for a mobile tactics game with 1M+ downloads",
        "Implemented live-ops events and remote config, raising D7 retention by 12%",
        "Wrote editor tools that halved level-building time for the design team"
      ],
      tech: ["Unity", "C#", "Firebase", "DOTween"]
    },
    {
      role: "Game Programming Intern",
      company: "Indie Collective",
      period: "2021",
      location: "Hybrid",
      points: [
        "Prototyped three vertical slices in Unreal Engine with Blueprints and C++",
        "Fixed 150+ bugs across gameplay, UI and save systems before launch"
      ],
      tech: ["Unreal Engine", "C++", "Blueprints"]
    }
  ],

  /* ---------- WORLD 4 · PROJECTS (each becomes an arcade cabinet) ---------- */
  projects: [
    {
      title: "Neon Drift",
      year: "2025",
      role: "Lead Programmer",
      genre: "Arcade racer · PC / Steam Deck",
      description:
        "A synthwave arcade racer built around drifting and boost chaining. " +
        "I wrote the vehicle physics, ghost-replay system and the online leaderboards.",
      highlights: [
        "Custom arcade vehicle model tuned for controller and keyboard",
        "Deterministic ghost replays at under 40 KB per lap"
      ],
      tech: ["Unity", "C#", "Steamworks", "FMOD"],
      image: "",   // "assets/neon-drift.png"
      video: "",   // "https://youtu.be/VIDEO_ID"
      links: [
        { label: "Play on itch.io", url: "https://your-username.itch.io/neon-drift" },
        { label: "Source", url: "https://github.com/your-username/neon-drift" }
      ]
    },
    {
      title: "Hollow Keep",
      year: "2024",
      role: "Solo Developer",
      genre: "Roguelike dungeon crawler · PC",
      description:
        "Procedurally generated dungeons, a synergy-driven item system and enemies " +
        "with utility-based AI. Built in Unreal Engine with gameplay in C++.",
      tech: ["Unreal Engine", "C++", "GAS", "Procedural Generation"],
      image: "",
      video: "",
      links: [{ label: "Watch trailer", url: "https://youtube.com" }]
    },
    {
      title: "Pocket Tactics",
      year: "2023",
      role: "Gameplay & UI Programmer",
      genre: "Turn-based strategy · iOS / Android",
      description:
        "A bite-sized tactics game designed for one-thumb play. Shipped to 1M+ players " +
        "with weekly live events.",
      tech: ["Unity", "C#", "Firebase", "Mobile"],
      image: "",
      video: "",
      links: [{ label: "Google Play", url: "https://play.google.com" }]
    },
    {
      title: "Lost Signal",
      year: "2025",
      role: "Programmer · Game Jam",
      genre: "Puzzle platformer · Web",
      description:
        "Made in 48 hours for Global Game Jam. Reroute a dying radio signal by " +
        "rotating the world. Placed top 10 globally in the Innovation category.",
      tech: ["Godot", "GDScript", "Game Jam"],
      image: "",
      video: "",
      links: [{ label: "Play in browser", url: "https://your-username.itch.io/lost-signal" }]
    }
  ],

  /* ---------- WORLD 5 · EDUCATION (each becomes an academy tower) ---------- */
  education: [
    {
      degree: "B.Sc. in Computer Science & Engineering",
      school: "Your University",
      period: "2018 — 2022",
      location: "City, Country",
      details: [
        "Thesis: Real-time procedural terrain generation on the GPU",
        "Coursework: Computer Graphics, AI, Data Structures, Linear Algebra"
      ]
    },
    {
      degree: "Game Design & Development Specialization",
      school: "Online Certificate",
      period: "2021",
      details: ["Level design, playtesting, game economy and player psychology"]
    }
  ],

  /* ---------- WORLD 6 · ACHIEVEMENTS (each becomes a trophy) ---------- */
  achievements: [
    { title: "Global Game Jam — Top 10", year: "2025", detail: "Lost Signal placed in the global top 10 for Innovation." },
    { title: "1M+ Downloads", year: "2023", detail: "Pocket Tactics passed one million installs on mobile." },
    { title: "Shipped 3 Titles", year: "2021—2025", detail: "From prototype to store launch on PC and mobile." },
    { title: "Meetup Speaker", year: "2024", detail: "Talk: 'Game feel in 10 lines of code' at the local game dev meetup." }
  ],

  /* ---------- WORLD 7 · CONTACT ---------- */
  contact: {
    heading: "Let's make something fun",
    message:
      "I'm open to full-time gameplay programming roles and interesting collaborations. " +
      "Send me a message and I'll get back to you within a couple of days."
  }
};
