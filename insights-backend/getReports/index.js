/**
 * Lambda: generate-report (Node.js 20.x)
 * Trigger : API Gateway POST /generate-report
 * Payload : { "projectId": "P_001", "projectName": "...", "problemStatement": "..." }
 *
 * Flow:
 *  1. Check DynamoDB `Reports` — if reportUrl exists, re-sign + return
 *  2. Scan `AIConv` + `Interviews` for projectId
 *  3. Summarise with Claude via AWS Bedrock
 *  4. Build a styled PDF with pdf-lib
 *  5. Upload to S3, generate 7-day pre-signed URL
 *  6. Save full report metadata back to `Reports`
 *  7. Return { status, reportUrl, report }
 */

import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { randomBytes } from "crypto";

// ── Clients ───────────────────────────────────────────────────────────────────

const REGION      = process.env.AWS_REGION  ?? "ap-south-1";
const S3_BUCKET   = process.env.S3_BUCKET   ?? "agentech-hackathon";
const S3_PREFIX   = process.env.S3_PREFIX   ?? "reports";
const PRESIGN_TTL = 7 * 24 * 3600;          // 7 days in seconds

// Nova model lives in us-east-1
const BEDROCK_MODEL_ID     = process.env.BEDROCK_MODEL_ID     ?? "amazon.nova-lite-v1:0";
const BEDROCK_MODEL_REGION = process.env.BEDROCK_MODEL_REGION ?? "us-east-1";

// S3 bucket is in ap-southeast-1 (Singapore) — must match bucket region
const S3_REGION = process.env.S3_REGION ?? "ap-southeast-1";

const dynamo  = new DynamoDBClient({ region: REGION });
const s3      = new S3Client({ region: S3_REGION });
const bedrock = new BedrockRuntimeClient({ region: BEDROCK_MODEL_REGION });

// ── Colours (0-1 scale for pdf-lib) ──────────────────────────────────────────

const C = {
  dark:     rgb(0.059, 0.090, 0.165),  // #0F172A slate-900
  accent:   rgb(0.388, 0.400, 0.945),  // #6366F1 indigo-500
  green:    rgb(0.086, 0.639, 0.259),  // #16A34A
  light:    rgb(0.945, 0.953, 0.976),  // #F1F5F9 slate-100
  mid:      rgb(0.392, 0.455, 0.545),  // #64748B slate-500
  white:    rgb(1, 1, 1),
  indigo10: rgb(0.933, 0.933, 1.000),  // #EEEEFF
  green10:  rgb(0.940, 0.992, 0.957),  // #F0FDF4
  off:      rgb(0.980, 0.980, 0.980),  // #FAFAFA
};

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

/** Scan a DynamoDB table filtering by projectId */
async function scanByProject(tableName, projectId) {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression: "projectId = :pid",
    ExpressionAttributeValues: marshall({ ":pid": projectId }),
  });
  const { Items = [] } = await dynamo.send(cmd);
  return Items.map(unmarshall);
}

/**
 * Flatten a conversation field into plain text.
 * Handles: plain array of {role,content}, DynamoDB-typed lists, strings.
 */
function flattenConversation(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;

  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((msg) => {
      if (msg && typeof msg === "object" && "role" in msg) {
        return `${String(msg.role).toUpperCase()}: ${msg.content ?? ""}`;
      }
      return JSON.stringify(msg);
    })
    .join("\n");
}

/** Short random hex suffix */
function uid(n = 6) {
  return randomBytes(n).toString("hex").toUpperCase();
}

/** Today as "Month DD, YYYY" */
function prettyDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 1 – Check existing report
// ══════════════════════════════════════════════════════════════════════════════

async function findExistingReport(projectId) {
  const items = await scanByProject("Reports", projectId);
  return items.find((r) => r.reportUrl) ?? null;
}

async function resignUrl(reportUrl) {
  try {
    const key = reportUrl.split(`${S3_BUCKET}.s3.amazonaws.com/`)[1]
                ?? reportUrl.split(`${S3_BUCKET}/`)[1];
    if (!key) return reportUrl;
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: PRESIGN_TTL },
    );
  } catch {
    return reportUrl;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 2 – Fetch conversations
// ══════════════════════════════════════════════════════════════════════════════

async function fetchConversations(projectId) {
  const [aiConvs, interviews] = await Promise.all([
    scanByProject("AIConv",     projectId),
    scanByProject("Interviews", projectId),
  ]);
  return { aiConvs, interviews };
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 3 – Summarise with Claude via Bedrock
// ══════════════════════════════════════════════════════════════════════════════

async function summarise({ projectId, projectName, problemStatement, aiConvs, interviews }) {
  const aiBlock = aiConvs.length
    ? aiConvs.map((c, i) =>
        `--- AI Persona Conversation ${i + 1} ` +
        `(Persona: ${c.personaId ?? c.personId ?? "Unknown"}, Mode: ${c.mode ?? "Unknown"}) ---\n` +
        flattenConversation(c.conversationHistory ?? c.conversation)
      ).join("\n\n")
    : "No AI persona conversations available.";

  const ivBlock = interviews.length
    ? interviews.map((r, i) =>
        `--- User Interview ${i + 1} ` +
        `(Name: ${r.consumerName ?? "Anonymous"}, Age: ${r.age ?? "N/A"}, ` +
        `Gender: ${r.gender ?? "N/A"}, Education: ${r.education ?? "N/A"}) ---\n` +
        flattenConversation(r.conversation ?? r.conversationHistory)
      ).join("\n\n")
    : "No user interviews available.";

  // Build sample & methodology context from available data
  const sampleInfo = [
    aiConvs.length  ? `${aiConvs.length} AI persona conversation(s)`   : null,
    interviews.length ? `${interviews.length} real user interview(s)` : null,
  ].filter(Boolean).join(" and ");

  const prompt = `You are an insights report writer for a consumer research AI copilot.
You receive project metadata and research conversations (AI persona simulations and/or real user interviews).
Your task is to generate a concise, client-ready report.

PROJECT  : ${projectName}
PROBLEM  : ${problemStatement}
DATA AVAILABLE: ${sampleInfo || "No conversation data available"}

== AI PERSONA CONVERSATIONS ==
${aiBlock}

== REAL USER INTERVIEWS ==
${ivBlock}

== OUTPUT INSTRUCTIONS ==
Return ONLY a valid JSON object — no markdown fences, no preamble — with EXACTLY these keys:
{
  "title": "Short descriptive report title (max 12 words)",
  "studyOverview": "1-2 paragraphs describing the study purpose, objectives, and context. Tie back to the problem statement.",
  "sampleAndMethodology": "1-2 paragraphs describing who was studied, how many, what method (AI persona simulation and/or user interviews), and any demographic highlights.",
  "keyQuantitativeSignals": ["top signal 1", "top signal 2", "top signal 3", "top signal 4", "top signal 5"],
  "keyQualitativeInsights": ["recurring theme or finding 1", "theme 2", "theme 3", "theme 4", "theme 5"],
  "personasAndUseContexts": ["persona 1: who they are, what they need, usage occasion, adoption barrier", "persona 2", "persona 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "risksAndWatchouts": ["risk or watchout 1", "risk 2", "risk 3"],
  "recommendedActions": ["specific action 1 (0-3 months)", "action 2", "action 3"]
}

Content rules:
- Keep language plain and non-jargony, suitable for business stakeholders.
- Tie every finding back to the original problem statement where possible.
- In keyQuantitativeSignals: summarise top recurring words, sentiment patterns, and any trends by age/gender/frequency without raw numbers unless present in data.
- In keyQualitativeInsights: summarise recurring themes, likes/dislikes, strengths/weaknesses, sensory or experiential comments. Include 1-2 short verbatim quotes if present in the data.
- In personasAndUseContexts: describe 2-4 concise personas derived from the data.
- Do NOT invent data. If a section has limited data, note that and keep it brief.
- Each array item must be a single fluent sentence or short phrase.`;

  // Bedrock invocation (Amazon Nova format)
  const response = await bedrock.send(new InvokeModelCommand({
    modelId:     BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept:      "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens:   2000,
        temperature: 0.5,
      },
    }),
  }));

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const raw = responseBody?.output?.message?.content?.[0]?.text ?? "";

  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 4 – Build PDF with pdf-lib
// ══════════════════════════════════════════════════════════════════════════════

async function buildPdf(report, projectName, problemStatement) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(report.title ?? "Insight Report");
  pdfDoc.setAuthor("AgentInsight Platform");

  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W    = 595.28;
  const PAGE_H    = 841.89;
  const MARGIN    = 56;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y    = PAGE_H - MARGIN;

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y    = PAGE_H - MARGIN;
  }

  function ensureSpace(needed) {
    if (y - needed < MARGIN) newPage();
  }

  function wrapText(text, font, size, maxWidth) {
    const words = String(text ?? "").split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function drawText(text, { font = regularFont, size = 9.5, color = C.dark,
                            maxWidth = CONTENT_W, x = MARGIN, lineHeight = 1.5,
                            indent = 0 } = {}) {
    const lines = wrapText(text, font, size, maxWidth - indent);
    const lh    = size * lineHeight;
    ensureSpace(lines.length * lh + 4);
    for (const ln of lines) {
      page.drawText(ln, { x: x + indent, y, font, size, color });
      y -= lh;
    }
    return lines.length * lh;
  }

  function space(n = 12) { y -= n; }

  function rule(color = C.accent, thickness = 1.5) {
    ensureSpace(thickness + 4);
    page.drawLine({
      start: { x: MARGIN, y },
      end:   { x: PAGE_W - MARGIN, y },
      thickness,
      color,
    });
    y -= thickness + 6;
  }

  function sectionHead(label) {
    space(10);
    rule(C.accent, 1.5);
    drawText(label.toUpperCase(), { font: boldFont, size: 9, color: C.accent });
    space(4);
  }

  function rect(rx, ry, rw, rh, color) {
    page.drawRectangle({ x: rx, y: ry, width: rw, height: rh, color });
  }

  // ── Cover banner ──────────────────────────────────────────────────────────
  const bannerH    = 80;
  rect(MARGIN, y - bannerH, CONTENT_W, bannerH, C.dark);

  const titleLines  = wrapText(report.title ?? "Insight Report", boldFont, 20, CONTENT_W - 32);
  const titleBlockH = titleLines.length * 28;
  let ty = y - (bannerH - titleBlockH) / 2 - 22;
  for (const ln of titleLines) {
    page.drawText(ln, { x: MARGIN + 16, y: ty, font: boldFont, size: 20, color: C.white });
    ty -= 28;
  }
  y -= bannerH + 10;

  // Meta row
  const metaH = 28;
  rect(MARGIN, y - metaH, CONTENT_W, metaH, C.light);
  page.drawText(`Project: ${projectName}`, {
    x: MARGIN + 12, y: y - 19, font: boldFont, size: 8.5, color: C.dark,
  });
  const dateStr = `Generated: ${prettyDate()}`;
  const dateW   = boldFont.widthOfTextAtSize(dateStr, 8.5);
  page.drawText(dateStr, {
    x: PAGE_W - MARGIN - dateW - 12, y: y - 19, font: boldFont, size: 8.5, color: C.dark,
  });
  y -= metaH + 14;

  // helper: draw a bullet list of items
  function drawBulletList(items, opts = {}) {
    for (const item of (items ?? [])) {
      const lines = wrapText(item, opts.font ?? regularFont, opts.size ?? 9.5, CONTENT_W - 20);
      const rowH  = Math.max(20, lines.length * 15 + 8);
      ensureSpace(rowH + 4);
      rect(MARGIN, y - rowH, CONTENT_W, rowH, opts.bg ?? C.light);
      page.drawText("-", { x: MARGIN + 8, y: y - 12, font: boldFont, size: 9, color: C.accent });
      let ty_ = y - 10;
      for (const ln of lines) {
        page.drawText(ln, { x: MARGIN + 20, y: ty_, font: opts.font ?? regularFont, size: opts.size ?? 9.5, color: opts.color ?? C.dark });
        ty_ -= 15;
      }
      y -= rowH + 4;
    }
  }

  // helper: draw numbered list of items
  function drawNumberedList(items, opts = {}) {
    for (let i = 0; i < (items ?? []).length; i++) {
      const lines = wrapText(items[i], opts.font ?? regularFont, opts.size ?? 9.5, CONTENT_W - 36);
      const rowH  = Math.max(24, lines.length * 15 + 12);
      ensureSpace(rowH + 4);
      const numBg = opts.numBg ?? C.accent;
      const rowBg = opts.rowBg ?? C.indigo10;
      rect(MARGIN, y - rowH, 22, rowH, numBg);
      page.drawText(String(i + 1), { x: MARGIN + 7, y: y - rowH / 2 - 5, font: boldFont, size: 9, color: C.white });
      rect(MARGIN + 22, y - rowH, CONTENT_W - 22, rowH, rowBg);
      let ty_ = y - 10;
      for (const ln of lines) {
        page.drawText(ln, { x: MARGIN + 32, y: ty_, font: opts.font ?? regularFont, size: opts.size ?? 9.5, color: C.dark });
        ty_ -= 15;
      }
      y -= rowH + 4;
    }
  }

  // ── 1. Study Overview ─────────────────────────────────────────────────────
  sectionHead("1. Study Overview");
  drawText(report.studyOverview ?? "Not provided.");
  space(6);

  // ── 2. Sample & Methodology ───────────────────────────────────────────────
  sectionHead("2. Sample & Methodology");
  drawText(report.sampleAndMethodology ?? "Not provided.");
  space(6);

  // ── 3. Key Quantitative Signals ───────────────────────────────────────────
  sectionHead("3. Key Quantitative Signals");
  drawBulletList(report.keyQuantitativeSignals);
  space(6);

  // ── 4. Key Qualitative Insights ───────────────────────────────────────────
  sectionHead("4. Key Qualitative Insights");
  drawBulletList(report.keyQualitativeInsights, { bg: C.indigo10 });
  space(6);

  // ── 5. Personas & Use Contexts ────────────────────────────────────────────
  sectionHead("5. Personas & Use Contexts");
  drawNumberedList(report.personasAndUseContexts, { numBg: C.dark, rowBg: C.light });
  space(6);

  // ── 6. Opportunities, Risks & Recommendations ─────────────────────────────
  sectionHead("6. Opportunities, Risks & Recommendations");

  // Opportunities
  drawText("Opportunities", { font: boldFont, size: 9, color: C.green });
  space(2);
  drawBulletList(report.opportunities, { bg: C.green10 });
  space(6);

  // Risks & Watchouts
  drawText("Risks / Watchouts", { font: boldFont, size: 9, color: C.accent });
  space(2);
  drawBulletList(report.risksAndWatchouts, { bg: C.indigo10 });
  space(6);

  // Recommended Actions
  drawText("Recommended Actions (0-3 months)", { font: boldFont, size: 9, color: C.dark });
  space(2);
  drawNumberedList(report.recommendedActions, { numBg: C.green, rowBg: C.green10, font: boldFont });

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages      = pdfDoc.getPages();
  const footerText = `Generated by AgentInsight Platform  |  ${prettyDate()}  |  Confidential`;
  for (const pg of pages) {
    pg.drawLine({
      start: { x: MARGIN, y: MARGIN - 8 },
      end:   { x: PAGE_W - MARGIN, y: MARGIN - 8 },
      thickness: 0.5, color: C.mid,
    });
    const fw = regularFont.widthOfTextAtSize(footerText, 7);
    pg.drawText(footerText, {
      x: (PAGE_W - fw) / 2, y: MARGIN - 20,
      font: regularFont, size: 7, color: C.mid,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 5 – Upload to S3 + pre-sign
// ══════════════════════════════════════════════════════════════════════════════

async function uploadToS3(pdfBuffer, projectId) {
  const key = `${S3_PREFIX}/${projectId}_insights_${uid()}.pdf`;

  await s3.send(new PutObjectCommand({
    Bucket:             S3_BUCKET,
    Key:                key,
    Body:               pdfBuffer,
    ContentType:        "application/pdf",
    ContentDisposition: `attachment; filename="${projectId}_report.pdf"`,
  }));

  const s3Uri     = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  const presigned = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: PRESIGN_TTL },
  );

  return { s3Uri, presigned };
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 6 – Save to DynamoDB Reports
// ══════════════════════════════════════════════════════════════════════════════

async function saveReport(reportId, projectId, reportUrl, data) {
  await dynamo.send(new PutItemCommand({
    TableName: "Reports",
    Item: marshall({
      reportId,
      projectId,
      reportUrl,
      title:                    data.title                    ?? "",
      generatedAt:              new Date().toISOString(),
      studyOverview:            data.studyOverview            ?? "",
      sampleAndMethodology:     data.sampleAndMethodology     ?? "",
      keyQuantitativeSignals:   data.keyQuantitativeSignals   ?? [],
      keyQualitativeInsights:   data.keyQualitativeInsights   ?? [],
      personasAndUseContexts:   data.personasAndUseContexts   ?? [],
      opportunities:            data.opportunities            ?? [],
      risksAndWatchouts:        data.risksAndWatchouts        ?? [],
      recommendedActions:       data.recommendedActions       ?? [],
    }, { removeUndefinedValues: true }),
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// Lambda handler
// ══════════════════════════════════════════════════════════════════════════════

export async function handler(event) {
  let body = event;
  if (typeof event.body === "string") body = JSON.parse(event.body);
  else if (event.body && typeof event.body === "object") body = event.body;

  const { projectId, projectName, problemStatement } = body ?? {};

  if (!projectId?.trim()) {
    return resp(400, { error: "projectId is required" });
  }

  try {
    // ── 1. Existing report? ─────────────────────────────────────────────────
    const existing = await findExistingReport(projectId);
    if (existing?.reportUrl) {
      const freshUrl = await resignUrl(existing.reportUrl);
      return resp(200, { status: "existing", reportUrl: freshUrl, report: existing });
    }

    // ── 2. Fetch conversations ──────────────────────────────────────────────
    const { aiConvs, interviews } = await fetchConversations(projectId);

    // If both are empty, return early with a clear message
    if (!aiConvs.length && !interviews.length) {
      return resp(404, { error: `No conversation data found for projectId '${projectId}'. Please run AI persona simulations or collect user interviews first.` });
    }

    // Log which sources have data so it is visible in CloudWatch
    console.log(`AIConv: ${aiConvs.length} records, Interviews: ${interviews.length} records — proceeding with available data`);

    // ── 3. Summarise via Bedrock ────────────────────────────────────────────
    const reportData = await summarise({
      projectId,
      projectName:      projectName ?? projectId,
      problemStatement: problemStatement ?? "",
      aiConvs,
      interviews,
    });

    // ── 4. Build PDF ────────────────────────────────────────────────────────
    const pdfBuffer = await buildPdf(
      reportData,
      projectName ?? projectId,
      problemStatement ?? "",
    );

    // ── 5. Upload to S3 ─────────────────────────────────────────────────────
    const { s3Uri, presigned } = await uploadToS3(pdfBuffer, projectId);

    // ── 6. Save to DynamoDB ─────────────────────────────────────────────────
    const reportId = `REP_${projectId}_${uid()}`;
    await saveReport(reportId, projectId, s3Uri, reportData);

    // ── 7. Return ───────────────────────────────────────────────────────────
    return resp(200, {
      status:    "generated",
      reportUrl: presigned,
      report: {
        reportId,
        projectId,
        title:                  reportData.title,
        generatedDate:          prettyDate(),
        studyOverview:          reportData.studyOverview,
        sampleAndMethodology:   reportData.sampleAndMethodology,
        keyQuantitativeSignals: reportData.keyQuantitativeSignals,
        keyQualitativeInsights: reportData.keyQualitativeInsights,
        personasAndUseContexts: reportData.personasAndUseContexts,
        opportunities:          reportData.opportunities,
        risksAndWatchouts:      reportData.risksAndWatchouts,
        recommendedActions:     reportData.recommendedActions,
      },
    });

  } catch (err) {
    console.error("generate-report error:", err);
    return resp(500, { error: err.message, stack: err.stack });
  }
}

function resp(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
