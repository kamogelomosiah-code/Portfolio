import { ExternalLink, Download, FileText, Mail, MapPin, Phone } from "lucide-react";
import defaultProfile from "../../me.json";
import type { ProfileData, NavTab } from "../types/profile";

export function ProjectCards({ profile }: { profile?: ProfileData }) {
  const projects =
    profile?.projects && profile.projects.length > 0
      ? profile.projects
      : defaultProfile.projects;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 w-full max-w-2xl font-sans">
      {projects.map((project, idx) => (
        <div
          key={`${project.name}-${idx}`}
          className="bg-surface border border-outline-variant rounded-xl p-4 hover:border-outline transition-colors flex flex-col justify-between gap-3"
        >
          <div>
            <h3 className="font-semibold text-sm text-on-background">{project.name}</h3>
            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
              {project.description}
            </p>
            {project.stack && (
              <p className="font-mono text-[11px] text-on-surface-variant mt-2.5">
                {project.stack}
              </p>
            )}
          </div>
          {project.url && project.url !== "#" && (
            <a
              href={project.url.startsWith("http") ? project.url : `https://${project.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
            >
              <span>View Project</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function SkillChips({ profile }: { profile?: ProfileData }) {
  const skills =
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : defaultProfile.skills;

  return (
    <div className="mt-2 max-w-2xl border border-outline-variant rounded-xl bg-surface p-4 font-sans">
      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2.5">
        Core Skills
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-on-background">
        {skills.map((skill, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-accent-ink shrink-0">·</span>
            <span>{skill}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactCard({
  profile,
  onNavigateTab,
}: {
  profile?: ProfileData;
  onNavigateTab?: (tab: NavTab) => void;
}) {
  const email = profile?.email || defaultProfile.email;
  const phone = profile?.phone || defaultProfile.phone;
  const location = profile?.location || defaultProfile.location;

  return (
    <div className="mt-2 max-w-md border border-outline-variant rounded-xl bg-surface p-4 font-sans flex flex-col gap-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
        Find &amp; Contact {profile?.nickname || "Kamo"}
      </div>
      <div className="flex flex-col gap-2 text-xs sm:text-sm">
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 text-accent-ink hover:underline font-medium"
        >
          <Mail size={14} className="shrink-0" />
          <span>{email}</span>
        </a>
        {phone && (
          <span className="inline-flex items-center gap-2 text-on-surface-variant font-mono text-xs">
            <Phone size={14} className="shrink-0 text-accent-ink" />
            <span>{phone}</span>
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-2 text-on-surface-variant text-xs">
            <MapPin size={14} className="shrink-0 text-accent-ink" />
            <span>{location}</span>
          </span>
        )}
      </div>
      {onNavigateTab && (
        <button
          type="button"
          onClick={() => onNavigateTab("contact")}
          className="self-start inline-flex items-center justify-center bg-primary hover:opacity-90 text-on-primary px-3.5 h-9 rounded-lg text-xs font-medium transition-opacity cursor-pointer"
        >
          Open Contact Form
        </button>
      )}
    </div>
  );
}

export function DownloadCV({ profile }: { profile?: ProfileData }) {
  const handleDownload = () => {
    const p = profile || (defaultProfile as ProfileData);
    const cvText = `${(p.name || "KAMOGELO MOSIA").toUpperCase()}
${p.profession || "Software & IT Solutions Engineer"}
${p.location || "Johannesburg, Gauteng, South Africa"}
Email: ${p.email || "kamogelomosiah@gmail.com"}
Phone: ${p.phone || "067 742 6447 / 061 362 4165"}

==================================================
PROFESSIONAL PROFILE
==================================================
${p.overview || ""}

==================================================
TECHNICAL SKILLS
==================================================
${(p.skills || []).map((s) => `* ${s}`).join("\n")}

==================================================
EDUCATION
==================================================
${(p.education || [])
  .map((e) => `* ${e.institution} (${e.years})\n  ${e.degree}\n  ${e.details || ""}`)
  .join("\n\n")}

==================================================
RELEVANT PROJECTS
==================================================
${(p.projects || [])
  .map((pr) => `* ${pr.name}${pr.url ? ` (${pr.url})` : ""}\n  ${pr.description || ""}`)
  .join("\n\n")}

==================================================
WORK EXPERIENCE
==================================================
${(p.experience || [])
  .map((ex) => `* ${ex.company} (${ex.year})\n  ${ex.title}\n  ${ex.details || ""}`)
  .join("\n\n")}
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
    <div className="flex flex-row items-center justify-between p-3.5 bg-surface border border-outline-variant rounded-xl w-full max-w-md mt-2 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant text-accent-ink">
          <FileText size={18} />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="font-medium text-sm text-on-surface leading-snug truncate">
            Kamogelo_CV.pdf
          </span>
          <span className="text-xs text-on-surface-variant font-mono">Official CV</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center justify-center gap-1.5 bg-primary hover:opacity-90 text-on-primary px-3.5 h-9 rounded-lg transition-opacity font-medium text-xs cursor-pointer shrink-0"
      >
        <Download size={14} />
        <span>Download</span>
      </button>
    </div>
  );
}
