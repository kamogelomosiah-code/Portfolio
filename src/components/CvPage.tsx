import { motion } from "motion/react";
import { Download, ArrowLeft, Mail, Phone, Github, Globe, MapPin, Menu } from "lucide-react";

interface CvPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

const SKILLS_DATA = [
  {
    category: "Software Development",
    details: "Full-stack development, REST APIs, clean coding patterns, responsive design, state management, system architecture, database security",
  },
  {
    category: "Programming Languages",
    details: "JavaScript, Python (actively studying), SQL (PostgreSQL, MySQL), PHP, HTML5, CSS3",
  },
  {
    category: "Frameworks & Libraries",
    details: "React.js, Node.js, Express, Laravel, Flask (actively in progress), Tailwind CSS",
  },
  {
    category: "Database & Systems",
    details: "Database schema design, query optimization, indexing, data normalization, PostgreSQL, MySQL, Firebase/Firestore",
  },
  {
    category: "IT Operations & Support",
    details: "Hardware diagnostics, technical troubleshooting, software configuration, operating system setup, end-user support",
  },
  {
    category: "DevOps & Tools",
    details: "Git, GitHub, VS Code, Postman, Docker (actively studying), Chrome DevTools (Google Certified), Render, Android Studio, Excel",
  },
  {
    category: "Soft Skills & Teamwork",
    details: "Technical documentation, systems analysis, Agile methodologies, problem-solving, collaboration, prompt response times, self-motivated",
  },
  {
    category: "Current Certifications",
    details: "Google Developer Tools Certification (completed), CompTIA IT Certificate (in progress)",
  },
];

const PROJECTS = [
  {
    title: "MasterAPI",
    link: "github.com/kamogelomosiah-code/MasterAPI-main",
    url: "https://github.com/kamogelomosiah-code/MasterAPI-main",
    description:
      "I designed a centralised REST API backend to solve a data duplication problem. Multiple components were all pulling the same data independently, which created inconsistency and inefficiency. I built one clean source of truth with structured endpoints and proper data validation. That is a data quality and governance problem solved in code.",
  },
  {
    title: "Resume Maker",
    link: "kamogelomosiah-code.github.io/CvMaker/",
    url: "https://kamogelomosiah-code.github.io/CvMaker/",
    description:
      "A full-stack application with a PostgreSQL database that I designed, built, and deployed for a paying client. I handled the data schema design, query optimisation, and data accuracy checks throughout. The database is still running correctly in production today.",
  },
  {
    title: "Real Time Chat Application",
    link: "s-c4nk.onrender.com",
    url: "https://s-c4nk.onrender.com",
    description:
      "A live application managing real-time data streams using WebSockets. Requires ongoing data integrity monitoring and performance oversight in a live environment.",
  },
];

export default function CvPage({ onBackToChat, onToggleDrawer }: CvPageProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden print:overflow-visible print:bg-white print:text-black"
    >
      <header className="h-14 shrink-0 border-b border-outline-variant bg-surface px-4 sm:px-6 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 h-10 px-2.5 -ml-1 md:ml-0 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-outline-variant select-none">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">
            Curriculum Vitae
          </h1>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-on-primary px-3.5 h-9 rounded-lg transition-opacity font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
          title="Print or save CV as PDF"
        >
          <Download size={15} />
          <span>Print / PDF</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10 print:p-0 print:overflow-visible print:bg-white">
        <div className="w-full max-w-3xl mx-auto bg-surface print:bg-white border border-outline-variant print:border-0 rounded-xl print:rounded-none p-6 sm:p-10 md:p-12 text-left">
          <div className="border-b border-outline-variant pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-on-background tracking-tight leading-tight">
              Kamogelo Mosia
            </h1>
            <p className="text-sm sm:text-base text-accent-ink font-medium mt-1.5">
              Software &amp; IT Solutions Engineer · Johannesburg, Gauteng
            </p>

            <div className="flex flex-col gap-2 text-xs sm:text-sm text-on-surface-variant mt-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <a
                  href="mailto:kamogelomosiah@gmail.com"
                  className="hover:text-on-background transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail size={14} className="text-accent-ink" />
                  <span>kamogelomosiah@gmail.com</span>
                </a>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Phone size={14} className="text-accent-ink" />
                  <span>067 742 6447</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Phone size={14} className="text-accent-ink" />
                  <span>061 362 4165</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <a
                  href="https://github.com/kamogelomosiah-code"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-on-background transition-colors inline-flex items-center gap-1.5"
                >
                  <Github size={14} className="text-accent-ink" />
                  <span>github.com/kamogelomosiah-code</span>
                </a>
                <a
                  href="https://portfolio-q5ji.onrender.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-on-background transition-colors inline-flex items-center gap-1.5"
                >
                  <Globe size={14} className="text-accent-ink" />
                  <span>portfolio-q5ji.onrender.com</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-accent-ink" />
                  Alexandra, Johannesburg, Gauteng
                </span>
                <span>·</span>
                <span>South African Citizen</span>
                <span>·</span>
                <span>Unemployed</span>
                <span>·</span>
                <span className="font-medium text-accent-ink">Available immediately</span>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Professional Profile
            </h2>
            <div className="text-sm text-on-background leading-relaxed flex flex-col gap-3">
              <p>
                I am a highly analytical and detail-oriented IT Professional and Full-Stack Developer with a strong foundation in Computer Science, Software Engineering, and Informatics. I specialize in designing structured, scalable database schemas, building secure and reliable REST APIs, and configuring custom hardware and software systems to optimize operational flow.
              </p>
              <p>
                I have completed the theoretical coursework for a BSc in Information Technology at the University of Johannesburg, double majoring in Computer Science and Informatics, with degree conferral pending. This comprehensive training equipped me with deep knowledge in software engineering paradigms, DBMS administration, networks, system analysis, and IT project management.
              </p>
              <p>
                My passion lies in leveraging modern technologies to build robust systems. I actively expand my competence beyond academic boundaries, and I am currently completing practical certifications in Python scripting, Docker containerization, and Flask web frameworks to ensure my skills remain at the forefront of the IT industry.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Technical Approach &amp; Experience
            </h2>
            <div className="text-sm text-on-background leading-relaxed flex flex-col gap-3">
              <p>
                Every software system is only as good as the database and infrastructure behind it. When I design platforms, I prioritize security, data integrity, and API performance. For instance, when constructing MasterAPI, I solved critical data replication issues by engineering a singular, validated REST service. I enjoy resolving system-level bottlenecks and structuring clean information flows.
              </p>
              <p>
                I appreciate technical precision. Whether writing SQL queries, diagnosing hardware issues, or building a front-end interface, I aim for absolute correctness and high readability. Technology is a tool to solve real-world problems, and I approach it with the patience and discipline needed for reliable production deployments.
              </p>
              <p>
                As an IT professional, I am highly self-motivated and maintain stellar time management. I communicate complex technical concepts clearly with stakeholders and work efficiently both as an independent system builder and as a collaborative, Agile-minded team player.
              </p>
            </div>
          </section>

          <section className="mb-8 page-break-before">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Skills
            </h2>
            <div className="border border-outline-variant rounded-lg overflow-hidden divide-y divide-outline-variant">
              {SKILLS_DATA.map((skill) => (
                <div key={skill.category} className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-[210px] bg-surface-container-low px-4 py-3 text-on-background font-medium text-xs sm:text-sm shrink-0 sm:border-r border-outline-variant">
                    {skill.category}
                  </div>
                  <div className="flex-1 px-4 py-3 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {skill.details}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Relevant Projects
            </h2>
            <div className="flex flex-col gap-5">
              {PROJECTS.map((proj) => (
                <div key={proj.title} className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="text-sm sm:text-base font-semibold text-on-background">
                      {proj.title}
                    </h3>
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent-ink hover:underline break-all font-mono"
                    >
                      {proj.link}
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Work Experience
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm sm:text-base font-semibold text-on-background">F-Stop Photolab</span>
                    <span className="text-xs sm:text-sm text-on-surface-variant">Semi-Technical Support and Cashier</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono tabular-nums shrink-0">
                    Johannesburg · 2016
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  I worked with equipment data every day. Device histories. Fault logs. Client records. I kept everything accurate and I flagged inconsistencies when they appeared. In a small business environment, data accuracy is not optional. A wrong record means a wrong decision and a frustrated customer.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm sm:text-base font-semibold text-on-background">Dis-Chem Pharmacy</span>
                    <span className="text-xs sm:text-sm text-on-surface-variant">Cashier and Customer Service Representative</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono tabular-nums shrink-0">
                    Gauteng · 2021
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  High-volume transaction processing with strict accuracy requirements. I maintained zero-error records daily under sustained pressure. The discipline required to do that correctly, every time, is the same discipline that data quality governance demands.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8 page-break-before">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Education
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-sm sm:text-base font-semibold text-on-background">University of Johannesburg</span>
                  <span className="text-xs text-on-surface-variant font-mono tabular-nums shrink-0">
                    2019–2024 (Coursework Completed, Conferral Pending)
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-accent-ink">
                  BSc Information Technology in Computer Science and Informatics · NQF Level 7 (Pending)
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  SAQA Reg 80372 · Student No 217004345
                </div>
                <ul className="list-disc list-outside ml-4 mt-1.5 flex flex-col gap-1 text-xs sm:text-sm text-on-surface-variant">
                  <li>Informatics 1A and IT Management 1A passed with distinction.</li>
                  <li>
                    <span className="font-medium text-on-background">Modules:</span> Software Engineering, System Design, Databases, IT Management, OOP, Algorithms, Informatics.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-sm sm:text-base font-semibold text-on-background">Hoerskool Birchleigh</span>
                  <span className="text-xs text-on-surface-variant font-mono tabular-nums shrink-0">2016</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-accent-ink">
                  National Senior Certificate · Bachelor&apos;s Pass · IT 71% (Highest in school)
                </div>
                <ul className="list-disc list-outside ml-4 mt-1 text-xs sm:text-sm text-on-surface-variant">
                  <li>Elected school prefect.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              Certifications &amp; Active Study
            </h2>
            <ul className="list-disc list-outside ml-4 flex flex-col gap-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <li><span className="font-medium text-on-background">Google Developer Tools Certification</span> — completed</li>
              <li><span className="font-medium text-on-background">Python Programming Certificate</span> — in progress</li>
              <li><span className="font-medium text-on-background">CompTIA IT Certificate</span> — in progress</li>
              <li><span className="font-medium text-on-background">Docker Certificate</span> — in progress</li>
              <li><span className="font-medium text-on-background">Flask Certificate</span> — in progress</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              One Last Thing
            </h2>
            <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed flex flex-col gap-2.5">
              <p>
                I ice skate. I read. I do not drink. I show up every day clear-headed, focused, and ready to solve complex problems.
              </p>
              <p>
                Technology and IT infrastructure are the backbone of any modern enterprise. I am passionate about constructing robust software, handling data streams with integrity, and providing stellar technical systems management. I want to be part of a team that builds solutions of absolute quality, and I am ready to start immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink pb-2 border-b border-outline-variant mb-4">
              References
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm text-on-surface-variant">
              <div className="flex flex-col">
                <span className="font-semibold text-on-background">Mr Tommy Ferrara</span>
                <span>F-Stop Photolab · Former employer</span>
                <span className="font-mono text-accent-ink mt-0.5 tabular-nums">073 400 1861</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-on-background">Store Manager</span>
                <span>Dis-Chem Pharmacy · Former employer</span>
                <span className="font-mono text-accent-ink mt-0.5 tabular-nums">011 391 2399</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 1.5rem !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
