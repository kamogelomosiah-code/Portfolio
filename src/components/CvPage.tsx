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
      className="flex-1 h-full w-full bg-[#F9F9F9] text-black flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button */}
      <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 bg-[#F9F9F9] z-10 shrink-0 border-b border-gray-200/60">
        <div className="flex items-center gap-3 m-0 p-0">
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 text-black transition-colors shadow-sm cursor-pointer shrink-0 m-0"
            style={{ borderRadius: '100%' }}
            title="Back to conversational agent"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-semibold text-lg text-black tracking-tight font-sans m-0 p-0">Curriculum Vitae</h1>
        </div>
      </div>

      {/* Main Content Area - Flush on mobile, card on desktop */}
      <div className="flex-1 overflow-y-auto w-full md:w-auto flex flex-col items-center pb-32 px-6 md:px-12 bg-white md:rounded-tl-2xl md:shadow-sm md:border md:border-gray-100 md:mx-4 md:mt-2 mx-0 mt-0 border-0 rounded-none shadow-none">
        <div className="w-full max-w-4xl pt-10 md:pt-14 font-sans">
          
          {/* Header Block inline within the sheet */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-gray-100 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-accent" size={24} />
                <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Curriculum Vitae</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-black mt-2 tracking-tight">
                Kamogelo Mosia
              </h1>
              <p className="text-gray-500 text-lg mt-1 font-medium">
                IT Intern | BSc Computer Science & Informatics Graduate
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400 mt-4">
                <span className="flex items-center gap-1.5"><Mail size={12} /> kamogelomosiah@gmail.com</span>
                <span className="flex items-center gap-1.5"><MapPin size={12} /> Alexandra, Johannesburg</span>
              </div>
            </div>

            <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-accent transition-colors font-semibold text-sm cursor-pointer shadow-sm">
              Download PDF CV <Download size={14} />
            </button>
          </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Timeline and Details (Col-span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div>
              <h2 className="text-xl font-bold mb-6 text-black border-l-4 border-accent pl-4">
                Work Experience
              </h2>
              <div className="flex flex-col gap-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                {experiences.map((exp, i) => (
                  <div key={i} className="relative pl-10">
                    {/* Ring Indicator */}
                    <div className="absolute left-[9px] top-1.5 w-4 h-4 rounded-full border border-accent bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    </div>

                    <p className="flex items-center gap-2 text-xs font-mono text-accent uppercase font-bold">
                      <Calendar size={12} /> {exp.period}
                    </p>
                    <h3 className="text-lg font-bold text-black mt-1">
                      {exp.role} <span className="text-gray-400 font-normal">at {exp.company}</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{exp.location}</p>

                    <ul className="mt-4 flex flex-col gap-2.5">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx} className="text-gray-600 text-sm leading-relaxed relative pl-4 before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-6 text-black border-l-4 border-accent pl-4">
                Education
              </h2>
              <div className="flex flex-col gap-8 pl-4 border-l border-gray-100">
                {education.map((edu, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <p className="text-xs font-mono text-gray-400">{edu.period}</p>
                    <h3 className="text-base font-bold text-black">
                      {edu.degree}
                    </h3>
                    <p className="text-sm font-semibold text-accent">{edu.school} {edu.grade && `| ${edu.grade}`}</p>
                    {edu.details && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{edu.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Technical skills, Sidebar layout (Col-span 1) */}
          <div className="flex flex-col gap-8">
            <div className="border border-gray-100 rounded-[20px] p-6 bg-gray-50/50">
              <h3 className="text-sm font-bold text-black tracking-widest uppercase mb-4">
                Technical Toolkit
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Systems & Networking</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: "88%" }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Windows, macOS, Linux, TCP/IP, DNS, DHCP</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Software Development</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: "85%" }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">JavaScript, TypeScript, PHP, React.js, Laravel</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>IT Configurations & Diagnostic</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: "90%" }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">PC setup, diagnostic support, SSD/RAM upgrades</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Databases & Gateway</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: "82%" }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">MySQL, PostgreSQL, REST APIs integrations</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-[20px] p-6 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-accent" />
                <h3 className="text-sm font-bold text-black tracking-widest uppercase">
                  Honors & Awards
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {achievements.map((ach, i) => (
                  <div key={i} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-3 py-1 bg-gray-50/50 rounded-r-md">
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
