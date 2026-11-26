import defaultProfile from "../../me.json";
import type { ProfileData } from "../types/profile";

/**
 * Local assistant engine grounded in the active profile JSON.
 * Strictly focused on speaking about Kamogelo, helping visitors find him, and sharing contact options.
 */
export function generateLocalAssistantReply(
  userPrompt: string,
  profile: ProfileData = defaultProfile as ProfileData
): string {
  const promptLower = userPrompt.toLowerCase().trim();
  const name = profile?.name || "Kamogelo Mosia";
  const nickname = profile?.nickname || "Kamo";
  const profession = profile?.profession || "Software & IT Solutions Engineer";
  const overview = profile?.overview || "";
  const email = profile?.email || "kamogelomosiah@gmail.com";
  const phone = profile?.phone || "";
  const location = profile?.location || "Johannesburg, South Africa";
  const availability = profile?.availability || "";
  const links = Array.isArray(profile?.links) ? profile.links : [];
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const education = Array.isArray(profile?.education) ? profile.education : [];
  const experience = Array.isArray(profile?.experience) ? profile.experience : [];
  const customNotes = Array.isArray(profile?.customNotes) ? profile.customNotes : [];

  const matchedNotes = customNotes.filter((note) => {
    const topicWords = String(note?.topic || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return topicWords.some((word) => promptLower.includes(word));
  });
  if (matchedNotes.length > 0) {
    const formatted = matchedNotes.map((n) => `- **${n.topic}:** ${n.content}`).join("\n");
    return `Here is what ${nickname} shared on this topic:\n\n${formatted}\n\n[UI:CONTACT]`;
  }

  if (
    /\b(contact|email|reach|find|hire|phone|call|location|where|linkedin|github|link|links|available|availability|social)\b/i.test(
      promptLower
    )
  ) {
    const lines = [`You can reach **${name}** directly:`, `- **Email:** \`${email}\``];
    if (phone) lines.push(`- **Phone:** ${phone}`);
    if (location) lines.push(`- **Location:** ${location}`);
    if (availability) lines.push(`- **Availability:** ${availability}`);
    links.forEach((l) => {
      if (l?.label && l?.url) lines.push(`- **${l.label}:** [${l.url}](${l.url})`);
    });
    lines.push("\nYou can also send a message using the **Contact** tab below. [UI:CONTACT]");
    return lines.join("\n");
  }

  if (
    /\b(cv|resume|education|degree|university|uj|qualification|study|experience|work history|background)\b/i.test(
      promptLower
    )
  ) {
    const eduText = education
      .map((e) => `- **${e.degree}** — ${e.institution} (${e.years})${e.details ? `: ${e.details}` : ""}`)
      .join("\n");
    const expText = experience
      .map((x) => `- **${x.title}** at **${x.company}** (${x.year})${x.details ? `: ${x.details}` : ""}`)
      .join("\n");
    return `**${name}** — ${profession}\n\n${overview}\n\n${eduText ? `**Education:**\n${eduText}\n\n` : ""}${
      expText ? `**Experience:**\n${expText}\n\n` : ""
    }You can download his CV below or open the **CV** tab. [UI:CV]`;
  }

  if (
    /\b(project|projects|portfolio|built|build|app|apps)\b/i.test(promptLower) ||
    projects.some((p) => p?.name && promptLower.includes(p.name.toLowerCase()))
  ) {
    const projLines = projects
      .map((p) => {
        const urlPart = p.url ? ` (${p.url})` : "";
        const stackPart = p.stack ? ` — *${p.stack}*` : "";
        return `- **${p.name}**${urlPart}${stackPart}: ${p.description || ""}`;
      })
      .join("\n");
    return `Here are ${nickname}'s software engineering projects:\n\n${projLines}\n\n[UI:PROJECTS]`;
  }

  if (
    /\b(skill|skills|stack|tech|technology|technologies|languages|frameworks|tools|database|databases)\b/i.test(
      promptLower
    )
  ) {
    const skillLines = skills.map((s) => `- ${s}`).join("\n");
    return `${name}'s technical capabilities:\n\n${skillLines}\n\n[UI:SKILLS]`;
  }

  if (/\b(hi|hello|hey|greetings|who|about|introduce|kamo|kamogelo)\b/i.test(promptLower)) {
    return `Hello! I'm **${nickname}'s portfolio assistant**, speaking on behalf of **${name}** (${profession}).\n\n${overview}\n\nAsk me about ${nickname}'s projects, skills, CV, or how to find and contact him! [UI:CV]`;
  }

  return `I'm **${name}'s portfolio assistant**, focused strictly on helping visitors learn about ${nickname}, explore his work, and contact him.\n\nTry asking about his projects, skills, CV, or how to reach him (${email}). [UI:CONTACT]`;
}
