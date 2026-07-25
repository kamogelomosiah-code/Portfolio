import { ExternalLink, Download } from "lucide-react";

export function ProjectCards() {
  const projects = [
    {
      title: "CallTrax",
      description: "Client tracking and billing platform built for corporate service providers.",
      tags: ["PHP", "Laravel", "React.js", "MySQL"],
      link: "https://call-trax.co.za"
    },
    {
      title: "kamocodes API",
      description: "Centralized server-side logging API and sandboxes gateway.",
      tags: ["PHP", "Laravel", "PostgreSQL", "REST"],
      link: "https://api.kamocodes.xyz"
    },
    {
      title: "kamocodes Library",
      description: "Cataloging and Borrow history system with membership analytics indicators.",
      tags: ["TypeScript", "React", "Laravel", "MySQL"],
      link: "https://library.kamocodes.xyz"
    },
    {
      title: "Personal AI Portfolio App",
      description: "Voice command transcriptions and Firestore CMS powered by Gemini.",
      tags: ["TypeScript", "Firebase", "Gemini AI", "Vite", "Tailwind"],
      link: "#"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-2xl font-sans">
      {projects.map((project, i) => (
        <div key={i} className="bg-[#13131c] border border-transparent hover:border-[#4A90E2]/60 rounded-xl p-5 transition-all flex flex-col justify-between shadow-md">
          <div>
            <h3 className="font-semibold text-base mb-2 text-white">{project.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-relaxed">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {project.tags.map(tag => (
                <span key={tag} className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 bg-white/5 rounded-lg text-gray-300">
                  {tag}
                </span>
               ))}
            </div>
          </div>
          <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center text-xs sm:text-sm font-semibold text-[#4A90E2] hover:text-[#4A90E2]/80 transition-colors">
            View Project <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      ))}
    </div>
  );
}

export function SkillChips() {
  const skills = [
    "Systems Support", "Hardware Setup & Diagnosis", "SSD & RAM Upgrades",
    "Tailwind CSS", "React.js", "Laravel Framework", "MySQL / PostgreSQL",
    "REST APIs", "TypeScript", "TCP/IP & DNS Troubleshooting", "Support Ticket Logging"
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4 max-w-xl font-sans">
      {skills.map(skill => (
        <div key={skill} className="px-3.5 py-1.5 bg-[#13131c] hover:bg-[#1a1a28] rounded-full text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default shadow-sm">
          {skill}
        </div>
      ))}
    </div>
  );
}

interface DownloadCVProps {
  onViewCv?: () => void;
}

export function DownloadCV({ onViewCv }: DownloadCVProps) {
  const handleDownload = () => {
    const cvText = `KAMOGELO MOSIA
Software & IT Solutions Engineer
Johannesburg, Gauteng, South Africa
Email: kamogelomosiah@gmail.com
Phone: 067 742 6447 / 061 362 4165
GitHub: github.com/kamogelomosiah-code

==================================================
PROFESSIONAL PROFILE
==================================================
I am a highly analytical and detail-oriented IT Professional and Full-Stack Developer with a strong foundation in Computer Science, Software Engineering, and Informatics. I specialize in designing structured, scalable database schemas, building secure and reliable REST APIs, and configuring custom hardware and software systems to optimize operational flow.

Completed theoretical coursework for a BSc in Information Technology (Computer Science & Informatics double major) at the University of Johannesburg, with degree conferral pending.

==================================================
TECHNICAL SKILLS
==================================================
* Software Development: Full-stack development, REST APIs, clean coding patterns, responsive design, state management, system architecture, database security
* Programming Languages: JavaScript, Python (actively studying), SQL (PostgreSQL, MySQL), PHP, HTML5, CSS3
* Frameworks & Libraries: React.js, Node.js, Express, Laravel, Flask (actively in progress), Tailwind CSS
* Database & Systems: Database schema design, query optimization, indexing, data normalization, PostgreSQL, MySQL, Firebase/Firestore
* IT Operations & Support: Hardware diagnostics, technical troubleshooting, software configuration, operating system setup, end-user support
* DevOps & Tools: Git, GitHub, VS Code, Postman, Docker (actively studying), Chrome DevTools (Google Certified), Render, Android Studio, Excel
* Current Certifications: Google Developer Tools Certification (completed), CompTIA IT Certificate (in progress)

==================================================
EDUCATION
==================================================
* University of Johannesburg (2019 - 2024, Coursework Completed, Conferral Pending)
  BSc Information Technology in Computer Science and Informatics (NQF Level 7 - Pending)
  SAQA Reg 80372 • Student No 217004345
  - Informatics 1A and IT Management 1A passed with distinction.

* Hoerskool Birchleigh (2016)
  National Senior Certificate • Bachelor's Pass
  - IT 71% (Highest in school)
  - Elected school prefect

==================================================
RELEVANT PROJECTS
==================================================
* MasterAPI (github.com/kamogelomosiah-code/MasterAPI-main)
  Designed a centralised REST API backend to solve a data duplication problem, establishing a clean source of truth with structured endpoints.

* Resume Maker (kamogelomosiah-code.github.io/CvMaker/)
  Full-stack application with a PostgreSQL database designed, built, and deployed for a paying client.

* Real Time Chat Application (s-c4nk.onrender.com)
  Live application managing real-time data streams using WebSockets.

==================================================
WORK EXPERIENCE
==================================================
* F-Stop Photolab (2016)
  Semi-Technical Support and Cashier
  - Managed equipment data, fault logs, client records, and transaction accuracy.

* Dis-Chem Pharmacy (2021)
  Cashier and Customer Service Representative
  - High-volume transaction processing with strict accuracy requirements.

==================================================
REFERENCES
==================================================
* Mr Tommy Ferrara (F-Stop Photolab, Former employer)
  Phone: 073 400 1861
* Store Manager (Dis-Chem Pharmacy, Former employer)
  Phone: 011 391 2399
`;

    const blob = new Blob([cvText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Kamogelo_CV.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-row items-center justify-between p-3.5 sm:p-4 bg-[#1a1a24]-container-low border-2 border-white/10 rounded-2xl w-full max-w-md mt-3 gap-3 shadow-sm hover:border-primary/40 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Document Icon Graphic */}
        <div className="w-11 h-11 shrink-0 bg-red-500/10 dark:bg-red-950/40 rounded-xl flex flex-col items-center justify-center border border-red-500/20 shadow-xs relative overflow-hidden select-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[8px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest font-mono">PDF</span>
        </div>
        
        <div className="flex flex-col text-left min-w-0">
          <span className="font-bold text-sm text-gray-300 leading-snug truncate">
            Kamogelo_CV.pdf
          </span>
          <span className="text-xs text-gray-400 font-medium mt-0.5">
            184 KB • Official CV
          </span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 bg-[#4A90E2] hover:opacity-90 text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-sm border-0 shrink-0"
      >
        <Download size={15} />
        <span>Download</span>
      </button>
    </div>
  );
}
