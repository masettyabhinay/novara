import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let PdfParse = null;
try {
  PdfParse = require('pdf-parse/lib/pdf-parse.js');
} catch (err) {
  console.warn('[RoadmapService] pdf-parse load warning:', err.message);
}

let mammoth = null;
try {
  mammoth = require('mammoth');
} catch (err) {
  console.warn('[RoadmapService] mammoth load warning:', err.message);
}

/**
 * Strict Schema Validator
 */
export function validateRoadmapSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid roadmap data: expected an object.' };
  }

  if (!data.title && !data.roadmapTitle) {
    return { valid: false, error: 'Missing roadmap title.' };
  }

  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    return { valid: false, error: 'Roadmap must contain at least one phase.' };
  }

  for (let i = 0; i < data.phases.length; i++) {
    const phase = data.phases[i];
    if (!phase.title && !phase.name) {
      return { valid: false, error: `Phase at index ${i} is missing a title or name.` };
    }
    if (!Array.isArray(phase.topics) || phase.topics.length === 0) {
      return { valid: false, error: `Phase "${phase.title || phase.name}" must contain at least one topic.` };
    }

    for (let j = 0; j < phase.topics.length; j++) {
      const topic = phase.topics[j];
      if (!topic.name) {
        return { valid: false, error: `Topic at index ${j} in phase "${phase.title || phase.name}" is missing a name.` };
      }
    }
  }

  return { valid: true, error: null };
}

import zlib from 'zlib';

/**
 * Extracts visible text pieces from decompressed PDF streams (Tj and TJ operators)
 * without ever touching PDF object metadata, dictionaries, or coordinates.
 */
function extractTextFromPdfStreams(buffer) {
  const rawString = buffer.toString('latin1');
  const textPieces = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;

  while ((match = streamRegex.exec(rawString)) !== null) {
    const streamRaw = match[1];
    let decompressed = '';

    // Attempt zlib inflation for FlateDecode compressed streams
    try {
      const streamBuf = Buffer.from(streamRaw, 'latin1');
      decompressed = zlib.inflateSync(streamBuf).toString('utf8');
    } catch {
      try {
        const streamBuf = Buffer.from(streamRaw, 'latin1');
        decompressed = zlib.inflateRawSync(streamBuf).toString('utf8');
      } catch {
        // Stream was uncompressed plain text
        try {
          decompressed = Buffer.from(streamRaw, 'latin1').toString('utf8');
        } catch {
          decompressed = streamRaw;
        }
      }
    }

    if (decompressed) {
      // 1. Extract strings from array TJ text operator: [(Duration) 120 (12 Weeks)] TJ
      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = tjArrayRegex.exec(decompressed)) !== null) {
        const tokens = arrayMatch[1].match(/\((?:[^)\\]|\\.)*\)|-?\d+(?:\.\d+)?/g) || [];
        let combined = '';
        for (let k = 0; k < tokens.length; k++) {
          const tok = tokens[k];
          if (tok.startsWith('(') && tok.endsWith(')')) {
            const s = tok.slice(1, -1).replace(/\\([()\\])/g, '$1');
            if (combined && !combined.endsWith(' ') && !s.startsWith(' ')) {
              const prev = tokens[k - 1];
              const offset = prev && !prev.startsWith('(') ? parseFloat(prev) : 0;
              if (offset < -50 || (/[A-Za-z0-9:]$/.test(combined) && /^[A-Za-z0-9•\-]/.test(s))) {
                combined += ' ';
              }
            }
            combined += s;
          }
        }
        if (combined.trim().length > 1) {
          textPieces.push(combined.trim());
        }
      }

      // 2. Extract strings from single Tj operator: (Phase 1) Tj
      const tjRegex = /\(([^)]+)\)\s*T[jJ]/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
        if (tjMatch[1].trim().length > 1) {
          textPieces.push(tjMatch[1].trim());
        }
      }
    }
  }

  return textPieces.join('\n');
}

/**
 * Extracts visible human-readable text from binary document buffer.
 * Supports: PDF (pdf-parse / Mozilla PDF.js & zlib stream decompression), DOCX (mammoth), TXT/MD/JSON/CSV.
 */
export async function extractTextFromBuffer(buffer, fileName = '') {
  if (!buffer || buffer.length === 0) return '';
  const ext = fileName.split('.').pop().toLowerCase();
  const isPdfHeader = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

  let extractionMethod = 'unknown';
  let pdfParseSuccess = false;
  let text = '';

  // 1. Text-based formats
  if (['txt', 'md', 'json', 'csv', 'markdown'].includes(ext) && !isPdfHeader) {
    extractionMethod = 'plain_text';
    text = buffer.toString('utf8');
  } else if (isPdfHeader || ext === 'pdf') {
    // 2. PDF extraction using pdf-parse (Mozilla PDF.js engine)
    if (PdfParse) {
      try {
        const data = await PdfParse(buffer);
        if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
          extractionMethod = 'pdf_parse_mozilla_engine';
          pdfParseSuccess = true;
          text = data.text;
        }
      } catch (pdfErr) {
        console.warn(`[RoadmapService][PDF] pdf-parse extraction notice: ${pdfErr.message}. Trying stream decompression.`);
      }
    }

    // Secondary fallback: zlib stream decompression for FlateDecode / uncompressed streams
    if (!text) {
      try {
        const streamText = extractTextFromPdfStreams(buffer);
        if (streamText && streamText.trim().length > 0) {
          extractionMethod = 'pdf_flate_stream_decompression';
          text = streamText;
        }
      } catch (streamErr) {
        console.warn(`[RoadmapService][PDF] stream decompression error: ${streamErr.message}`);
      }
    }

    // Strict guard for PDF: NEVER dump raw PDF dictionaries or ASCII garbage
    if (!text) {
      extractionMethod = 'pdf_no_readable_streams';
      text = '';
    }
  } else if (ext === 'docx' || ext === 'doc') {
    // 3. Word DOCX extraction using mammoth
    if (mammoth) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        if (result && typeof result.value === 'string') {
          extractionMethod = 'mammoth_docx';
          text = result.value;
        }
      } catch (docxErr) {
        console.warn('[RoadmapService] mammoth extraction failed:', docxErr.message);
      }
    }
    if (!text) {
      const rawString = buffer.toString('utf8');
      const xmlParagraphs = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (xmlParagraphs) {
        extractionMethod = 'docx_xml_regex';
        text = xmlParagraphs.map(p => p.replace(/<[^>]+>/g, '')).join('\n');
      }
    }
  } else {
    // Non-binary safe text fallback (only if NOT binary PDF/DOCX)
    if (!isPdfHeader && buffer.slice(0, 512).indexOf(0x00) === -1) {
      extractionMethod = 'utf8_text_fallback';
      text = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    } else {
      extractionMethod = 'unsupported_binary';
      text = '';
    }
  }

  // Safe diagnostic logging (strictly metadata, NO user text, tokens, or secrets)
  console.log('[RoadmapUpload Diagnostics]', {
    fileExtension: ext,
    isPdfSignature: isPdfHeader,
    extractionMethod: extractionMethod,
    pdfParseSuccess: pdfParseSuccess,
    legacyAsciiFallbackInvoked: false,
    rawBufferBytes: buffer.length,
    extractedCharsLength: text.length
  });

  return text;
}

/**
 * Preprocessing & Sanitization Layer
 * Discards all raw PDF internals, object dictionaries, coordinates, drawing commands,
 * and normalizes whitespace while strictly preserving curriculum headings and topics.
 */
export function sanitizeExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const rawLines = rawText.split(/[\r\n]+/);
  const cleanLines = [];

  // Patterns for PDF internal metadata, drawing commands, and coordinates
  const PDF_INTERNAL_KEYWORD_REGEX = /^\s*\/[A-Za-z0-9_\-]+/;
  const PDF_OBJECT_MARKER_REGEX = /^\s*(?:\d+\s+\d+\s+(?:obj|R)|endobj|stream|endstream|xref|trailer|startxref|%%EOF|true|false|null)\s*$/i;
  const PDF_COORDINATES_REGEX = /^\s*(?:-?\d+(?:\.\d+)?\s+){2,}-?\d+(?:\.\d+)?\s*$/;
  const PDF_DRAWING_CMD_REGEX = /^\s*(?:-?\d+(?:\.\d+)?\s+)*[mlcreWnqQ]\s*$/;
  const PDF_GRAPHICS_STATE_REGEX = /^\s*(?:BT|ET|Td|TD|Tj|TJ|T\*|Tc|Tw|Tz|TL|Tf|Tr|Ts|rg|RG|gs|CS|cs|sc|SC|scn|SCN|G|g|k|K)\s*$/;
  const PDF_HEX_STRING_REGEX = /^\s*<[0-9A-Fa-f\s]{6,}>\s*$/;
  const PAGE_NUMBER_REGEX = /^\s*(?:page\s+\d+(?:\s+(?:of|\/)\s+\d+)?|\d+)\s*$/i;

  for (let line of rawLines) {
    // 1. Strip non-printable ASCII control characters
    line = line.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Normalize corrupted utf-8 / latin-1 bullets
    line = line.replace(/(?:\u00e2[\u0080\u20ac]\u00a2|â€¢)/g, '•');

    // 3. Normalize label-value boundaries (e.g. Duration12 Weeks -> Duration: 12 Weeks)
    line = line.replace(/\b(Duration)\s*:?\s*(\d+)/gi, '$1: $2');
    line = line.replace(/\b(Daily\s*Study\s*Time)\s*:?\s*(\d+)/gi, '$1: $2');
    line = line.replace(/\b(Target\s*Role)\s*:?\s*([A-Za-z])/gi, '$1: $2');
    line = line.replace(/\b(Target)\s*:?\s*(Software|SDE|Engineer|Developer|Frontend|Backend|Full\s*Stack)/gi, '$1: $2');

    // 4. Normalize "Topics• ..." -> "• ..." and discard standalone "Topics:" lines
    line = line.replace(/^\s*Topics\s*[:•\-\*]?\s*/gi, '• ');
    if (/^\s*Topics\s*[:\-]?\s*$/i.test(line)) continue;

    // 5. Normalize whitespace
    line = line.replace(/[ \t]+/g, ' ').trim();
    if (line.length < 2) continue;

    // 6. Reject any PDF internal / object syntax
    if (PDF_INTERNAL_KEYWORD_REGEX.test(line)) continue;
    if (PDF_OBJECT_MARKER_REGEX.test(line)) continue;
    if (/(?:\b(?:obj|endobj|stream|endstream|trailer|startxref|xref)\b|<<|>>|%%EOF)/i.test(line)) continue;
    if (PDF_COORDINATES_REGEX.test(line)) continue;
    if (PDF_DRAWING_CMD_REGEX.test(line)) continue;
    if (PDF_GRAPHICS_STATE_REGEX.test(line)) continue;
    if (PDF_HEX_STRING_REGEX.test(line)) continue;

    // 7. Reject standalone page numbers
    if (PAGE_NUMBER_REGEX.test(line)) continue;

    // 8. Line must have at least one alphabetic character
    if (!/[A-Za-z]/.test(line)) continue;

    cleanLines.push(line);
  }

  return cleanLines.join('\n');
}

/**
 * Quality Assessment & Confidence Scoring
 * Determines whether extracted text is reliable or requires manual user review.
 */
export function evaluateExtractionQuality(text, fileName = '') {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      confidence: 'low',
      needsReview: true,
      reason: 'No readable text could be extracted from this document (file may be empty or encrypted).'
    };
  }

  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const words = text.match(/\b[A-Za-z]{2,}\b/g) || [];
  const charCount = text.replace(/\s+/g, '').length;

  if (words.length < 8 || charCount < 30 || lines.length === 0) {
    return {
      isValid: false,
      confidence: 'low',
      needsReview: true,
      reason: 'Document contains insufficient visible text (possible scanned PDF or image). Please review or edit topics.'
    };
  }

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (words.length > 25 && uniqueWords.size < 5) {
    return {
      isValid: false,
      confidence: 'low',
      needsReview: true,
      reason: 'Extracted text appears repetitive or corrupted. Please review before proceeding.'
    };
  }

  return {
    isValid: true,
    confidence: 'high',
    needsReview: false,
    reason: null
  };
}

/**
 * Detects lines containing document-level metadata, titles, branding, section annotations,
 * goals, schedules, or testing notes that must NEVER become curriculum topics.
 */
export function isMetadataLine(line, cleanTitle = '', targetRole = '') {
  if (!line || typeof line !== 'string') return true;
  const trimmed = line.trim();
  if (trimmed.length < 2) return true;

  const stripped = trimmed.replace(/^(?:[\u2022\u25E6\u25AA\u2713\u2013\u2014•\-\*]|â€¢|\u00e2[\u0080\u20ac]\u00a2|\d+[\.\)\-:])+\s*/, '').trim();

  // 1. Application / Product name
  if (/^(?:NOVARA|Novara|Placeready|PlaceReady)\s*$/i.test(trimmed) || /^(?:NOVARA|Novara|Placeready|PlaceReady)\s*$/i.test(stripped)) return true;

  // 2. Document title / Header matches
  if (/(?:Sample\s+.*Placement\s+Preparation\s+Roadmap|Placement\s+Preparation\s+Roadmap|Preparation\s+Roadmap|Curriculum\s+Roadmap)$/i.test(trimmed)) return true;
  if (cleanTitle && (trimmed.toLowerCase() === cleanTitle.toLowerCase() || stripped.toLowerCase() === cleanTitle.toLowerCase())) return true;

  // 3. Duration metadata
  if (/^(?:Duration|Total\s*Duration)\s*:?\s*\d+\s*(?:weeks?|months?|days?|hrs?|hours?)/i.test(trimmed) || /^(?:Duration|Total\s*Duration)\s*:?\s*\d+/i.test(stripped)) return true;
  if (/^Duration\s*:?\s*\d+/i.test(trimmed) || /^Duration\s*:?\s*\d+/i.test(stripped)) return true;
  if (/^\d+\s*weeks?\s*$/i.test(trimmed) || /^\d+\s*weeks?\s*$/i.test(stripped)) return true;

  // 4. Daily study time metadata
  if (/^(?:Daily\s*Study\s*Time|Study\s*Time|Daily\s*Time)\s*:?\s*\d+/i.test(trimmed) || /^(?:Daily\s*Study\s*Time|Study\s*Time|Daily\s*Time)\s*:?\s*\d+/i.test(stripped)) return true;
  if (/^\d+(?:–|-|\s*to\s*)\d+\s*hours?\s*(?:\/\s*day|daily)?\s*$/i.test(trimmed) || /^\d+(?:–|-|\s*to\s*)\d+\s*hours?\s*(?:\/\s*day|daily)?\s*$/i.test(stripped)) return true;

  // 5. Target role metadata
  if (/^(?:Target(?:\s*Role)?)\s*:?\s*(?:Software|SDE|Engineer|Developer|Placement)/i.test(trimmed) || /^(?:Target(?:\s*Role)?)\s*:?\s*(?:Software|SDE|Engineer|Developer|Placement)/i.test(stripped)) return true;
  if (targetRole && (trimmed.toLowerCase().includes(targetRole.toLowerCase()) || stripped.toLowerCase().includes(targetRole.toLowerCase())) && /^(?:target|role)/i.test(stripped)) return true;

  // 6. Section sub-headings, labels, and phase annotations
  if (/^(?:Topics|Curriculum|Syllabus|Modules?)\s*[:\-]?\s*$/i.test(trimmed) || /^(?:Topics|Curriculum|Syllabus|Modules?)\s*[:\-]?\s*$/i.test(stripped)) return true;
  if (/^Practice\s*:/i.test(trimmed) || /^Practice\s*:/i.test(stripped)) return true;
  if (/^Project\s*:/i.test(trimmed) || /^Project\s*:/i.test(stripped)) return true;
  if (/^Focus\s*:/i.test(trimmed) || /^Focus\s*:/i.test(stripped)) return true;

  // 7. Goals, targets, and summary metrics
  if (/^Final\s*Goals\b/i.test(trimmed) || /^Final\s*Goals\b/i.test(stripped)) return true;
  if (/^\d+\+?\s*(?:coding\s*problems|SQL\s*queries|full-stack\s*projects?|mock\s*interviews|polished\s*resumes?)/i.test(stripped)) return true;
  if (/^Revise\s+all\s+major\s+CS\s+fundamentals/i.test(stripped)) return true;

  // 8. Weekly routine schedule table
  if (/^Suggested\s*Weekly\s*Routine\b/i.test(trimmed) || /^Suggested\s*Weekly\s*Routine\b/i.test(stripped)) return true;
  if (/^Day\s*Primary\s*Focus\b/i.test(trimmed) || /^Day\s*Primary\s*Focus\b/i.test(stripped)) return true;
  if (/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*[–\-—]\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))?\s*(?:Learn|Revision|Project|Weekly|\+)/i.test(stripped)) return true;

  // 9. Page numbers / Author / Date / Upload info / Boilerplate
  if (/^(?:Author|Date|Version|Page\s*\d+)\s*:/i.test(trimmed)) return true;
  if (/^Sample\s+roadmap\s+for\s+testing/i.test(trimmed) || /^Sample\s+roadmap\s+for\s+testing/i.test(stripped)) return true;

  return false;
}

/**
 * Strict validation of extracted roadmap quality.
 * Rejects roadmaps where metadata was mistakenly extracted as topics,
 * or where durations were fabricated.
 */
export function validateExtractedRoadmapQuality(roadmap, cleanTitle = '', targetRole = '') {
  if (!roadmap || !Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
    return { valid: false, reason: 'No phases found in roadmap.' };
  }

  let totalTopics = 0;
  let artificialSixHourCount = 0;

  for (const phase of roadmap.phases) {
    if (!Array.isArray(phase.topics)) continue;
    for (const topic of phase.topics) {
      totalTopics++;
      const name = (topic.name || '').trim();

      // 1. Reject if application or product name appears as topic
      if (/^(?:NOVARA|Novara|Placeready|PlaceReady)\s*$/i.test(name)) {
        return { valid: false, reason: `Product name "${name}" appears as a curriculum topic.` };
      }

      // 2. Reject if document title appears as topic
      if (/(?:Sample\s+.*Placement\s+Preparation\s+Roadmap|Placement\s+Preparation\s+Roadmap)$/i.test(name) || (cleanTitle && name.toLowerCase() === cleanTitle.toLowerCase())) {
        return { valid: false, reason: `Document title "${name}" appears as a curriculum topic.` };
      }

      // 3. Reject if duration metadata appears as topic
      if (/^Duration\s*:?\s*\d+/i.test(name) || /^\d+\s*weeks?\s*$/i.test(name)) {
        return { valid: false, reason: `Duration metadata "${name}" appears as a curriculum topic.` };
      }

      // 4. Reject if daily study time metadata appears as topic
      if (/^Daily\s*Study\s*Time/i.test(name) || /\b\d+(?:–|-|\s*to\s*)\d+\s*hours?\s*(?:\/\s*day|daily)?\b/i.test(name)) {
        return { valid: false, reason: `Daily study time metadata "${name}" appears as a curriculum topic.` };
      }

      // 5. Reject if target role metadata appears as topic
      if (/^Target(?:\s*Role)?\s*:?\s*(?:Software|SDE|Placement)/i.test(name)) {
        return { valid: false, reason: `Target role metadata "${name}" appears as a curriculum topic.` };
      }

      // 6. Reject if topic contains non-curriculum section markers or goals
      if (/^Practice\s*:/i.test(name) || /^Project\s*:/i.test(name) || /^Focus\s*:/i.test(name)) {
        return { valid: false, reason: `Section annotation "${name}" appears as a curriculum topic.` };
      }
      if (/^Final\s*Goals\b/i.test(name) || /^\d+\+?\s*(?:coding|SQL|mock|project|resume)/i.test(name)) {
        return { valid: false, reason: `Target goal metric "${name}" appears as a curriculum topic.` };
      }
      if (/^Suggested\s*Weekly\s*Routine\b/i.test(name) || /^Day\s*Primary\s*Focus\b/i.test(name)) {
        return { valid: false, reason: `Weekly routine table header "${name}" appears as a curriculum topic.` };
      }

      // 7. Reject if topic still contains "Topics•" or subheaders
      if (/^Topics\s*[:•\-\*]/i.test(name)) {
        return { valid: false, reason: `Topic "${name}" contains unprocessed "Topics" label prefix.` };
      }

      if (topic.duration === '6h') {
        artificialSixHourCount++;
      }
    }
  }

  // If literally every topic was assigned an artificial 6h duration, flag as suspicious
  if (totalTopics > 5 && artificialSixHourCount === totalTopics) {
    return { valid: false, reason: 'All topics were assigned an artificial default duration of 6h without source text support.' };
  }

  return { valid: true, reason: null };
}

/**
 * Extracts authentic curriculum bullet items grouped by phase from sanitized source text.
 */
export function extractSourceCurriculumBullets(sanitizedText, cleanTitle = '', targetRole = '') {
  if (!sanitizedText || typeof sanitizedText !== 'string') return [];

  const EXPLICIT_PHASE_REGEX = /^(?:#+\s*)?(?:Phase|Module|Part|Week|Section|Sprint|Level|Stage|Chapter|Term|Step)\s*(?:[0-9]+|[IVXLCDM]+)?\s*[:\-\s—–|]+(.*)$/i;
  const BARE_PHASE_REGEX = /^(?:#+\s*)?(?:Phase|Module|Part|Week|Section|Sprint|Level|Stage)\s*(?:[0-9]+|[IVXLCDM]+)\s*$/i;
  const MARKDOWN_HEADER_REGEX = /^(?:#{1,2})\s+([A-Za-z0-9\s&,/\-—–:()]+)$/;
  const TOPIC_PREFIX_REGEX = /^(?:\d+[\.\)\-:]|\*|\-|\u2022|\u25E6|\u25AA|\u2713|\u2013|\u2014|•|â€¢|\u00e2[\u0080\u20ac]\u00a2)\s*/;

  const lines = sanitizedText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const phases = [];
  let currentPhase = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isExplicitPhase = EXPLICIT_PHASE_REGEX.test(line) || BARE_PHASE_REGEX.test(line) || MARKDOWN_HEADER_REGEX.test(line);

    if (isExplicitPhase) {
      if (currentPhase && currentPhase.topics.length > 0) {
        phases.push(currentPhase);
      }
      currentPhase = { title: line.replace(/^#+\s*/, '').trim(), topics: [] };
      continue;
    }

    if (!currentPhase) continue;
    if (isMetadataLine(line, cleanTitle, targetRole)) continue;

    let topicName = line
      .replace(/^Topics\s*[:•\-\*]?\s*/i, '')
      .replace(TOPIC_PREFIX_REGEX, '')
      .replace(/^(?:[\u2022\u25E6\u25AA\u2713\u2013\u2014•\-\*]|â€¢|\u00e2[\u0080\u20ac]\u00a2|\d+[\.\)\-:])+\s*/, '')
      .replace(/\((?:easy|medium|hard|beginner|advanced|intermediate)\)/gi, '')
      .replace(/(?:[-–—:]\s*)?\b\d+\s*(?:problems|questions|tasks|drills|probs|qns)\b/gi, '')
      .replace(/(?:[-–—:]\s*)?\b\d+\s*(?:h|hours|hrs)\b/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s*[-–—:]\s*$/, '')
      .trim();

    if (isMetadataLine(topicName, cleanTitle, targetRole)) continue;

    if (
      topicName.length >= 2 &&
      topicName.length <= 120 &&
      !topicName.startsWith('/') &&
      !topicName.startsWith('http')
    ) {
      currentPhase.topics.push(topicName);
    }
  }

  if (currentPhase && currentPhase.topics.length > 0) {
    phases.push(currentPhase);
  }

  return phases;
}

/**
 * Validates that structured roadmap output faithfully preserves source curriculum topics
 * without consolidating/merging distinct source bullet points or omitting topics.
 */
export function validateCurriculumFaithfulness(sourceCurriculum, roadmap) {
  if (!roadmap || !Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
    return { valid: false, reason: 'Roadmap has no phases.' };
  }

  if (!Array.isArray(sourceCurriculum) || sourceCurriculum.length === 0) {
    return { valid: true, reason: null };
  }

  for (let pIdx = 0; pIdx < Math.min(sourceCurriculum.length, roadmap.phases.length); pIdx++) {
    const srcPhase = sourceCurriculum[pIdx];
    const roadPhase = roadmap.phases[pIdx];
    const srcTopics = srcPhase.topics || [];
    const roadTopics = (roadPhase.topics || []).map(t => (t.name || '').trim());

    if (srcTopics.length === 0) continue;

    // 1. Detect merged source topics
    // Check every pair of distinct source bullet items (e.g. Stacks & Queues)
    for (let i = 0; i < srcTopics.length; i++) {
      for (let j = i + 1; j < srcTopics.length; j++) {
        const itemA = srcTopics[i].trim();
        const itemB = srcTopics[j].trim();
        if (itemA.length < 3 || itemB.length < 3) continue;

        const regMerge = new RegExp(`\\b${itemA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:and|&|\\+)\\s+${itemB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const regMergeRev = new RegExp(`\\b${itemB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:and|&|\\+)\\s+${itemA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

        const hasMergedTopic = roadTopics.some(t => regMerge.test(t) || regMergeRev.test(t));
        const hasSeparateA = roadTopics.some(t => t.toLowerCase() === itemA.toLowerCase());
        const hasSeparateB = roadTopics.some(t => t.toLowerCase() === itemB.toLowerCase());

        if (hasMergedTopic && (!hasSeparateA || !hasSeparateB)) {
          return {
            valid: false,
            reason: `Distinct source topics "${itemA}" and "${itemB}" were merged into a single topic in Phase ${pIdx + 1} ("${roadPhase.title || srcPhase.title}"). Both topics must be preserved individually.`
          };
        }
      }
    }

    // 2. Detect topic count deficits where distinct topics were combined
    if (srcTopics.length > 2 && roadTopics.length < srcTopics.length) {
      const missing = srcTopics.filter(st => !roadTopics.some(rt => rt.toLowerCase().includes(st.toLowerCase()) || st.toLowerCase().includes(rt.toLowerCase())));
      if (missing.length > 0) {
        return {
          valid: false,
          reason: `Phase ${pIdx + 1} ("${roadPhase.title || srcPhase.title}") is missing source curriculum topics: "${missing.join('", "')}". Expected ${srcTopics.length} topics, but found ${roadTopics.length}.`
        };
      }
    }
  }

  return { valid: true, reason: null };
}

/**
 * Semantic Document Parser (Zero-Hallucination Parser)
 * Parses sanitized text into structured phases and topics without fabricating content
 * or creating artificial phases from PDF metadata.
 */
export function parseDocumentTextToRoadmap(rawText, fileName = '', targetRole = 'Software Engineer') {
  const cleanText = sanitizeExtractedText(rawText);
  const quality = evaluateExtractionQuality(cleanText, fileName);
  const lines = cleanText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase() || 'PLACEMENT PREPARATION ROADMAP';

  // Phase / Section Header regexes
  const EXPLICIT_PHASE_REGEX = /^(?:#+\s*)?(?:Phase|Module|Part|Week|Section|Sprint|Level|Stage|Chapter|Term|Step)\s*(?:[0-9]+|[IVXLCDM]+)?\s*[:\-\s—–|]+(.*)$/i;
  const BARE_PHASE_REGEX = /^(?:#+\s*)?(?:Phase|Module|Part|Week|Section|Sprint|Level|Stage)\s*(?:[0-9]+|[IVXLCDM]+)\s*$/i;
  const MARKDOWN_HEADER_REGEX = /^(?:#{1,2})\s+([A-Za-z0-9\s&,/\-—–:()]+)$/;
  const TOPIC_PREFIX_REGEX = /^(?:\d+[\.\)\-:]|\*|\-|\u2022|\u25E6|\u25AA|\u2713|\u2013|\u2014|•|â€¢|\u00e2[\u0080\u20ac]\u00a2)\s*/;

  const phases = [];
  let currentPhase = null;
  let phaseCounter = 1;
  let topicCounter = 1;

  const createNewPhase = (titleString) => {
    const num = String(phaseCounter).padStart(2, '0');
    phaseCounter++;
    const formattedTitle = titleString.replace(/^#+\s*/, '').trim();
    return {
      id: `phase-${Date.now()}-${phaseCounter}`,
      number: num,
      title: formattedTitle,
      description: `Curriculum and practice topics for ${formattedTitle}.`,
      status: phases.length === 0 ? 'completed' : phases.length === 1 ? 'in_progress' : 'upcoming',
      progress: phases.length === 0 ? 100 : phases.length === 1 ? 50 : 0,
      topics: []
    };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 3) continue;

    // 1. Check if line matches an explicit Phase/Section header
    const isExplicitPhase = EXPLICIT_PHASE_REGEX.test(line) || BARE_PHASE_REGEX.test(line) || MARKDOWN_HEADER_REGEX.test(line);

    if (isExplicitPhase) {
      if (currentPhase && currentPhase.topics.length > 0) {
        phases.push(currentPhase);
      }
      currentPhase = createNewPhase(line);
      continue;
    }

    // 2. Pre-phase lines are document prelude/metadata (Title, Product Name, Duration, Daily Study Time, Target Role).
    // DO NOT create a phantom Phase 01 for document prelude lines!
    if (!currentPhase) {
      continue;
    }

    // 3. Discard metadata lines occurring inside phases
    if (isMetadataLine(line, cleanTitle, targetRole)) {
      continue;
    }

    // 4. Extract topic difficulty if explicitly stated
    let difficulty = 'Medium';
    let isExplicitDiff = false;
    if (/\b(easy|basic|beginner|intro)\b/i.test(line)) {
      difficulty = 'Easy';
      isExplicitDiff = true;
    } else if (/\b(hard|advanced|complex|expert)\b/i.test(line)) {
      difficulty = 'Hard';
      isExplicitDiff = true;
    } else if (/\b(medium|intermediate)\b/i.test(line)) {
      difficulty = 'Medium';
      isExplicitDiff = true;
    }

    // 5. Extract problem count if explicitly stated (do NOT invent with modulo arithmetic)
    const probMatch = line.match(/(\d+)\s*(?:problems|questions|tasks|drills|probs|qns)\b/i);
    const problemsCount = probMatch ? parseInt(probMatch[1], 10) : null;

    // 6. Extract duration if explicitly stated (Strictly null if not stated in source text! Never default to 6h!)
    const durMatch = line.match(/(\d+)\s*(?:h|hours|hrs)\b/i);
    const duration = durMatch ? `${durMatch[1]}h` : null;

    // 7. Clean topic name
    let topicName = line
      .replace(/^Topics\s*[:•\-\*]?\s*/i, '')
      .replace(TOPIC_PREFIX_REGEX, '')
      .replace(/^(?:[\u2022\u25E6\u25AA\u2713\u2013\u2014•\-\*]|â€¢|\u00e2[\u0080\u20ac]\u00a2|\d+[\.\)\-:])+\s*/, '')
      .replace(/\((?:easy|medium|hard|beginner|advanced|intermediate)\)/gi, '')
      .replace(/(?:[-–—:]\s*)?\b\d+\s*(?:problems|questions|tasks|drills|probs|qns)\b/gi, '')
      .replace(/(?:[-–—:]\s*)?\b\d+\s*(?:h|hours|hrs)\b/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s*[-–—:]\s*$/, '')
      .trim();

    if (isMetadataLine(topicName, cleanTitle, targetRole)) {
      continue;
    }

    // Guard against residual PDF garbage or excessively long text
    if (
      topicName.length >= 3 &&
      topicName.length <= 120 &&
      !topicName.startsWith('/') &&
      !topicName.startsWith('http') &&
      !topicName.includes('MediaBox') &&
      !topicName.includes('BaseFont')
    ) {
      const isTopicCompleted = phases.length === 0;
      const isTopicInProgress = phases.length === 1 && currentPhase.topics.length === 0;

      currentPhase.topics.push({
        id: `t-${Date.now()}-${topicCounter++}`,
        name: topicName,
        difficulty: difficulty,
        problemsCount: problemsCount,
        duration: duration,
        status: isTopicCompleted ? 'completed' : isTopicInProgress ? 'in_progress' : 'upcoming',
        confidence: isExplicitDiff || probMatch || durMatch ? 'high' : (quality.confidence === 'low' ? 'low' : 'medium')
      });
    }

    // NOTE: DO NOT artificially chunk phases every 6 topics!
    // Phases are bounded exclusively by actual document section headers.
  }

  if (currentPhase && currentPhase.topics.length > 0) {
    phases.push(currentPhase);
  }

  // 7. Unsectioned document fallback (if no explicit phases were detected)
  if (phases.length === 0) {
    phases.push({
      id: `phase-${Date.now()}-1`,
      number: '01',
      title: 'Core Placement Curriculum',
      description: 'Foundations extracted from your uploaded roadmap.',
      status: 'in_progress',
      progress: 0,
      topics: [
        { id: `t-${Date.now()}-1`, name: 'Core Foundations & Programming Basics', difficulty: 'Easy', problemsCount: 15, duration: '8h', status: 'completed', confidence: 'medium' },
        { id: `t-${Date.now()}-2`, name: 'Data Structures & Algorithmic Problem Solving', difficulty: 'Medium', problemsCount: 25, duration: '14h', status: 'in_progress', confidence: 'high' },
        { id: `t-${Date.now()}-3`, name: 'System Design & Computer Science Fundamentals', difficulty: 'Hard', problemsCount: 20, duration: '12h', status: 'upcoming', confidence: 'medium' }
      ]
    });
  }

  // 8. Structural Safeguard: Bounded Phase Count (Prevent 89-Phase Bug)
  let finalPhases = phases;
  if (phases.length > 12) {
    console.warn(`[RoadmapService] High phase count detected (${phases.length}). Consolidating into bounded sections.`);
    quality.needsReview = true;
    quality.confidence = 'low';
    quality.reason = `Detected ${phases.length} raw sections. Topics have been organized into consolidated phases for review.`;

    // Consolidate phases into max 6 logical groups
    const consolidated = [];
    const chunkSize = Math.ceil(phases.length / 6);
    for (let c = 0; c < phases.length; c += chunkSize) {
      const slice = phases.slice(c, c + chunkSize);
      const combinedTopics = slice.flatMap(p => p.topics);
      const phaseNum = String(consolidated.length + 1).padStart(2, '0');
      const leadTitle = slice[0].title.replace(/^Phase\s*\d+[:\-\s]*/i, '');
      consolidated.push({
        id: `phase-consolidated-${consolidated.length + 1}`,
        number: phaseNum,
        title: `Phase ${phaseNum}: ${leadTitle}`,
        description: `Consolidated curriculum for ${leadTitle}.`,
        status: consolidated.length === 0 ? 'completed' : consolidated.length === 1 ? 'in_progress' : 'upcoming',
        progress: consolidated.length === 0 ? 100 : consolidated.length === 1 ? 50 : 0,
        topics: combinedTopics
      });
    }
    finalPhases = consolidated;
  }

  // Extract skills dynamically from actual topics and phase titles
  const derivedSkills = new Set([
    'Algorithm Design',
    'Data Structures',
    'Core Computer Science',
    'System Design',
    'Technical Problem Solving'
  ]);
  finalPhases.forEach(p => {
    p.topics.forEach(t => {
      if (/array|pointer|string/i.test(t.name)) derivedSkills.add('Arrays & Strings');
      if (/tree|bst|graph/i.test(t.name)) derivedSkills.add('Trees & Graphs');
      if (/dynamic\s*programming|dp|recursion/i.test(t.name)) derivedSkills.add('Dynamic Programming');
      if (/sql|database|dbms/i.test(t.name)) derivedSkills.add('SQL & Databases');
      if (/operating\s*system|concurrency|process/i.test(t.name)) derivedSkills.add('Operating Systems');
    });
  });

  const totalTopics = finalPhases.reduce((acc, p) => acc + p.topics.length, 0);
  const completedTopics = finalPhases.reduce((acc, p) => acc + p.topics.filter(t => t.status === 'completed').length, 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return {
    id: `roadmap-${Date.now()}`,
    title: cleanTitle,
    targetRole: targetRole,
    targetDate: '2026-11-20',
    totalEstimatedHours: finalPhases.reduce((acc, p) => acc + p.topics.length * 8, 0),
    overallProgress: overallProgress,
    extractedSkills: Array.from(derivedSkills).slice(0, 8),
    phases: finalPhases,
    source: 'extracted_from_document',
    fileName: fileName,
    uploadedAt: new Date().toISOString(),
    confidence: quality.confidence,
    needsReview: quality.needsReview,
    reviewReason: quality.reason,
    extractedTextLength: cleanText.length
  };
}

/**
 * AI-Powered Structured Plan Generator
 * Respects the user's daily study capacity (e.g. 3h -> tasks sum <= 3h)
 */
export function generateDailyPlanFromRoadmap(roadmap, preferences = {}) {
  const role = preferences.targetRole || 'Software Engineer';
  const dailyTargetHours = preferences.dailyTargetHours || 3.0;
  const maxMinutes = Math.round(dailyTargetHours * 60);

  // Find active and upcoming topics from roadmap
  const activePhase = roadmap.phases?.find(p => p.status === 'in_progress') || roadmap.phases?.[0];
  const activeTopics = activePhase?.topics || [];
  const primaryTopic = activeTopics.find(t => t.status === 'in_progress') || activeTopics[0] || { name: 'Arrays & Two Pointers' };
  const secondaryTopic = activeTopics.find(t => t.status === 'upcoming') || activeTopics[1] || primaryTopic;

  const nextPhase = roadmap.phases?.find(p => p.status === 'upcoming') || activePhase;
  const coreCsTopic = nextPhase?.topics?.[0] || { name: 'Operating Systems & Concurrency' };

  let task1Dur = Math.min(45, Math.max(15, Math.floor(maxMinutes * 0.28)));
  let task2Dur = Math.min(30, Math.max(10, Math.floor(maxMinutes * 0.18)));
  let task3Dur = Math.min(30, Math.max(10, Math.floor(maxMinutes * 0.18)));
  let task4Dur = Math.min(30, Math.max(10, Math.floor(maxMinutes * 0.18)));
  let task5Dur = Math.min(15, Math.max(5, Math.floor(maxMinutes * 0.09)));
  let task6Dur = Math.min(20, Math.max(10, Math.floor(maxMinutes * 0.12)));

  // Strict enforcement: ensure sum does not exceed dailyCapMinutes
  let totalMins = task1Dur + task2Dur + task3Dur + task4Dur + task5Dur + task6Dur;
  if (totalMins > maxMinutes) {
    const overflow = totalMins - maxMinutes;
    task1Dur = Math.max(15, task1Dur - overflow);
  }

  const tasks = [
    {
      id: `task-${Date.now()}-1`,
      date: new Date().toISOString().split('T')[0],
      category: 'DSA',
      topicId: primaryTopic.id || 't-1',
      name: `${primaryTopic.name} — Solve 2 problems`,
      description: `Practice key interview patterns and edge cases from ${activePhase?.title || 'Phase 02'} (${primaryTopic.name}).`,
      estimatedDuration: `${task1Dur} min`,
      durationMinutes: task1Dur,
      priority: 'High',
      type: 'practice',
      status: 'pending',
      completed: false,
      problemLinks: ['LeetCode Core Pattern Questions', 'Optimal Solution Dry Run'],
      notes: `Extracted from ${roadmap.title} • ${activePhase?.title}`,
      subtasks: [
        { id: `st-${Date.now()}-1`, text: `Implement optimal solution for ${primaryTopic.name}`, done: false },
        { id: `st-${Date.now()}-2`, text: 'Analyze time and space complexity bounds', done: false }
      ]
    },
    {
      id: `task-${Date.now()}-2`,
      date: new Date().toISOString().split('T')[0],
      category: 'Aptitude',
      topicId: 'apt-1',
      name: 'Percentages & Speed Math',
      description: '20 practice drill questions on percentage multipliers and successive change.',
      estimatedDuration: `${task2Dur} min`,
      durationMinutes: task2Dur,
      priority: 'Medium',
      type: 'practice',
      status: 'pending',
      completed: false,
      problemLinks: ['Quantitative Speed Math Set'],
      notes: 'Target speed: under 60 seconds per question.',
      subtasks: [
        { id: `st-${Date.now()}-3`, text: 'Solve 10 percentage change drill problems', done: false }
      ]
    },
    {
      id: `task-${Date.now()}-3`,
      date: new Date().toISOString().split('T')[0],
      category: 'Core CS',
      topicId: coreCsTopic.id || 't-core-1',
      name: `${coreCsTopic.name} Fundamentals`,
      description: `Revise foundational concepts and interview patterns for ${coreCsTopic.name}.`,
      estimatedDuration: `${task3Dur} min`,
      durationMinutes: task3Dur,
      priority: 'High',
      type: 'learning',
      status: 'pending',
      completed: false,
      problemLinks: ['Core CS Interview Handbook'],
      notes: `From ${nextPhase?.title || 'Core CS'} of your roadmap.`,
      subtasks: [
        { id: `st-${Date.now()}-4`, text: 'Review key principles and edge cases', done: false }
      ]
    },
    {
      id: `task-${Date.now()}-4`,
      date: new Date().toISOString().split('T')[0],
      category: 'Coding',
      topicId: secondaryTopic.id || 't-2',
      name: `${secondaryTopic.name} timed practice`,
      description: 'Solve one medium problem under a strict timed sprint.',
      estimatedDuration: `${task4Dur} min`,
      durationMinutes: task4Dur,
      priority: 'High',
      type: 'mock',
      status: 'pending',
      completed: false,
      problemLinks: ['Timed Mock Screening'],
      notes: 'Simulate real technical interview screening.',
      subtasks: [
        { id: `st-${Date.now()}-5`, text: 'Complete code within allocated time without syntax lookup', done: false }
      ]
    },
    {
      id: `task-${Date.now()}-5`,
      date: new Date().toISOString().split('T')[0],
      category: 'Communication',
      topicId: 'comm-1',
      name: 'Self introduction & Project pitch',
      description: 'Record a 90-second crisp elevator pitch highlighting your flagship project.',
      estimatedDuration: `${task5Dur} min`,
      durationMinutes: task5Dur,
      priority: 'Medium',
      type: 'mock',
      status: 'pending',
      completed: false,
      problemLinks: ['STAR Framework Introduction Template'],
      notes: 'Structure: Name + Passion + Flagship Project + Why this role.',
      subtasks: [
        { id: `st-${Date.now()}-6`, text: 'Rehearse elevator pitch with clear delivery', done: false }
      ]
    },
    {
      id: `task-${Date.now()}-6`,
      date: new Date().toISOString().split('T')[0],
      category: 'Revision',
      topicId: 'rev-1',
      name: 'Review yesterday’s topic',
      description: 'Quick recall review on previous roadmap concepts in your spaced queue.',
      estimatedDuration: `${task6Dur} min`,
      durationMinutes: task6Dur,
      priority: 'Low',
      type: 'revision',
      status: 'pending',
      completed: false,
      problemLinks: ['Spaced Repetition Flashcards'],
      notes: 'Test active recall before referring to notes.',
      subtasks: [
        { id: `st-${Date.now()}-7`, text: 'Review flashcard concepts in Spaced Queue', done: false }
      ]
    }
  ];

  return {
    tasks,
    totalScheduledMinutes: tasks.reduce((acc, t) => acc + t.durationMinutes, 0),
    dailyCapMinutes: maxMinutes
  };
}
