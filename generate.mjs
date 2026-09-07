// توليد مقالة موسوعة جديدة تلقائيًّا عبر Anthropic API + بحث الويب.
// يُشغَّل يوميًّا من GitHub Actions. يحتاج ANTHROPIC_API_KEY في البيئة.
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const base = process.cwd();
const client = new Anthropic(); // يقرأ ANTHROPIC_API_KEY من البيئة

// ---- حمّل الموجود ----
const files = fs.readdirSync(`${base}/entries`).filter(f => f.endsWith(".json")).sort();
const entries = files.map(f => JSON.parse(fs.readFileSync(`${base}/entries/${f}`, "utf8")));
const usedTitles = entries.map(e => e.title);
const cats = [...new Set(entries.map(e => e.category))];
// اختر التصنيف الأقلّ تغطيةً (توازن)
const count = {}; cats.forEach(c => count[c] = 0); entries.forEach(e => count[e.category]++);
const cat = cats.slice().sort((a, b) => count[a] - count[b])[0];
const sci = ["علوم", "نظريات علمية مبسّطة", "طبيعة", "جسم الإنسان", "اكتشافات", "معلومات غريبة"].includes(cat);

const SYSTEM = `أنت محرّر «الموسوعة اليوميّة» العربيّة. تكتب مقالةً واحدة موثوقة في تصنيفٍ محدّد.
قواعد صارمة:
- **ابحث في الويب** من مصادر رصينة محترمة (NASA، NIH، Britannica، Stanford Encyclopedia of Philosophy، MacTutor، World Bank، مؤسّسات علميّة/أكاديميّة). **ممنوع ويكيبيديا (wikipedia.org) نهائيًّا** كمصدر.
- لا تختلق مصدرًا أو رابطًا؛ ضع فقط روابط زرتها فعلًا عبر البحث.
- عربيّة فصيحة أصيلة بأسلوبك (لا نسخ حرفيّ محميّ). المصطلح التقنيّ يليه الإنجليزيّ بين قوسين.
${sci ? "- المقالة علميّة: **بسّط**، الأولويّة فهم الفكرة/الطريقة، مصطلحات قليلة (٣-٥)، لغة يوميّة وأمثلة ملموسة. المتن ٥٠٠–٦٥٠ كلمة." : "- المتن ٦٠٠–٧٥٠ كلمة، بعمقٍ مناسب."}
- أضف قسم «أهمّ النقاط» (summary): ٤-٦ نقاط موجزة.
أخرج **في نهاية ردّك** كائن JSON فقط داخل سياج \`\`\`json ... \`\`\` بهذه الحقول بالضبط:
{"slug":"english-kebab-slug","category":"${cat}","title":"...","reading_min":5,"main_idea":"سطران","body":["فقرة","..."],"summary":["نقطة","...(٤-٦)"],"reflection":["نقطة تأمّل","...(٣-٤)"],"terms":[{"ar":"مصطلح","en":"Term"}],"sources":[{"title":"...","url":"..."}]}`;

const USER = `اكتب مقالة جديدة في تصنيف «${cat}» عن موضوعٍ مهمّ وممتع **لم يُطرَح من قبل**.
العناوين المستعملة سابقًا (تجنّبها): ${usedTitles.join(" | ")}
ابحث في الويب أولًا لجمع المعلومات والمصادر، ثم اكتب.`;

async function ask() {
  let messages = [{ role: "user", content: USER }];
  for (let i = 0; i < 6; i++) {
    const r = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages,
    });
    if (r.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: r.content }); continue; }
    return r.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  }
  throw new Error("توقّف كثيرًا (pause_turn)");
}

function extractJson(text) {
  const m = text.match(/```json\s*([\s\S]*?)```/);
  const s = m ? m[1] : (text.match(/\{[\s\S]*\}/) || [])[0];
  return JSON.parse(s);
}

function words(e) { return (e.body || []).join(" ").split(/\s+/).filter(Boolean).length; }

function valid(e) {
  if (!e || e.category !== cat) return "تصنيف غير مطابق";
  if (!e.title || usedTitles.includes(e.title)) return "عنوان مكرّر أو مفقود";
  const raw = JSON.stringify(e);
  if (/wikipedia\.org|ويكيبيديا/i.test(raw)) return "مصدر ويكيبيديا ممنوع";
  if ((e.sources || []).length < 2) return "أقلّ من مصدرين";
  if ((e.summary || []).length < 4) return "أهمّ النقاط < ٤";
  const w = words(e);
  if (w < 380 || w > 900) return "طول المتن خارج المدى (" + w + ")";
  return null;
}

(async () => {
  let entry = null, err = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await ask();
      const e = extractJson(text);
      err = valid(e);
      if (!err) { entry = e; break; }
      console.error("محاولة", attempt + 1, "فشلت:", err);
    } catch (ex) { err = ex.message; console.error("محاولة", attempt + 1, "خطأ:", ex.message); }
  }
  if (!entry) { console.error("تعذّر التوليد:", err); process.exit(1); }

  const nums = files.map(f => parseInt(f, 10)).filter(n => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const slug = (entry.slug || "auto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "auto";
  delete entry.slug;
  const name = `${String(n).padStart(2, "0")}-${slug}.json`;
  fs.writeFileSync(`${base}/entries/${name}`, JSON.stringify(entry, null, 2));
  console.log("✅ أُنشئت:", name, "|", entry.category, "|", entry.title, "|", words(entry), "كلمة");
})();
