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
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-accent transition-colors flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-base mb-2 text-black">{project.title}</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {project.tags.map(tag => (
                <span key={tag} className="text-[10px] sm:text-xs font-semibold px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  {tag}
                </span>
               ))}
            </div>
          </div>
          <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors">
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
        <div key={skill} className="px-3 py-1.5 border border-gray-200 bg-gray-50/50 rounded-full text-xs font-semibold text-gray-850 hover:bg-black hover:text-white transition-colors cursor-default">
          {skill}
        </div>
      ))}
    </div>
  );
}

export function DownloadCV() {
  return (
    <button className="mt-4 flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-accent transition-colors font-medium">
      Download PDF Resume <Download size={16} />
    </button>
  );
}
