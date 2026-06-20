import { motion } from "motion/react";
import { Download, FileText, ArrowLeft, Mail, Calendar, MapPin, Award, Menu } from "lucide-react";

interface CvPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function CvPage({ onBackToChat, onToggleDrawer }: CvPageProps) {
  const experiences = [
    {
      role: "Cashier and Customer Service Representative",
      company: "Dis-Chem Pharmacy",
      period: "2021",
      location: "Gauteng, South Africa",
      bullets: [
        "Dealt with more than 50 customers a day, handled feedback and complaints, and kept every interaction professional.",
        "Kept accurate transaction records across dynamic Point of Sales (POS) and Customer Care (CRM) systems without errors.",
        "Learned quickly how to use the store systems and helped other store staff members when they got stuck."
      ]
    },
    {
      role: "Cashier and Sales Assistant",
      company: "F-Stop Photolab",
      period: "2016",
      location: "Johannesburg, South Africa",
      bullets: [
        "Helped customers choose the right technology products and answered their questions about photo hardware and software.",
        "Handled cash transactions and kept clean auditing records throughout every scheduled shift."
      ]
    }
  ];

  const education = [
    {
      degree: "BSc Information Technology: Informatics & Computer Science",
      school: "University of Johannesburg (UJ)",
      period: "2019 - 2024",
      grade: "GPA: 60% | Double Major Specialist",
      details: "Core subjects include Algorithms & Data Structures, Software Engineering methodologies, Database Management systems, Computer Networks, and System Design."
    },
    {
      degree: "National Senior Certificate (NSC), Bachelor's Pass",
      school: "Hoërskool Birchleigh",
      period: "2016",
      grade: "71% in IT - Highest in graduating class",
      details: "Achieved highest IT subject mark in the school's graduating class."
    }
  ];

  const achievements = [
    "Top of School in IT: Graduated with absolute highest Information Technology marks in high school (2016)",
    "CAPS IT National Competition: Selected out of Gauteng schools to compete in national IT Olympiad (2016)",
    "Google Developer Tools Certification: Refined debug workflows independently",
    "School Prefect Forum: Elected by educators & peers based on dependable metrics",
    "Final Year Project Team Leader: Led the University of Johannesburg joint system architecture taskforce on time"
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button - Island Style */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-3 sm:pt-5 px-3 sm:px-4">
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur-md rounded-full shadow-md border border-[var(--border-light)]/60 px-3 py-1.5 max-w-3xl">
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[88px]">
        <div className="w-full max-w-4xl pt-4 sm:pt-8">
          
          {/* Header Block inline within the sheet */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[var(--border-light)] mb-10">
            <div>
              <h1 className="text-[32px] md:text-[40px] font-medium text-[var(--text-main)] tracking-normal font-display">
                Kamogelo Mosia
              </h1>
              <p className="text-[var(--text-muted)] text-[18px] mt-1 font-medium tracking-wide">
                IT Intern | BSc Computer Science
              </p>
              <div className="flex flex-wrap gap-4 text-[13px] font-medium text-[var(--text-muted)] mt-4">
                <span className="flex items-center gap-1.5"><Mail size={16} className="text-accent" /> kamogelomosiah@gmail.com</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[var(--color-accent)]" /> Johannesburg, SA</span>
              </div>
            </div>

            <button className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-full hover:bg-[#1557B0] transition-colors font-medium text-[14px] cursor-pointer shadow-sm border-0">
              Download PDF <Download size={18} />
            </button>
          </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Timeline and Details (Col-span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div>
              <h2 className="text-[20px] font-medium mb-6 text-[var(--color-accent)] border-l-4 border-[var(--color-accent)] pl-4 font-display">
                Work Experience
              </h2>
              <div className="flex flex-col gap-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-200">
                {experiences.map((exp, i) => (
                  <div key={i} className="relative pl-10">
                    {/* Ring Indicator */}
                    <div className="absolute left-[9px] top-1.5 w-4 h-4 rounded-full border border-[var(--color-accent)] bg-[var(--bg-card)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full" />
                    </div>

                    <p className="flex items-center gap-2 text-[12px] font-mono text-[var(--color-accent)] uppercase font-medium">
                      <Calendar size={14} /> {exp.period}
                    </p>
                    <h3 className="text-[18px] font-medium text-[var(--text-main)] mt-1 font-display">
                      {exp.role} <span className="text-[var(--text-muted)] font-normal">at {exp.company}</span>
                    </h3>
                    <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{exp.location}</p>

                    <ul className="mt-4 flex flex-col gap-2.5">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx} className="text-[#444746] text-[14px] leading-relaxed relative pl-4 before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-[var(--border-light)] before:rounded-full">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[20px] font-medium mb-6 text-[var(--color-accent)] border-l-4 border-[var(--color-accent)] pl-4 font-display">
                Education
              </h2>
              <div className="flex flex-col gap-8 pl-4 border-l border-[var(--border-light)]">
                {education.map((edu, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <p className="text-[12px] font-mono text-[var(--text-muted)]">{edu.period}</p>
                    <h3 className="text-[16px] font-medium text-[var(--text-main)] font-display">
                      {edu.degree}
                    </h3>
                    <p className="text-[14px] font-medium text-[var(--color-accent)]">{edu.school} {edu.grade && `| ${edu.grade}`}</p>
                    {edu.details && <p className="text-[14px] text-[#444746] mt-1 leading-relaxed">{edu.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Technical skills, Sidebar layout (Col-span 1) */}
          <div className="flex flex-col gap-6">
            <div className="border border-[var(--border-light)] rounded-[24px] p-6 bg-[var(--bg-card)] shadow-sm">
              <h3 className="text-[14px] font-medium text-[var(--text-muted)] tracking-wide mb-5 uppercase">
                Technical Toolkit
              </h3>
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-1">
                    <span className="text-[var(--text-main)]">Systems & Networking</span>
                    <span className="text-[var(--color-accent)]">88%</span>
                  </div>
                  <div className="w-full bg-[#E8EAED] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-accent)] h-full rounded-full" style={{ width: "88%" }} />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Windows, macOS, Linux, TCP/IP, DNS, DHCP</p>
                </div>

                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-1">
                    <span className="text-[var(--text-main)]">Software Development</span>
                    <span className="text-[var(--color-accent)]">85%</span>
                  </div>
                  <div className="w-full bg-[#E8EAED] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-accent)] h-full rounded-full" style={{ width: "85%" }} />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">JavaScript, TypeScript, PHP, React.js, Laravel</p>
                </div>

                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-1">
                    <span className="text-[var(--text-main)]">IT Config & Diagnostic</span>
                    <span className="text-[var(--color-accent)]">90%</span>
                  </div>
                  <div className="w-full bg-[#E8EAED] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-accent)] h-full rounded-full" style={{ width: "90%" }} />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">PC setup, diagnostic support, SSD/RAM upgrades</p>
                </div>

                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-1">
                    <span className="text-[var(--text-main)]">Databases & Gateway</span>
                    <span className="text-[var(--color-accent)]">82%</span>
                  </div>
                  <div className="w-full bg-[#E8EAED] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-accent)] h-full rounded-full" style={{ width: "82%" }} />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">MySQL, PostgreSQL, REST APIs integrations</p>
                </div>
              </div>
            </div>

            <div className="border border-[#FCE8E6] rounded-[24px] p-6 bg-[#FEF7F6] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-[#D93025]" />
                <h3 className="text-[14px] font-medium text-[#C5221F] tracking-wide uppercase">
                  Honors & Awards
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {achievements.map((ach, i) => (
                  <div key={i} className="text-[13px] text-[var(--text-main)] border-l-2 border-[#D93025]/30 pl-3 py-1.5 bg-[var(--bg-card)]/50 rounded-r-[8px]">
                    {ach}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
