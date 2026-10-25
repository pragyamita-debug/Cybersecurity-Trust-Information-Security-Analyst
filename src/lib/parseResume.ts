import { findDateRange, findSingleYear, mergedMonths, monthsBetween, type DateRange } from './dates';
import type { Education, Experience, Goal, Links, Project, Resume } from './types';

/* ------------------------------------------------------------------ */
/*  Section detection                                                  */
/* ------------------------------------------------------------------ */

type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'achievements'
  | 'certifications'
  | 'goals'
  | 'interests'
  | 'languages'
  | 'motto'
  | 'contact';

const SECTION_ALIASES: Record<SectionKey, string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'profile summary', 'about', 'about me', 'objective', 'career objective', 'professional profile', 'overview', 'introduction'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history', 'internships', 'internship', 'internship experience', 'relevant experience'],
  education: ['education', 'academic background', 'academics', 'qualifications', 'educational qualifications', 'academic qualifications', 'education & training'],
  skills: ['skills', 'technical skills', 'key skills', 'core skills', 'core competencies', 'competencies', 'tools', 'tools & technologies', 'skills & tools', 'expertise', 'areas of expertise', 'skill set', 'design skills', 'software'],
  projects: ['projects', 'key projects', 'selected projects', 'academic projects', 'personal projects', 'portfolio', 'case studies', 'selected work', 'work samples'],
  achievements: ['achievements', 'awards', 'honors', 'honours', 'accomplishments', 'awards & achievements', 'achievements & awards', 'recognition'],
  certifications: ['certifications', 'certificates', 'licenses', 'licenses & certifications', 'courses', 'training'],
  goals: ['goals', 'career goals', 'aspirations', 'next steps', 'roadmap', 'plans'],
  interests: ['interests', 'hobbies', 'research interests', 'areas of interest', 'hobbies & interests'],
  languages: ['languages', 'language proficiency'],
  motto: ['motto', 'quote', 'personal motto', 'mantra', 'philosophy'],
  contact: ['contact', 'contact details', 'contact information', 'personal details', 'personal information'],
};

const HEADING_LOOKUP = new Map<string, SectionKey>();
for (const [key, aliases] of Object.entries(SECTION_ALIASES) as [SectionKey, string[]][]) {
  for (const alias of aliases) HEADING_LOOKUP.set(alias, key);
}

function normaliseHeading(line: string) {
  return line
    .toLowerCase()
    .replace(/\band\b/g, '&')
    .replace(/[^a-z& ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns the section key if the line is a heading, plus any inline content after "Heading:". */
function matchHeading(line: string): { key: SectionKey; rest: string } | null {
  if (line.length > 60 || BULLET_RE.test(line)) return null;
  const inline = line.match(/^([A-Za-z &/]{3,40})\s*[:：]\s*(.*)$/);
  if (inline) {
    const key = HEADING_LOOKUP.get(normaliseHeading(inline[1]));
    if (key) return { key, rest: inline[2].trim() };
  }
  const key = HEADING_LOOKUP.get(normaliseHeading(line));
  return key ? { key, rest: '' } : null;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const BULLET_RE = /^\s*(?:[•●▪◦‣∙·*►➤✓✔-]|\d{1,2}[.)])\s+/;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE_RE = /(?:\+?\d[\d\s().-]{8,}\d)/;
const URL_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|io|me|dev|org|net|co|design|app|site|xyz|page)(?:\/[^\s|,]*)?/gi;

const ROLE_WORDS = /\b(manager|consultant|intern|engineer|designer|analyst|developer|associate|lead|head|officer|executive|assistant|specialist|coordinator|director|founder|co-founder|researcher|teacher|tutor|scholar|trainee|fellow|architect|strategist|writer|editor|administrator|scientist|professor|lecturer|volunteer|president|member|owner|freelance|freelancer|product|ux|ui)\b/i;
const INSTITUTION_WORDS = /\b(university|college|institute|school|academy|polytechnic|iit|iim|nit|vidyalaya|campus)\b/i;

const COUNTRIES = ['india', 'usa', 'united states', 'uk', 'united kingdom', 'canada', 'australia', 'germany', 'france', 'singapore', 'uae', 'dubai', 'netherlands', 'ireland', 'japan', 'nepal', 'bangladesh', 'sri lanka', 'remote'];
const CITIES = ['kolkata', 'mumbai', 'delhi', 'new delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai', 'pune', 'noida', 'gurugram', 'gurgaon', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'bhubaneswar', 'indore', 'kochi', 'london', 'new york', 'san francisco', 'berlin', 'toronto', 'sydney'];

function isLocation(segment: string) {
  const s = segment.toLowerCase().replace(/^(location|address|based in)\s*[:-]?\s*/, '').trim();
  if (!s || s.length > 50 || /\d{3,}/.test(s) || EMAIL_RE.test(s)) return false;
  return [...COUNTRIES, ...CITIES].some((place) => new RegExp(`\\b${place}\\b`).test(s));
}

function cleanLocation(segment: string) {
  return segment.replace(/^(location|address|based in)\s*[:-]?\s*/i, '').trim();
}

const stripBullet = (line: string) => line.replace(BULLET_RE, '').trim();

function titleCase(s: string) {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function splitList(text: string) {
  return text
    .split(/\s*(?:[,;|•·●▪]|\s{2,}|\s\/\s)\s*/)
    .map((s) => s.replace(/^and\s+/i, '').replace(/[.]$/, '').trim())
    .filter((s) => s.length > 1 && s.length <= 48);
}

function dedupe(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = item.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Removes contact details from a line and returns what's left. */
function withoutContact(line: string) {
  return line
    .replace(EMAIL_RE, ' ')
    .replace(URL_RE, ' ')
    .replace(PHONE_RE, ' ')
    .replace(/\b(email|e-mail|phone|mobile|tel|linkedin|github|portfolio|website)\s*[:-]/gi, ' ')
    .replace(/^[\s|•·,:-]+|[\s|•·,:-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Text → lines → sections                                            */
/* ------------------------------------------------------------------ */

export function toLines(raw: string) {
  return raw
    .replace(/\r/g, '')
    .replace(/ /g, ' ')
    .replace(/[•●]\s*/g, '• ') // PDF/Word bullet glyphs
    .split('\n')
    .map((l) => l.replace(/[ \t]{3,}/g, '   ').replace(/[ \t]+$/g, '').trim())
    .filter(Boolean);
}

function splitSections(lines: string[]) {
  const header: string[] = [];
  const sections: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      current = heading.key;
      sections[current] ??= [];
      if (heading.rest) sections[current]!.push(heading.rest);
      continue;
    }
    if (current) sections[current]!.push(line);
    else header.push(line);
  }
  return { header, sections };
}

/* ------------------------------------------------------------------ */
/*  Entry grouping (shared by experience / education / projects)       */
/* ------------------------------------------------------------------ */

interface Block {
  head: string[];
  body: string[];
  range: DateRange | null;
}

function groupBlocks(lines: string[], today: Date): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;

  const open = () => {
    cur = { head: [], body: [], range: null };
    blocks.push(cur);
    return cur;
  };

  for (const line of lines) {
    const isBullet = BULLET_RE.test(line) || line.length > 120;
    if (isBullet) {
      (cur ?? open()).body.push(stripBullet(line));
      continue;
    }
    const range = findDateRange(line, today);
    const c = cur as Block | null;
    // A plain sentence under a dated entry ("Shipped the savings redesign") is a description, not a new
    // entry — common in Word CVs written without bullet points.
    const isDescription =
      c?.range &&
      !range &&
      !ROLE_WORDS.test(line) &&
      !INSTITUTION_WORDS.test(line) &&
      !/[|—–@·•]|\s-\s|,\s/.test(line) &&
      line.split(/\s+/).length >= 3 &&
      /^[A-Z][a-z]/.test(line);
    if (isDescription) {
      c!.body.push(line);
      continue;
    }
    const startNew =
      !c ||
      c.body.length > 0 ||
      (range && c.range) ||
      (c.range && c.head.length >= 2 && !range);
    const block: Block = startNew ? open() : c!;
    block.head.push(line);
    if (range && !block.range) block.range = range;
  }
  return blocks.filter((b) => b.head.length || b.body.length);
}

function headParts(block: Block) {
  return block.head
    .map((l) => (block.range ? l.replace(block.range.raw, ' ') : l))
    .map((l) => l.replace(/[()]/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .flatMap((l) => l.split(/\s+(?:[|—–@·•]|-|,(?=\s)|\bat\b)\s+|\s{3,}|,\s+(?=[A-Z])/))
    .map((p) => p.replace(/^[\s,|–—-]+|[\s,|–—-]+$/g, '').trim())
    .filter((p) => p.length > 1);
}

/* ------------------------------------------------------------------ */
/*  Section parsers                                                    */
/* ------------------------------------------------------------------ */

function parseExperience(lines: string[], today: Date): { items: Experience[]; months: number } {
  const blocks = groupBlocks(lines, today);
  const items: Experience[] = blocks.map((block) => {
    const parts = headParts(block);
    let location: string | undefined;
    const rest = parts.filter((p) => {
      if (!location && isLocation(p)) {
        location = cleanLocation(p);
        return false;
      }
      return true;
    });

    let role = rest[0] ?? '';
    let company = rest[1] ?? '';
    // Prefer the part that reads like a job title as the role.
    if (company && !ROLE_WORDS.test(role) && ROLE_WORDS.test(company)) [role, company] = [company, role];

    return {
      role: role || 'Role',
      company,
      location,
      period: block.range?.label,
      current: block.range?.current ?? false,
      months: block.range ? monthsBetween(block.range.start, block.range.end) : 0,
      bullets: block.body,
    };
  });

  const ranges = blocks.map((b) => b.range).filter((r): r is DateRange => !!r);
  return { items, months: mergedMonths(ranges) };
}

const DEGREES: { re: RegExp; rank: number; short?: string }[] = [
  { re: /\b(ph\.?\s?d|doctorate|doctor of philosophy)\b/i, rank: 6, short: 'Ph.D.' },
  { re: /\b(m\.?\s?phil)\b/i, rank: 5, short: 'M.Phil.' },
  // healthcare degrees
  { re: /\b(m\.?\s?d\.|mbbs|m\.?b\.?b\.?s\.?|pharm\.?\s?d|dnp|d\.?n\.?p\.|dpt)(?=\s|,|$|\))/i, rank: 6 },
  { re: /\b(m\.?\s?h\.?\s?a\.?|m\.?\s?p\.?\s?h\.?|m\.?\s?s\.?\s?n\.?|m\.?\s?h\.?\s?s\.?|m\.?\s?p\.?\s?t\.?)(?=\s|,|$|\))/i, rank: 4 },
  { re: /\b(b\.?\s?s\.?\s?n\.?|bds|b\.?\s?pharm|bpt)(?=\s|,|$|\))/i, rank: 3 },
  { re: /\b(m\.\s?s\.)(?=\s|,|$)/i, rank: 4, short: 'M.S.' },
  { re: /\b(mpas|m\.?\s?p\.?\s?a\.?\s?s\.?)(?=\s|,|$)/i, rank: 4, short: 'MPAS' },
  { re: /\b(mba|pgdm)\b/i, rank: 4 },
  { re: /\b(m\.\s?a\.?|ma)(?=\s|,|$|\s*\()/i, rank: 4, short: 'M.A.' },
  { re: /\b(m\.?\s?sc\.?|m\.?\s?com\.?|m\.?\s?tech|m\.?\s?des|mca|m\.?\s?e\.)(?=\s|,|$)/i, rank: 4 },
  { re: /\b(master(?:'s|’s|s)?(?: of [a-z ]+)?)/i, rank: 4, short: 'Masters' },
  { re: /\b(b\.\s?a\.?|ba)(?=\s|,|$|\s*\()/i, rank: 3, short: 'B.A.' },
  { re: /\b(b\.?\s?sc\.?|b\.?\s?com\.?|b\.?\s?tech|b\.?\s?des|bba|bca|b\.?\s?e\.)(?=\s|,|$|\s*\()/i, rank: 3 },
  { re: /\b(bachelor(?:'s|’s|s)?(?: of [a-z ]+)?)/i, rank: 3, short: 'Bachelors' },
  { re: /\b(diploma|certificate programme)\b/i, rank: 2, short: 'Diploma' },
  { re: /\b(higher secondary|hsc|class xii|12th|senior secondary)\b/i, rank: 1, short: 'Class XII' },
  { re: /\b(secondary|ssc|class x|10th|matriculation)\b/i, rank: 0, short: 'Class X' },
];

const isDegreeLine = (line: string) => DEGREES.some((d) => d.re.test(line));

/** Degrees often sit one per line with no date range, so a new degree line always starts a new entry. */
function splitDegreeLines(lines: string[]) {
  const out: string[] = [];
  let seenDegree = false;
  for (const line of lines) {
    if (!BULLET_RE.test(line) && isDegreeLine(line)) {
      if (seenDegree) out.push('\u0000'); // marker: force a new block
      seenDegree = true;
    }
    out.push(line);
  }
  return out;
}

function parseEducation(lines: string[], today: Date): Education[] {
  const chunks: string[][] = [[]];
  for (const l of splitDegreeLines(lines)) {
    if (l === '\u0000') chunks.push([]);
    else chunks[chunks.length - 1].push(l);
  }
  return chunks
    .flatMap((chunk) => groupBlocks(chunk, today))
    .map((block) => {
      const text = block.head.join(' | ');
      const degreeMatch = DEGREES.map((d) => ({ d, m: text.match(d.re) })).find((x) => x.m);
      const parts = headParts(block);
      const institution = parts.find((p) => INSTITUTION_WORDS.test(p));
      const degreeLine = parts.find((p) => degreeMatch && degreeMatch.d.re.test(p)) ?? parts.find((p) => p !== institution) ?? '';

      let field: string | undefined;
      const fieldMatch =
        degreeLine.match(/\b(?:in|of)\s+([A-Z][A-Za-z &]+)/) ?? degreeLine.match(/[(]([A-Za-z &]+)[)]/);
      if (fieldMatch) field = fieldMatch[1].trim();
      else if (degreeMatch) {
        const after = degreeLine.slice((degreeMatch.m!.index ?? 0) + degreeMatch.m![0].length).replace(/^[\s.,:–—-]+/, '').trim();
        if (after && after.length < 40 && !INSTITUTION_WORDS.test(after)) field = after;
      }
      if (!field) {
        // "Economics" on its own part next to the degree
        field = parts.find((p) => p !== degreeLine && p !== institution && !/\d/.test(p) && p.length < 30 && !isLocation(p));
      }

      const short = degreeMatch ? (degreeMatch.d.short ?? degreeMatch.m![1].replace(/\s/g, '')) : '';
      return {
        degree: degreeLine || parts[0] || '',
        short: short || (parts[0] ?? '').slice(0, 10),
        field,
        institution,
        year: block.range ? String(block.range.end.y) : findSingleYear(text),
        rank: degreeMatch?.d.rank ?? -1,
      };
    })
    .filter((e) => e.degree);
}

function parseProjects(lines: string[], today: Date): Project[] {
  // "Title: description" one-liners are common; split them into head + body first.
  const expanded = lines.flatMap((line) => {
    const m = stripBullet(line).match(/^([^:]{3,60}):\s+(.{20,})$/);
    return m && !/^(tech|tools|stack|technologies)$/i.test(m[1].trim()) ? [m[1], `• ${m[2]}`] : [line];
  });

  return groupBlocks(expanded, today)
    .map((block) => {
      const parts = headParts(block);
      const tags: string[] = [];
      const body = block.body.filter((b) => {
        const t = b.match(/^(tech|tools|stack|technologies|built with)\s*[:-]\s*(.+)$/i);
        if (t) {
          tags.push(...splitList(t[2]));
          return false;
        }
        return true;
      });
      const title = parts[0] ?? stripBullet(block.body[0] ?? '');
      const meta = [parts.slice(1).join(' · '), block.range?.label].filter(Boolean).join(' · ') || undefined;
      return {
        title,
        meta,
        description: (parts[0] ? body : body.slice(1)).join(' '),
        tags: dedupe(tags).slice(0, 5),
      };
    })
    .filter((p) => p.title);
}

function parseList(lines: string[], { splitCommas = false } = {}) {
  const items = lines.flatMap((l) => {
    const text = stripBullet(l);
    return splitCommas ? splitList(text) : [text];
  });
  return dedupe(items.filter(Boolean));
}

function parseSkills(lines: string[]) {
  const items = lines.flatMap((line) => {
    const text = stripBullet(line).replace(/^[A-Za-z &/]{2,30}:\s*/, ''); // drop "Design tools:" prefixes
    return splitList(text);
  });
  return dedupe(items).slice(0, 40);
}

function parseGoals(lines: string[]): Goal[] {
  return lines.map((line) => {
    const text = stripBullet(line);
    const m = text.match(/^([^:]{2,30}):\s*(.+)$/);
    const [label, rest] = m ? [m[1].trim(), m[2].trim()] : ['Goal', text];
    const note = rest.match(/\(([^)]+)\)\s*$/);
    return {
      label,
      value: note ? rest.slice(0, note.index).trim() : rest,
      note: note?.[1],
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Header (name / headline / contact)                                 */
/* ------------------------------------------------------------------ */

function parseLinks(text: string): Links {
  // drop e-mail addresses first so "name@example.com" doesn't read as a website
  const urls = text.replace(new RegExp(EMAIL_RE.source, 'g'), ' ').match(URL_RE) ?? [];
  const links: Links = {};
  const withProto = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
  for (const u of urls) {
    if (/linkedin\.com/i.test(u)) links.linkedin ??= withProto(u);
    else if (/github\.com/i.test(u)) links.github ??= withProto(u);
    else if (/(twitter|x)\.com/i.test(u)) links.twitter ??= withProto(u);
    else if (!EMAIL_RE.test(u) && !/gmail|outlook|yahoo|hotmail/i.test(u)) links.website ??= withProto(u);
  }
  return links;
}

function parseHeader(header: string[]) {
  let name = '';
  let headline = '';
  let tagline = '';
  let location: string | undefined;
  const extraSummary: string[] = [];

  for (const line of header) {
    const segments = line.split(/\s*[|•·]\s*/);
    // location can sit anywhere in the contact line
    for (const seg of segments) {
      if (!location && isLocation(withoutContact(seg)) && withoutContact(seg).length < 40) location = cleanLocation(withoutContact(seg));
    }

    const clean = withoutContact(line);
    if (!clean) continue;

    if (!name) {
      const candidate = clean.split(/\s*[|,–—]\s*/)[0];
      const words = candidate.split(/\s+/);
      if (words.length >= 1 && words.length <= 5 && /^[A-Za-z.'’ -]+$/.test(candidate) && !isLocation(candidate)) {
        name = titleCase(candidate);
        const remainder = clean.slice(clean.indexOf(candidate) + candidate.length).replace(/^[\s|,–—-]+/, '');
        if (remainder && !isLocation(remainder)) headline = remainder;
        continue;
      }
    }

    if (location && clean === location) continue;
    const withoutLoc = location ? clean.replace(location, '').replace(/^[\s|•·,–—-]+|[\s|•·,–—-]+$/g, '').trim() : clean;
    if (!withoutLoc) continue;

    if (!headline && withoutLoc.length <= 90 && !/[.!?]$/.test(withoutLoc)) {
      headline = withoutLoc;
    } else if (!tagline && withoutLoc.length <= 140) {
      tagline = withoutLoc;
    } else {
      extraSummary.push(withoutLoc);
    }
  }

  return { name, headline, tagline, location, extraSummary };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function parseResume(raw: string, today = new Date()): Resume {
  const lines = toLines(raw);
  const { header, sections } = splitSections(lines);
  const fullText = lines.join('\n');

  const head = parseHeader(header);
  const contactText = [...header, ...(sections.contact ?? [])].join('\n');
  const email = (contactText.match(EMAIL_RE) ?? fullText.match(EMAIL_RE))?.[0];
  const phoneMatch = contactText.match(PHONE_RE)?.[0];
  const phone = phoneMatch && phoneMatch.replace(/\D/g, '').length >= 10 ? phoneMatch.trim() : undefined;
  const links = parseLinks(contactText || fullText);
  if (!head.location && sections.contact) {
    const loc = sections.contact.map(withoutContact).find(isLocation);
    if (loc) head.location = cleanLocation(loc);
  }

  const summary = [...head.extraSummary, ...(sections.summary ?? []).map(stripBullet)].join(' ').trim();
  const firstSentence = summary.match(/^[^.!?]{20,140}[.!?]/)?.[0];

  const experience = parseExperience(sections.experience ?? [], today);
  const education = parseEducation(sections.education ?? [], today).sort((a, b) => b.rank - a.rank);
  const projects = parseProjects(sections.projects ?? [], today);
  const skills = parseSkills(sections.skills ?? []);

  // A CV often states "5+ years" / "12+ projects" in the summary — honour the larger figure.
  const statedYears = Math.max(0, ...[...summary.matchAll(/(\d{1,2})\s*\+?\s*years?/gi)].map((m) => +m[1]));
  const statedProjects = Math.max(0, ...[...fullText.matchAll(/(\d{1,3})\s*\+\s*projects?/gi)].map((m) => +m[1]));
  const computedYears = experience.months / 12;
  const years = Math.max(statedYears, Math.floor(computedYears));

  return {
    name: head.name || 'Your Name',
    headline: head.headline || experience.items[0]?.role || '',
    tagline: head.tagline || firstSentence || '',
    email,
    phone,
    location: head.location,
    links,
    summary,
    experience: experience.items,
    education,
    skills,
    projects,
    achievements: parseList(sections.achievements ?? []),
    certifications: parseList(sections.certifications ?? []),
    goals: parseGoals(sections.goals ?? []),
    interests: parseList(sections.interests ?? [], { splitCommas: true }),
    languages: parseList(sections.languages ?? [], { splitCommas: true }),
    motto: (sections.motto ?? []).map(stripBullet).join(' ').replace(/^["“]|["”]$/g, '').trim() || undefined,
    stats: {
      years,
      yearsPlus: statedYears > 0 || computedYears > Math.floor(computedYears),
      projects: Math.max(statedProjects, projects.length),
      projectsPlus: statedProjects > projects.length,
      skills: skills.length,
    },
  };
}
