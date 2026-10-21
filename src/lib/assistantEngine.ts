/**
 * Local assistant engine and portfolio knowledge base.
 * Ensures the assistant always delivers answers even when network or LLM APIs stall.
 */

export function generateLocalAssistantReply(userPrompt: string): string {
  const promptLower = userPrompt.toLowerCase().trim();

  // 1. Math solving heuristics
  const isExplicitMath = 
    /\b(solve|derivative|integral|equation|calculate|evaluate|algebra)\b/i.test(promptLower) ||
    promptLower.includes('latex') ||
    /\$\$|\\\(|\\\[/.test(userPrompt) ||
    (/\d+\s*[\+\-\*\/\^=]\s*\d+/.test(promptLower) && !/\b(19\d\d|20\d\d)\b/.test(promptLower));

  if (isExplicitMath) {
    if (promptLower.includes('2x + 5 = 15') || promptLower.includes('2x+5=15')) {
      return `To solve the linear equation $$2x + 5 = 15$$:

1. Subtract $5$ from both sides:
$$2x = 15 - 5$$
$$2x = 10$$

2. Divide both sides by $2$:
$$x = \\frac{10}{2} = 5$$

The solution is $$x = 5$$. [UI:CV]`;
    }

    const simpleEqMatch = promptLower.match(/(\d+)x\s*([+-])\s*(\d+)\s*=\s*(\d+)/);
    if (simpleEqMatch) {
      const a = parseInt(simpleEqMatch[1], 10);
      const op = simpleEqMatch[2];
      const b = parseInt(simpleEqMatch[3], 10);
      const c = parseInt(simpleEqMatch[4], 10);
      const rhs = op === '+' ? c - b : c + b;
      const xVal = rhs / a;
      return `To solve the equation $$${a}x ${op} ${b} = ${c}$$:

1. ${op === '+' ? 'Subtract' : 'Add'} $${b}$ ${op === '+' ? 'from' : 'to'} both sides:
$$${a}x = ${rhs}$$

2. Divide both sides by $${a}$:
$$x = \\frac{${rhs}}{${a}} = ${xVal}$$

The result is $$x = ${xVal}$$. [UI:CV]`;
    }
  }

  // 2. Goal coaching request
  const goalRegex = /(?:i want to|my goal is to|help me|plan for|roadmap for)\s+([^.?!]+)/i;
  const goalMatch = userPrompt.match(goalRegex);
  if (goalMatch) {
    const goalTitle = goalMatch[1].trim();
    return `Here is a structured strategic milestone roadmap to achieve **${goalTitle}**:

1. **Phase 1: Foundation & Planning (Day 1 - Week 1)**
   - Audit requirements, assemble toolchains, and define success metrics.
2. **Phase 2: Core Execution & Iteration (Week 2 - Week 3)**
   - Build MVP components, test incrementally, and refine based on feedback.
3. **Phase 3: Final Delivery & Review (Week 4)**
   - Complete quality assurance, deploy, and conduct a retrospective.

What is your email address so I can send this complete roadmap directly to your inbox? [UI:CV]`;
  }

  // 3. Questions about Kamo / Background / Education / Degree / Greetings
  const isGreetingOrIntro = 
    promptLower.includes('who are you') ||
    promptLower.includes('about kamo') ||
    promptLower.includes('background') ||
    promptLower.includes('introduce') ||
    promptLower.includes('qualification') ||
    promptLower.includes('education') ||
    /\b(hi|hello|hey|greetings)\b/i.test(promptLower);

  if (isGreetingOrIntro) {
    return `Hello! I am **Kamo's GPT**, an AI assistant and Goal Achievement Coach speaking on behalf of **Kamogelo (Kamo) Mosia**. 

Kamo is an **IT Internship Candidate** and final-year **BSc IT** student at the University of Johannesburg (UJ), double majoring in **Computer Science and Informatics** (theoretical coursework completed, degree conferral pending).

Feel free to ask about his projects, technical skills, CV, or request help with mathematics and software development! [UI:CV]`;
  }

  // 4. Projects
  if (
    promptLower.includes('project') ||
    promptLower.includes('calltrax') ||
    promptLower.includes('library') ||
    promptLower.includes('work') ||
    promptLower.includes('portfolio')
  ) {
    return `Here are key projects built and engineered by Kamogelo:

- **CallTrax** (\`call-trax.co.za\`): A client tracking and billing platform for corporate service providers built with PHP, Laravel, React.js, and MySQL.
- **kamocodes API** (\`api.kamocodes.xyz\`): Central REST API gateway managing distributed sandbox requests (Laravel, PostgreSQL).
- **kamocodes Library** (\`library.kamocodes.xyz\`): Cataloging and library management system with borrowing analytics (TypeScript, React, Laravel, MySQL).
- **Personal AI Portfolio App**: Full-stack resume and assistant platform with voice transcription and dynamic sandboxes.

[UI:PROJECTS]`;
  }

  // 5. Skills
  if (
    promptLower.includes('skill') ||
    promptLower.includes('stack') ||
    promptLower.includes('technolog') ||
    promptLower.includes('react') ||
    promptLower.includes('laravel') ||
    promptLower.includes('python') ||
    promptLower.includes('database')
  ) {
    return `Kamogelo's core technical and IT capabilities include:

- **Languages:** JavaScript (ES6+), TypeScript, PHP 8+, Python, SQL (PostgreSQL, MySQL)
- **Frontend:** React 19, Vite, Tailwind CSS, Responsive & Accessible UI
- **Backend & APIs:** Node.js, Express, Laravel REST APIs, Microservices
- **Databases:** PostgreSQL, MySQL, Supabase, Cloud SQL
- **Systems & Networking:** Hardware troubleshooting, Windows/Linux deployment, TCP/IP, DNS, DHCP, asset tracking

[UI:SKILLS]`;
  }

  // 6. CV / Contact
  if (
    promptLower.includes('cv') ||
    promptLower.includes('resume') ||
    promptLower.includes('contact') ||
    promptLower.includes('email') ||
    promptLower.includes('hire')
  ) {
    return `You can download Kamogelo's latest verified curriculum vitae and academic record using the link below:

- **Email:** kamogelomosiah@gmail.com
- **Phone:** +27 65 918 8452
- **Location:** Johannesburg, South Africa
- **GitHub:** [github.com/kamogelomosiah](https://github.com/kamogelomosiah)

[UI:CV]`;
  }

  // Default intelligent response
  return `I am **Kamo's GPT**, speaking on behalf of **Kamogelo Mosia** (BSc IT final-year candidate at UJ). 

I can assist you with details regarding his software development projects (CallTrax, kamocodes API), technical skills (TypeScript, React, PHP/Laravel, SQL), downloading his CV, or working through mathematics and algorithmic problems! [UI:CV]`;
}
