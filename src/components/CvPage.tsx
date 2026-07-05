import React from "react";
import { motion } from "motion/react";
import { Download, ArrowLeft, Mail, Phone, Github, Globe, MapPin, Menu, Award, FileText, CheckCircle2 } from "lucide-react";

interface CvPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function CvPage({ onBackToChat, onToggleDrawer }: CvPageProps) {
  const handlePrint = () => {
    window.print();
  };

  const skillsData = [
    {
      category: "Software Development",
      details: "Full-stack development, REST APIs, clean coding patterns, responsive design, state management, system architecture, database security"
    },
    {
      category: "Programming Languages",
      details: "JavaScript, Python (actively studying), SQL (PostgreSQL, MySQL), PHP, HTML5, CSS3"
    },
    {
      category: "Frameworks & Libraries",
      details: "React.js, Node.js, Express, Laravel, Flask (actively in progress), Tailwind CSS"
    },
    {
      category: "Database & Systems",
      details: "Database schema design, query optimization, indexing, data normalization, PostgreSQL, MySQL, Firebase/Firestore"
    },
    {
      category: "IT Operations & Support",
      details: "Hardware diagnostics, technical troubleshooting, software configuration, operating system setup, end-user support"
    },
    {
      category: "DevOps & Tools",
      details: "Git, GitHub, VS Code, Postman, Docker (actively studying), Chrome DevTools (Google Certified), Render, Android Studio, Excel"
    },
    {
      category: "Soft Skills & Teamwork",
      details: "Technical documentation, systems analysis, Agile methodologies, problem-solving, collaboration, prompt response times, self-motivated"
    },
    {
      category: "Current Certifications",
      details: "Google Developer Tools Certification (completed), CompTIA IT Certificate (in progress)"
    }
  ];

  const projects = [
    {
      title: "MasterAPI",
      link: "github.com/kamogelomosiah-code/MasterAPI-main",
      url: "https://github.com/kamogelomosiah-code/MasterAPI-main",
      description: "I designed a centralised REST API backend to solve a data duplication problem. Multiple components were all pulling the same data independently, which created inconsistency and inefficiency. I built one clean source of truth with structured endpoints and proper data validation. That is a data quality and governance problem solved in code."
    },
    {
      title: "Resume Maker",
      link: "kamogelomosiah-code.github.io/CvMaker/",
      url: "https://kamogelomosiah-code.github.io/CvMaker/",
      description: "A full-stack application with a PostgreSQL database that I designed, built, and deployed for a paying client. I handled the data schema design, query optimisation, and data accuracy checks throughout. The database is still running correctly in production today."
    },
    {
      title: "Real Time Chat Application",
      link: "s-c4nk.onrender.com",
      url: "https://s-c4nk.onrender.com",
      description: "A live application managing real-time data streams using WebSockets. Requires ongoing data integrity monitoring and performance oversight in a live environment."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col overflow-hidden relative print:overflow-visible print:bg-white print:text-black"
    >
      {/* Top Navbar with Back Button - Island Style */}
      <div className="absolute top-0 left-0 md:left-20 lg:left-[88px] right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-3 sm:px-4 print:hidden">
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur-md rounded-xl shadow-md border border-[var(--border-light)]/60 px-4 py-2 max-w-4xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <h1 className="font-medium text-[16px] sm:text-[18px] md:text-[20px] text-[var(--text-main)] tracking-normal font-display m-0 p-0 ml-1 py-1">Curriculum Vitae</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[var(--color-accent)] hover:opacity-95 text-white px-4 py-2 rounded-lg transition-colors font-medium text-[14px] cursor-pointer shadow-sm border-0"
              title="Download or Print CV"
            >
              <Download size={18} /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Print Container */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)] print:p-0 print:overflow-visible print:bg-white print:pb-0">
        <div className="w-full max-w-4xl pt-4 sm:pt-8 print:pt-0">
          
          {/* CV Sheet - Paper look */}
          <div className="w-full bg-[var(--bg-card)] print:bg-white border border-[var(--border-light)] print:border-0 shadow-lg print:shadow-none rounded-[32px] print:rounded-none p-6 sm:p-12 md:p-16 flex flex-col text-left transition-all relative">
            
            {/* Header Block */}
            <div className="border-b-2 border-[var(--color-accent)] pb-6 mb-8 print:mb-6">
              <h1 className="text-[36px] sm:text-[44px] md:text-[50px] font-bold text-[var(--color-accent)] tracking-tight leading-none mb-3">
                Kamogelo Mosia
              </h1>
              
              <div className="text-[14px] sm:text-[15px] text-[var(--text-muted)] font-medium tracking-wide mb-4">
                AI & Python Software Engineer <span className="mx-1 text-[var(--color-accent)]">•</span> Johannesburg, Gauteng
              </div>

              <div className="flex flex-col gap-1.5 text-[13px] sm:text-[14px] text-[var(--text-muted)] font-medium">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="mailto:kamogelomosiah@gmail.com" className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 shrink-0">
                    <Mail size={14} className="text-[var(--color-accent)]" /> kamogelomosiah@gmail.com
                  </a>
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone size={14} className="text-[var(--color-accent)]" /> 067 742 6447
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone size={14} className="text-[var(--color-accent)]" /> 061 362 4165
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="https://github.com/kamogelomosiah-code" target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 shrink-0">
                    <Github size={14} className="text-[var(--color-accent)]" /> github.com/kamogelomosiah-code
                  </a>
                  <a href="https://portfolio-q5ji.onrender.com" target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 shrink-0">
                    <Globe size={14} className="text-[var(--color-accent)]" /> portfolio-q5ji.onrender.com
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[var(--text-muted)] text-[12px] sm:text-[13px]">
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-[var(--color-accent)]" /> Alexandra, Johannesburg, Gauteng</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>South African Citizen</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>Unemployed</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="font-semibold text-[var(--color-accent)]">Available immediately</span>
                </div>
              </div>
            </div>

            {/* PROFESSIONAL PROFILE */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                PROFESSIONAL PROFILE
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              <div className="text-[14px] sm:text-[15px] text-[var(--text-main)] leading-relaxed flex flex-col gap-4">
                <p>
                  I am a highly analytical, detail-oriented AI and Python Software Engineer with a deep foundation in Computer Science, Software Engineering, and Informatics. I specialize in building high-performance Python backends, orchestrating local LLM pipelines, implementing retrieval-augmented generation (RAG) workflows, and designing scalable database solutions.
                </p>
                <p>
                  I have completed the theoretical coursework for a BSc in Information Technology at the University of Johannesburg, double majoring in Computer Science and Informatics, with degree conferral pending. This comprehensive academic training equipped me with robust systems design, DBMS optimization, software engineering paradigms, and advanced analytics.
                </p>
                <p>
                  My passion lies in constructing state-of-the-art intelligent systems. I possess a deep practical mastery of local language models, vector search spaces, and modular codebases, allowing me to build robust, secure, and highly functional software systems that are smart, fast, and secure.
                </p>
              </div>
            </div>

            {/* TECHNICAL PHILOSOPHY & OBJECTIVE */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                TECHNICAL APPROACH & EXPERIENCE
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              <div className="text-[14px] sm:text-[15px] text-[var(--text-main)] leading-relaxed flex flex-col gap-4">
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
            </div>

            {/* SKILLS TABLE */}
            <div className="mb-8 print:mb-6 page-break-before">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                SKILLS
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              
              <div className="border border-[var(--border-light)] rounded-xl overflow-hidden shadow-sm flex flex-col">
                {skillsData.map((skill, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col sm:flex-row border-b border-[var(--border-light)] last:border-0`}
                  >
                    <div className="w-full sm:w-[220px] md:w-[260px] bg-[var(--bg-main)] p-4 text-[var(--color-accent)] font-semibold text-[13px] sm:text-[14px] shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border-light)] flex items-center">
                      {skill.category}
                    </div>
                    <div className="flex-1 p-4 text-[13px] sm:text-[14px] text-[var(--text-main)] bg-[var(--bg-card)] leading-relaxed">
                      {skill.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RELEVANT PROJECTS */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                RELEVANT PROJECTS
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] italic mb-4">
                These projects showcase my hands-on experience in full-stack development, database architecture, and real-time systems.
              </p>
              
              <div className="flex flex-col gap-6">
                {projects.map((proj, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)]">
                        {proj.title}
                      </h3>
                      <a 
                        href={proj.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[12px] sm:text-[13px] text-[var(--color-accent)] hover:underline break-all font-mono"
                      >
                        {proj.link}
                      </a>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* WORK EXPERIENCE */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                WORK EXPERIENCE
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              
              <div className="flex flex-col gap-6">
                {/* Job 1 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)]">F-Stop Photolab</span>
                      <span className="text-[14px] text-[var(--text-muted)] italic">Semi-Technical Support and Cashier</span>
                    </div>
                    <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono font-medium flex gap-2 shrink-0">
                      <span>Johannesburg</span> <span>2016</span>
                    </div>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] leading-relaxed">
                    I worked with equipment data every day. Device histories. Fault logs. Client records. I kept everything 
                    accurate and I flagged inconsistencies when they appeared. In a small business environment, data 
                    accuracy is not optional. A wrong record means a wrong decision and a frustrated customer.
                  </p>
                </div>

                {/* Job 2 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)]">Dis-Chem Pharmacy</span>
                      <span className="text-[14px] text-[var(--text-muted)] italic">Cashier and Customer Service Representative</span>
                    </div>
                    <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono font-medium flex gap-2 shrink-0">
                      <span>Gauteng</span> <span>2021</span>
                    </div>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] leading-relaxed">
                    High-volume transaction processing with strict accuracy requirements. I maintained zero-error records 
                    daily under sustained pressure. The discipline required to do that correctly, every time, is the same 
                    discipline that data quality governance demands.
                  </p>
                </div>
              </div>
            </div>

            {/* EDUCATION */}
            <div className="mb-8 print:mb-6 page-break-before">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                EDUCATION
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              
              <div className="flex flex-col gap-6">
                {/* UJ */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)]">University of Johannesburg</span>
                    <span className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono shrink-0">2019 to 2024 (Coursework Completed, Conferral Pending)</span>
                  </div>
                  <div className="text-[14px] font-semibold text-[var(--color-accent)] mt-0.5 flex items-center flex-wrap gap-2">
                    <span>BSc Information Technology in Computer Science and Informatics</span>
                    <span className="text-[12px] px-2 py-0.5 rounded bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 text-[var(--color-accent)]">NQF Level 7 (Pending)</span>
                  </div>
                  <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono mt-1">
                    SAQA Reg 80372 <span className="mx-1.5">•</span> Student No 217004345
                  </div>
                  <ul className="list-disc list-outside ml-5 mt-2 flex flex-col gap-1 text-[13px] sm:text-[14px] text-[var(--text-muted)]">
                    <li>Informatics 1A and IT Management 1A passed with distinction.</li>
                    <li><span className="font-semibold text-[var(--text-main)]">Modules:</span> Software Engineering, System Design, Databases, IT Management, OOP, Algorithms, Informatics.</li>
                  </ul>
                </div>

                {/* Hoerskool */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)]">Hoerskool Birchleigh</span>
                    <span className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono shrink-0">2016</span>
                  </div>
                  <div className="text-[14px] font-semibold text-[var(--color-accent)] mt-0.5">
                    National Senior Certificate <span className="mx-1 text-[var(--color-accent)]">•</span> Bachelor's Pass <span className="mx-1 text-[var(--color-accent)]">•</span> IT 71% (Highest in school)
                  </div>
                  <ul className="list-disc list-outside ml-5 mt-1 text-[13px] sm:text-[14px] text-[var(--text-muted)]">
                    <li>Elected school prefect.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CERTIFICATIONS AND ACTIVE STUDY */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                CERTIFICATIONS AND ACTIVE STUDY
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              
              <ul className="list-disc list-outside ml-5 flex flex-col gap-1.5 text-[13px] sm:text-[14px] text-[var(--text-muted)] leading-relaxed">
                <li><span className="font-semibold text-[var(--text-main)]">Google Developer Tools Certification</span> — completed</li>
                <li><span className="font-semibold text-[var(--text-main)]">Python Programming Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)]">CompTIA IT Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)]">Docker Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)]">Flask Certificate</span> — in progress</li>
              </ul>
            </div>

            {/* ONE LAST THING */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                ONE LAST THING
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              <div className="text-[13px] sm:text-[14px] text-[var(--text-muted)] leading-relaxed flex flex-col gap-3">
                <p>
                  I ice skate. I read. I do not drink. I show up every day clear-headed, focused, and ready to solve complex problems.
                </p>
                <p>
                  Technology and IT infrastructure are the backbone of any modern enterprise. I am passionate about constructing robust software, 
                  handling data streams with integrity, and providing stellar technical systems management. I want to be part of a team 
                  that builds solutions of absolute quality, and I am ready to start immediately.
                </p>
              </div>
            </div>

            {/* REFERENCES */}
            <div className="mb-0 print:mb-0">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--color-accent)] tracking-wider uppercase mb-1">
                REFERENCES
              </h2>
              <div className="w-full h-0.5 bg-[var(--color-accent)] mb-4" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] sm:text-[14px] leading-relaxed text-[var(--text-muted)]">
                {/* Ref 1 */}
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--text-main)]">Mr Tommy Ferrara</span>
                  <span className="italic">F-Stop Photolab <span className="mx-1">•</span> Former employer</span>
                  <span className="font-mono text-[var(--color-accent)] mt-0.5">073 400 1861</span>
                </div>

                {/* Ref 2 */}
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--text-main)]">Store Manager</span>
                  <span className="italic">Dis-Chem Pharmacy <span className="mx-1">•</span> Former employer</span>
                  <span className="font-mono text-[var(--color-accent)] mt-0.5">011 391 2399</span>
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </div>
      
      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none print:hidden">
        <div className="flex items-center gap-2 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur-md rounded-full shadow-lg border border-[var(--border-light)]/60 px-2 py-2">
          {onToggleDrawer && (
            <button 
              onClick={onToggleDrawer}
              className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition-colors cursor-pointer border-0 bg-transparent"
              title="Menu"
            >
              <Menu size={24} />
            </button>
          )}
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-main)] transition-colors cursor-pointer border-0 bg-transparent"
            title="Back to Chat"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-[15px]">Back to Chat</span>
          </button>
        </div>
      </div>
      
      {/* CSS print utility specifically for pagination breaks */}
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
