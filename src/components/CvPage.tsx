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
      category: "Data Skills",
      details: "Data collection and preparation, data quality and governance, database design, SQL querying, data validation, data accuracy"
    },
    {
      category: "Python and Analytics",
      details: "Python (actively studying), SQL (MySQL, PostgreSQL), data interpretation, trend analysis, performance metrics, Excel (pivot tables, VLOOKUP, charts, formulas)"
    },
    {
      category: "Visualisation and Reporting",
      details: "Dashboard development, management reporting, documentation, Google Sheets, Excel charts, technical writing"
    },
    {
      category: "Programming",
      details: "JavaScript, PHP, SQL, React.js, Node.js, REST APIs, MySQL, PostgreSQL, Firebase, HTML5, CSS3"
    },
    {
      category: "Current Study",
      details: "Python programming certificate, CompTIA IT, Docker, Flask (all actively in progress)"
    },
    {
      category: "Collaboration and Comms",
      details: "Team-based project delivery, stakeholder communication, technical documentation, agile awareness"
    },
    {
      category: "Tools",
      details: "Git, GitHub, VS Code, Postman, Chrome DevTools (Google Certified), Render, Android Studio"
    },
    {
      category: "Personal",
      details: "Self-motivated, analytical, detail-oriented, good time management, strong communicator, team player, immediately available"
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
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur-md rounded-full shadow-md border border-[var(--border-light)]/60 px-3 py-1.5 max-w-4xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <button 
              onClick={onBackToChat}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-black/5 text-[var(--text-muted)] transition-colors cursor-pointer shrink-0 m-0 border-0 bg-transparent"
              title="Back to conversational agent"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-medium text-[16px] sm:text-[18px] md:text-[20px] text-[var(--text-main)] tracking-normal font-display m-0 p-0 ml-1">Curriculum Vitae</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#C69214] hover:bg-[#A87C10] text-white px-5 py-2.5 rounded-full transition-colors font-medium text-[14px] cursor-pointer shadow-sm border-0"
            >
              Print / Save PDF <Download size={16} />
            </button>
            {onToggleDrawer && (
              <button 
                onClick={onToggleDrawer}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 text-[var(--text-muted)] transition-colors cursor-pointer shrink-0 border-0 bg-transparent"
                title="Open Menu"
              >
                <Menu size={22} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Print Container */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)] print:p-0 print:overflow-visible print:bg-white print:pb-0">
        <div className="w-full max-w-4xl pt-4 sm:pt-8 print:pt-0">
          
          {/* CV Sheet - Paper look */}
          <div className="w-full bg-[var(--bg-card)] dark:bg-[#1E1F20] print:bg-white border border-[var(--border-light)] print:border-0 shadow-lg print:shadow-none rounded-[32px] print:rounded-none p-6 sm:p-12 md:p-16 flex flex-col text-left transition-all relative">
            
            {/* Header Block */}
            <div className="border-b-2 border-[#C69214] pb-6 mb-8 print:mb-6">
              <h1 className="text-[36px] sm:text-[44px] md:text-[50px] font-bold text-[#C69214] tracking-tight leading-none mb-3">
                Kamogelo Mosia
              </h1>
              
              <div className="text-[14px] sm:text-[15px] text-[var(--text-muted)] dark:text-[#A8DAB5] font-medium tracking-wide mb-4">
                Data Science Intern <span className="mx-1 text-[#C69214]">•</span> Komatsu Mining Corporation <span className="mx-1 text-[#C69214]">•</span> Wadeville, Germiston, Gauteng
              </div>

              <div className="flex flex-col gap-1.5 text-[13px] sm:text-[14px] text-[var(--text-muted)] font-medium">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="mailto:kamogelomosiah@gmail.com" className="hover:text-[#C69214] transition-colors flex items-center gap-1 shrink-0">
                    <Mail size={14} className="text-[#C69214]" /> kamogelomosiah@gmail.com
                  </a>
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone size={14} className="text-[#C69214]" /> 067 742 6447
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone size={14} className="text-[#C69214]" /> 061 362 4165
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="https://github.com/kamogelomosiah-code" target="_blank" rel="noreferrer" className="hover:text-[#C69214] transition-colors flex items-center gap-1 shrink-0">
                    <Github size={14} className="text-[#C69214]" /> github.com/kamogelomosiah-code
                  </a>
                  <a href="https://portfolio-q5ji.onrender.com" target="_blank" rel="noreferrer" className="hover:text-[#C69214] transition-colors flex items-center gap-1 shrink-0">
                    <Globe size={14} className="text-[#C69214]" /> portfolio-q5ji.onrender.com
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[#5F6368] dark:text-[#A8A8A8] text-[12px] sm:text-[13px]">
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-[#C69214]" /> Alexandra, Johannesburg, Gauteng</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>South African Citizen</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>Unemployed</span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="font-semibold text-[#C69214]">Available immediately</span>
                </div>
              </div>
            </div>

            {/* WHO I AM */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                WHO I AM
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              <div className="text-[14px] sm:text-[15px] text-[var(--text-main)] dark:text-[#E8EAED] leading-relaxed flex flex-col gap-4">
                <p>
                  Data has always been part of how I think. When I build a system, I start by asking what information needs 
                  to flow through it, where it comes from, and what happens when it is wrong. That is not a skill I was taught. 
                  It is how my mind works.
                </p>
                <p>
                  I graduated from the University of Johannesburg in February 2026 with a BSc in Information Technology, 
                  Computer Science and Informatics. My degree gave me a strong foundation in databases, data 
                  management, system design, and software engineering. I am currently studying Python, which is the 
                  language at the heart of modern data science, and I am learning it because I want to go deeper into 
                  data, not because a certificate said I should.
                </p>
                <p>
                  Komatsu operates in mining, construction, and industrial machinery. The decisions made in those 
                  environments carry real weight and real risk. Good data is what makes those decisions defensible. I want 
                  to be part of the team that makes that data trustworthy.
                </p>
              </div>
            </div>

            {/* WHY DATA SCIENCE AND WHY KOMATSU */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                WHY DATA SCIENCE AND WHY KOMATSU
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              <div className="text-[14px] sm:text-[15px] text-[var(--text-main)] dark:text-[#E8EAED] leading-relaxed flex flex-col gap-4">
                <p>
                  Every application I have built has a database behind it. I designed the schemas, wrote the queries, and 
                  thought carefully about what data needed to be stored, how it should be structured, and how it should be 
                  retrieved. When I built MasterAPI, I was not just writing endpoints. I was designing how data moves through 
                  a system cleanly and reliably. That is data engineering thinking applied in a development context.
                </p>
                <p>
                  I am energised by data problems because they have real answers. Either the data is accurate or it is not. 
                  Either the pattern is there or it is not. Either the visualisation tells the truth or it does not. I like that precision.
                </p>
                <p>
                  I am self-motivated, I manage my time well, I communicate clearly, and I work just as effectively alone as I 
                  do in a team. All of those things are true and all of them matter in a data science internship.
                </p>
                <p>
                  Komatsu's environment is diverse, technically demanding, and hands-on. That is exactly the kind of 
                  environment I grow in.
                </p>
              </div>
            </div>

            {/* SKILLS TABLE */}
            <div className="mb-8 print:mb-6 page-break-before">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                SKILLS
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              
              <div className="border border-[#F0E4C3] dark:border-[#5C4D26] rounded-xl overflow-hidden shadow-sm flex flex-col">
                {skillsData.map((skill, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col sm:flex-row border-b border-[#F0E4C3] dark:border-[#5C4D26] last:border-0`}
                  >
                    <div className="w-full sm:w-[220px] md:w-[260px] bg-[#FFFDF3] dark:bg-[#2C2615]/60 print:bg-[#FFFDF7] p-4 text-[#A67C1E] font-semibold text-[13px] sm:text-[14px] shrink-0 border-b sm:border-b-0 sm:border-r border-[#F0E4C3] dark:border-[#5C4D26] flex items-center">
                      {skill.category}
                    </div>
                    <div className="flex-1 p-4 text-[13px] sm:text-[14px] text-[var(--text-main)] dark:text-[#E8EAED] bg-white dark:bg-[#1C1F22] print:bg-white leading-relaxed">
                      {skill.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RELEVANT PROJECTS */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                RELEVANT PROJECTS
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] italic mb-4">
                These projects are the clearest evidence of how I think about data.
              </p>
              
              <div className="flex flex-col gap-6">
                {projects.map((proj, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] dark:text-[#E8EAED]">
                        {proj.title}
                      </h3>
                      <a 
                        href={proj.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[12px] sm:text-[13px] text-[#C69214] hover:underline break-all font-mono"
                      >
                        {proj.link}
                      </a>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* WORK EXPERIENCE */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                WORK EXPERIENCE
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              
              <div className="flex flex-col gap-6">
                {/* Job 1 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] dark:text-[#E8EAED]">F-Stop Photolab</span>
                      <span className="text-[14px] text-[var(--text-muted)] dark:text-[#A8DAB5] italic">Semi-Technical Support and Cashier</span>
                    </div>
                    <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono font-medium flex gap-2 shrink-0">
                      <span>Johannesburg</span> <span>2016</span>
                    </div>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                    I worked with equipment data every day. Device histories. Fault logs. Client records. I kept everything 
                    accurate and I flagged inconsistencies when they appeared. In a small business environment, data 
                    accuracy is not optional. A wrong record means a wrong decision and a frustrated customer.
                  </p>
                </div>

                {/* Job 2 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] dark:text-[#E8EAED]">Dis-Chem Pharmacy</span>
                      <span className="text-[14px] text-[var(--text-muted)] dark:text-[#A8DAB5] italic">Cashier and Customer Service Representative</span>
                    </div>
                    <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono font-medium flex gap-2 shrink-0">
                      <span>Gauteng</span> <span>2021</span>
                    </div>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                    High-volume transaction processing with strict accuracy requirements. I maintained zero-error records 
                    daily under sustained pressure. The discipline required to do that correctly, every time, is the same 
                    discipline that data quality governance demands.
                  </p>
                </div>
              </div>
            </div>

            {/* EDUCATION */}
            <div className="mb-8 print:mb-6 page-break-before">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                EDUCATION
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              
              <div className="flex flex-col gap-6">
                {/* UJ */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] dark:text-[#E8EAED]">University of Johannesburg</span>
                    <span className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono shrink-0">2019 to 2024 (Degree Awarded February 2026)</span>
                  </div>
                  <div className="text-[14px] font-semibold text-[#C69214] mt-0.5">
                    BSc Information Technology in Computer Science and Informatics <span className="text-[12px] px-2 py-0.5 rounded bg-[#FFFDF3] border border-[#F0E4C3] text-[#A67C1E] dark:bg-black/30 dark:border-white/10 ml-2">NQF Level 7</span>
                  </div>
                  <div className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono mt-1">
                    SAQA Reg 80372 <span className="mx-1.5">•</span> Student No 217004345
                  </div>
                  <ul className="list-disc list-outside ml-5 mt-2 flex flex-col gap-1 text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5]">
                    <li>Informatics 1A and IT Management 1A passed with distinction.</li>
                    <li><span className="font-semibold">Modules:</span> Software Engineering, System Design, Databases, IT Management, OOP, Algorithms, Informatics.</li>
                  </ul>
                </div>

                {/* Hoerskool */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] dark:text-[#E8EAED]">Hoerskool Birchleigh</span>
                    <span className="text-[12px] sm:text-[13px] text-[var(--text-muted)] font-mono shrink-0">2016</span>
                  </div>
                  <div className="text-[14px] font-semibold text-[#C69214] mt-0.5">
                    National Senior Certificate <span className="mx-1 text-[#C69214]">•</span> Bachelor's Pass <span className="mx-1 text-[#C69214]">•</span> IT 71% (Highest in school)
                  </div>
                  <ul className="list-disc list-outside ml-5 mt-1 text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5]">
                    <li>Elected school prefect.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CERTIFICATIONS AND ACTIVE STUDY */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                CERTIFICATIONS AND ACTIVE STUDY
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              
              <ul className="list-disc list-outside ml-5 flex flex-col gap-1.5 text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                <li><span className="font-semibold text-[var(--text-main)] dark:text-white">Google Developer Tools Certification</span> — completed</li>
                <li><span className="font-semibold text-[var(--text-main)] dark:text-white">Python Programming Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)] dark:text-white">CompTIA IT Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)] dark:text-white">Docker Certificate</span> — in progress</li>
                <li><span className="font-semibold text-[var(--text-main)] dark:text-white">Flask Certificate</span> — in progress</li>
              </ul>
            </div>

            {/* ONE LAST THING */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                ONE LAST THING
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              <div className="text-[13px] sm:text-[14px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed flex flex-col gap-3">
                <p>
                  I ice skate. I read. I do not drink. I show up every day clear-headed and ready.
                </p>
                <p>
                  Mining is one of the most data-intensive industries in the world. The machines generate it. The operations 
                  depend on it. The safety record is built on it. I want to be part of the team that handles it properly, and I am 
                  ready to start.
                </p>
              </div>
            </div>

            {/* REFERENCES */}
            <div className="mb-0 print:mb-0">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#C69214] tracking-wider uppercase mb-1">
                REFERENCES
              </h2>
              <div className="w-full h-0.5 bg-[#C69214] mb-4" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] sm:text-[14px] leading-relaxed text-[#444746] dark:text-[#C4C7C5]">
                {/* Ref 1 */}
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--text-main)] dark:text-white">Mr Tommy Ferrara</span>
                  <span className="italic">F-Stop Photolab <span className="mx-1">•</span> Former employer</span>
                  <span className="font-mono text-[#C69214] mt-0.5">073 400 1861</span>
                </div>

                {/* Ref 2 */}
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--text-main)] dark:text-white">Store Manager</span>
                  <span className="italic">Dis-Chem Pharmacy <span className="mx-1">•</span> Former employer</span>
                  <span className="font-mono text-[#C69214] mt-0.5">011 391 2399</span>
                </div>
              </div>
            </div>

          </div>
          
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
