#!/usr/bin/env python3
"""
Generate the neuera.care Instagram 45-day launch track.

Outputs:
  - posts/NNN-YYYY-MM-DD-format-slug.md  (60 files)
  - README.md   (index + 60-row table)
  - style-guide.md
  - seed.sql    (track + 60 drafts, status='draft', account_id=NULL)

Apply seed:
  bun x wrangler d1 execute smm --remote -c api/wrangler.local.toml \
    --file track/neuera_insta/launch/seed.sql
"""
from __future__ import annotations
import json
import os
import random
import secrets
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).parent
POSTS_DIR = ROOT / "posts"
POSTS_DIR.mkdir(exist_ok=True)

# ---- DB constants (live IDs) -------------------------------------------------
PROJECT_ID = "978f15b0-368e-7316-8faa-72c4ef6a9f6b"   # neuera-care
CREATED_BY = "019e02b3-ec81-7bd2-abfd-19c2f5bc6973"   # sangeet user
TRACK_NAME = "Instagram 45-day launch"
TRACK_DESC = "60-post Instagram campaign across all 9 programs + brand + app, May 20 – Jul 3, 2026."
TRACK_TZ = "Asia/Kolkata"
CAMPAIGN_START_UTC = "2026-05-20T05:00:00.000Z"   # 10:30 IST

# ---- UUIDv7 helper -----------------------------------------------------------
def uuidv7() -> str:
    ms = int(time.time() * 1000)
    rnd = secrets.token_bytes(10)
    b = bytearray(16)
    b[0] = (ms >> 40) & 0xff
    b[1] = (ms >> 32) & 0xff
    b[2] = (ms >> 24) & 0xff
    b[3] = (ms >> 16) & 0xff
    b[4] = (ms >> 8) & 0xff
    b[5] = ms & 0xff
    b[6:] = rnd
    b[6] = (b[6] & 0x0f) | 0x70
    b[8] = (b[8] & 0x3f) | 0x80
    h = b.hex()
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"

# ---- Date math ---------------------------------------------------------------
DAY_ONE = datetime(2026, 5, 20, 10, 30, tzinfo=timezone(timedelta(hours=5, minutes=30)))  # IST

def post_datetime_ist(day_n: int, is_extra: bool, post_num: int) -> datetime:
    """Day 1 = 2026-05-20. Daily = 10:30 IST. Extras randomised 20:00–21:30 IST (deterministic per post_num)."""
    base = DAY_ONE + timedelta(days=day_n - 1)
    if not is_extra:
        return base
    rng = random.Random(post_num * 17 + 3)
    minutes_offset = rng.randint(0, 90)  # 0..90 → 20:00..21:30
    return base.replace(hour=20, minute=0) + timedelta(minutes=minutes_offset)

def to_utc_iso(dt_ist: datetime) -> str:
    dt_utc = dt_ist.astimezone(timezone.utc)
    return dt_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def offset_minutes_from_start(dt_ist: datetime) -> int:
    delta = dt_ist - DAY_ONE
    return int(delta.total_seconds() // 60)

# ---- Hashtag bank ------------------------------------------------------------
TAGS_BRAND = ["neueracare", "neueraapp", "neueraprograms", "neuera", "womenshealthindia"]

TAGS_COMMUNITY = [
    "womenshealth", "womenshealthawareness", "periodpositive", "cycleawareness",
    "judgementfreecare", "neverwalkalone", "obgyn", "hormonehealth",
    "womensupportingwomen", "indianwomen", "selfcare", "wellnessindia",
]

TAGS_BY_PROGRAM = {
    "pcos-management": ["pcos", "pcosindia", "pcosawareness", "pcoswarrior", "pcoscommunity", "pcoslife", "pcosdiet", "insulinresistance", "androgens", "hormonalacne", "irregularperiods", "ovarianhealth", "hormonebalance", "polycysticovarysyndrome", "pcoscare"],
    "ttc-pcos": ["ttcindia", "ttcjourney", "ttcwithpcos", "fertilityindia", "ovulationinduction", "babydust", "tryingtoconceive", "pcosfertility", "ovulationtracking", "fertileWindow", "preconception", "fertilityjourney", "ttcsupport", "trytoconceive", "ivf"],
    "preconception-ttc": ["preconception", "tryingforababy", "fertilityjourney", "ttcindia", "babydust", "ovulationtracking", "fertileWindow", "preconceptionhealth", "preconceptioncare", "trytoconceive", "ttcsisters", "fertilityawareness", "pregnancyprep", "preconceptionplanning", "futureparents"],
    "early-pregnancy": ["earlypregnancy", "firsttrimester", "pregnancyindia", "pregnancycare", "pregnancyjourney", "newmomtobe", "pregnant", "indianpregnancy", "morningSickness", "pregnancytips", "earlypregnancycare", "obgyncare", "pregnancysupport", "expectingmom", "babybump"],
    "perimenopause": ["perimenopause", "perimenopauseindia", "perimenopausalsupport", "hormonebalance", "midlifehealth", "hotflashes", "hrt", "hormonereplacement", "midlifehormones", "menopauseawareness", "perimenopausalwomen", "estrogen", "progesterone", "midlifewellness", "hormonalshift"],
    "menopause-care": ["menopause", "menopauseindia", "menopausesupport", "menopausematters", "hrt", "hormonereplacement", "vaginalestrogen", "bonehealth", "dexascan", "menopausewellness", "postmenopause", "midlifehealth", "menopausalsymptoms", "hotflashes", "vaginalhealth"],
    "irregular-periods": ["irregularperiods", "missedperiods", "periodproblems", "hormonalimbalance", "amenorrhea", "oligomenorrhea", "menstrualhealth", "cycleawareness", "periodtalk", "periodawareness", "menstrualcyclehealth", "hormonalhealth", "periodcare", "periodtracking", "cyclehealth"],
    "period-pain": ["periodpainisnotnormal", "endometriosis", "endowarrior", "adenomyosis", "fibroids", "pelvicpain", "periodpain", "endoindia", "endometriosisawareness", "menstrualpain", "dysmenorrhea", "chronicpelvicpain", "endometriosissupport", "painfulperiods", "endoawareness"],
    "womens-health-check": ["preventivehealth", "healthcheckup", "womenshealthcheck", "annualcheckup", "hormonalpanel", "metabolichealth", "bonedensity", "cardiovascularhealth", "healthscreening", "preventivecare", "hormonetesting", "healthyhabits", "knowyournumbers", "healthawareness", "longevity"],
    "brand": ["womenshealthindia", "indianwomenshealth", "femalehealth", "telehealthindia", "onlineconsultation", "doctorconsultation", "evidencebasedmedicine", "patientcare", "compassionatecare", "specialistled", "obgynindia", "womenshealthclinic", "digitalhealth", "personalisedcare", "telegynecology"],
    "app": ["periodtracker", "moodtracking", "journalingapp", "voicejournal", "wellnessapp", "selfcareapp", "mentalwellness", "periodtrackingapp", "cycletracker", "femtech", "healthapp", "mindfulnessapp", "dailyjournal", "femtechindia", "appsforwomen"],
}

def hashtags_for(program: str, count: int = 30) -> str:
    """Build ~30 hashtags: 5 brand + 15 program-specific + ~10 community."""
    prog = TAGS_BY_PROGRAM.get(program, TAGS_BY_PROGRAM["brand"])
    tags = []
    tags += TAGS_BRAND[:5]
    tags += prog[:15]
    tags += TAGS_COMMUNITY[:10]
    seen = set()
    out = []
    for t in tags:
        tl = t.lower()
        if tl in seen: continue
        seen.add(tl)
        out.append(f"#{t}")
        if len(out) >= count: break
    return " ".join(out)

DISCLAIMER = "_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._"

# ---- Calendar (60 posts) -----------------------------------------------------
# Each entry: (day, is_extra, format, pillar, program, slug, hook, body, cta, visual_brief, sources)
# format: reel | carousel | image
# pillar: education | program-spotlight | app | testimonial | founder | promo

POSTS = []

def P(day, extra, fmt, pillar, program, slug, hook, body, cta, brief, sources):
    POSTS.append({
        "day": day, "extra": extra, "format": fmt, "pillar": pillar,
        "program": program, "slug": slug, "hook": hook, "body": body,
        "cta": cta, "brief": brief, "sources": sources,
    })

S_BRAND   = ["https://www.neuera.care/"]
S_APP_AND = ["https://play.google.com/store/apps/details?id=app.neuera.care", "https://apps.apple.com/in/app/neuera/id6761704807"]
S_PROG    = lambda slug: [f"https://www.neuera.care/programs/{slug}/"]

# ===== WEEK 1 — May 20 to May 26 — Brand intro + app + irregular periods =====
P(1, False, "reel", "founder", "brand", "your-body-is-talking",
  "Your body has been talking. We finally built somewhere it gets heard.",
  "Hi — we're neuera.\n\nWe're a women's health practice built around one stubborn idea: care should be specialist-led from day one, not after years of being dismissed.\n\nIf you've been told your symptoms are 'normal', 'just stress', or 'just part of being a woman' — this feed is for you.\n\nOver the next 45 days we're walking through everything we treat: PCOS, periods that hurt, fertility, perimenopause, menopause, the whole arc. Honest, evidence-based, judgement-free.\n\nFollow along. Bring a friend.",
  "Follow @neuera.care and turn on notifications — you'll thank us in week 3.",
  """Voiceover (30s): 'Your body has been talking. Cramps that double you over. Periods that vanish for months. Hot flushes at 41. Acne at 38. Most of us were taught to push through. We were taught to wait it out. We were told it's normal. We disagree. We're neuera. Specialist-led women's health, online. Follow along.'
B-roll: warm slow-mo of a woman writing in a journal, a doctor on a video call, a steaming chai cup, a phone showing the Neuera app, sunlight through a window.
On-screen text: 'Your body has been talking.' → 'You deserve to be heard.' → 'neuera.care'
Cover frame: portrait shot, bold serif text 'Your body has been talking.'""",
  S_BRAND)

P(2, False, "carousel", "education", "irregular-periods", "fifth-vital-sign",
  "Your period is your fifth vital sign. Here's why your doctor should treat it like one.",
  "Temperature. Pulse. Breathing. Blood pressure. Period.\n\nThe American College of Obstetricians and Gynecologists has called the menstrual cycle a vital sign since 2015. A cycle that's regular, predictable, and not debilitating is a signal that your endocrine, metabolic, and reproductive systems are talking to each other properly.\n\nA cycle that's missing, late, painful, or heavy is a signal that *something is off* — not a personality trait you have to live with.\n\nThe four most common red flags we evaluate: cycles shorter than 21 or longer than 35 days, periods missing for 3+ months, bleeding heavy enough to change protection hourly, pain that stops you from working.\n\nNone of these are 'just how your body is'. All of them deserve a doctor.",
  "Save this. Share it with the friend who's been told her cycle 'is just like that'.",
  """7-slide carousel:
1. COVER — bold serif: 'Your period is your fifth vital sign.' subtitle: 'Here's why that matters.'
2. ACOG citation card — 'Since 2015, ACOG has recognised the menstrual cycle as a vital sign.'
3. The 4 vital signs visual — temp, pulse, breath, BP — then add: 'and your cycle'
4. Red flag #1 — cycles <21 or >35 days
5. Red flag #2 — missing 3+ months
6. Red flag #3 — heavy bleeding / #4 — pain stopping work
7. CTA — 'Get a clear answer. neuera.care • link in bio'""",
  [*S_BRAND, *S_PROG("irregular-periods")])

P(3, False, "reel", "education", "irregular-periods", "myths-we-still-believe",
  "Five things about periods you were taught — that are wrong.",
  "1. 'A 28-day cycle is normal, anything else isn't.' False. Normal is 21–35 days, and it varies through life.\n\n2. 'Pain is just part of having a period.' False. Pain that needs you to skip work, school, or life is not normal.\n\n3. 'Skipping periods on birth control is dangerous.' False. The 'period' on the pill is a hormone withdrawal bleed, not a real period.\n\n4. 'PCOS means you can't get pregnant.' False. Most people with PCOS *can* get pregnant — with the right care.\n\n5. 'Irregular periods sort themselves out.' Sometimes. Often they don't. And the underlying cause is worth knowing.\n\nWhat's a 'normal' you were taught that turned out to be wrong?",
  "Comment one below — we'll feature them this week.",
  """Voiceover-led reel (45s): one myth per scene, b-roll of the visual world that myth lives in (a calendar, a heating pad, a contraceptive pack, a TTC test stick, a worried friend's face). On-screen text: 'MYTH:' in red, then the truth in calm cream. Final frame: 'You were taught wrong. We're here to retrain.' Cover: 'Five period myths you need to unlearn.'""",
  [*S_BRAND, *S_PROG("irregular-periods")])

P(3, True, "image", "testimonial", "brand", "warm-quote-card",
  "'I felt heard for the first time in 7 years.'",
  "Most of our patients have been to 3–5 doctors before finding us.\n\nNot because the doctors before us were wrong — but because 15-minute appointments don't work for hormones. Your story takes longer than that. Your labs take longer to interpret than that. Your treatment takes longer to titrate than that.\n\nWe built neuera the way we wished healthcare looked: long first consults, ongoing WhatsApp support with a real Care Navigator, and a clinician you actually keep seeing.\n\nNo more starting over.",
  "Book a first consult — you only pay after choosing a slot. Link in bio.",
  """Single image: warm, deeply saturated, gentle gradient background (soft peach to terracotta). Pull-quote in elegant serif: 'I felt heard for the first time in 7 years.' Attribution: '— A patient, age 32, PCOS'. Small neuera logo bottom-right. No stock photo of a face — quote-only.""",
  S_BRAND)

P(4, False, "carousel", "program-spotlight", "brand", "what-we-treat",
  "Nine things we treat. One way to start.",
  "From the first missed period to the last hot flush — we built nine clinical pathways to meet you wherever you are.\n\n→ PCOS Management (12–16 weeks)\n→ Trying to Conceive with PCOS (3–6 months)\n→ Preconception & TTC (3–6 months)\n→ Early Pregnancy Care (first trimester)\n→ Irregular Periods & Hormone Evaluation (8–12 weeks)\n→ Period Pain & Pelvic Pain Evaluation (8–12 weeks)\n→ Perimenopause Program (12 weeks)\n→ Menopause Care (16 weeks)\n→ Women's Health Check & Risk Assessment (4–6 weeks)\n\nEach pathway includes a specialist OBGYN consult, the labs that actually matter for *your* situation, a personalised treatment plan, and ongoing WhatsApp support.\n\nWhich one is calling your name?",
  "Tap the link in bio. Pay only after picking a slot.",
  """10-slide carousel:
1. COVER — 'Nine pathways. One trusted team.' big bold serif.
2. PCOS Management — duration, key symptoms it addresses.
3. TTC with PCOS — same shape.
4. Preconception & TTC.
5. Early Pregnancy Care.
6. Irregular Periods Evaluation.
7. Period Pain Evaluation.
8. Perimenopause Program.
9. Menopause Care + Women's Health Check (combined).
10. CTA — 'Find your pathway — neuera.care'
Each slide same template: program name (serif), duration chip, 3 bullet symptoms it treats, an arrow to next. Color palette: warm terracotta, cream, deep forest.""",
  [*S_BRAND, "https://www.neuera.care/programs/"])

P(5, False, "image", "app", "app", "meet-the-app",
  "A 30-second daily check-in that turns 'I think something's off' into data your doctor can use.",
  "Meet the Neuera app — your daily companion between consults.\n\nDaily mood + symptom check-ins. Period and cycle logging. Voice notes for the days writing feels like too much. Weekly insight summaries that turn 12 weeks of scattered feelings into a single clear picture for your clinician.\n\nIt's the wellness side of neuera (not a medical device — we keep the clinical work where it belongs, in consult). But it's the difference between walking into an appointment with 'I've been feeling off' versus 'here's exactly when, how often, and how bad'.\n\nFree to download. Yours to own. Sign in with Apple or Google.",
  "Download on Play Store or App Store — link in bio.",
  """Single image: phone mockup centered, showing the daily check-in screen with mood emoji selector + symptom chips. Background: soft cream with subtle texture. Text above phone (serif): 'Meet Neuera.' Text below phone (sans): 'Daily check-ins. Mood. Cycle. Voice notes. Yours, privately.' App store and Play Store badges bottom corners. Small disclaimer footer: 'Wellness app — not a medical device.'""",
  S_APP_AND)

P(6, False, "reel", "education", "irregular-periods", "red-flags-cycle",
  "If your cycle is doing any of these four things, it's time for a doctor — not a Google search.",
  "Four red flags we want every woman to know:\n\n1. Periods consistently shorter than 21 days or longer than 35.\n2. Missing periods for 3+ months when you're not pregnant or breastfeeding.\n3. Bleeding heavy enough to soak through a pad or tampon every hour for 2+ hours.\n4. Pain so bad you cancel plans, miss work, or can't get out of bed.\n\nAny one of these = book an evaluation. Not because something is definitely wrong — but because *finding out* is how you take your time back.\n\nOur Irregular Periods & Hormone Evaluation runs in 8–12 weeks: full hormone + metabolic panel, OBGYN review, a clear answer, a real plan.",
  "Comment CYCLE — we'll DM the evaluation outline.",
  """45-second reel. Each red flag = one scene. Scene 1: a calendar getting circled obsessively. Scene 2: a calendar with empty months. Scene 3: a stack of pads. Scene 4: a hot water bottle on a stomach. On-screen text in big red sans: 'RED FLAG 1' etc. Voiceover steady and serious, not alarming. Cover frame: a closeup of a hand holding a phone with a period tracker open, text 'Four red flags. Don't scroll past.'""",
  S_PROG("irregular-periods"))

P(6, True, "carousel", "program-spotlight", "irregular-periods", "irregular-periods-walkthrough",
  "What an irregular-periods evaluation actually looks like, week by week.",
  "If you've been told 'let's just wait and see', this is what waiting looks like with a plan instead.\n\nWeek 1 — Intake call, full medical and family history, symptom audit. We order labs.\n\nWeek 2–3 — Hormone panel (FSH, LH, AMH, testosterone, prolactin, TSH, fasting insulin), metabolic markers, and a baseline ultrasound if indicated.\n\nWeek 4 — Specialist OBGYN consult to review results together. PCOS? Thyroid? Hyperprolactinaemia? Functional hypothalamic amenorrhea? We narrow it down.\n\nWeek 5–8 — A personalised plan begins: medication if indicated, nutrition that fits your kitchen, and cycle tracking via WhatsApp.\n\nWeek 9–12 — Review, adjust, and decide what's next.\n\nThe goal isn't a perfect cycle next month. It's a clear answer and a path forward.",
  "Book the evaluation — link in bio.",
  """8-slide carousel:
1. COVER serif: 'What an evaluation actually looks like.'
2. Week 1 — intake (icon: phone)
3. Week 2-3 — labs (icon: vial)
4. Week 4 — specialist consult (icon: stethoscope)
5. Week 5-8 — personalised plan (icon: plan)
6. Week 9-12 — review + adjust (icon: arrow loop)
7. What you walk away with: a diagnosis, a plan, ongoing support.
8. CTA — 'Stop waiting. Start understanding. neuera.care'""",
  S_PROG("irregular-periods"))

P(7, False, "reel", "app", "app", "mood-tracking-explained",
  "What you'll see when you track your mood for 60 days alongside your cycle.",
  "Here's what most cycle apps don't tell you: tracking mood next to cycle phases is one of the highest-leverage habits in women's health.\n\nWhy? Because mood patterns cluster. PMDD (premenstrual dysphoric disorder) is dramatically underdiagnosed. Perimenopausal mood shifts are routinely mistaken for depression. Anxiety that follows ovulation is a real, treatable pattern.\n\nBut you can't see the pattern in your head. You need 60+ days of data.\n\nThe Neuera app lets you log mood with one tap, voice-note the bad days when typing is too much, and see the weekly heatmap that turns 'I just feel off' into 'I'm consistently low on day 24 of every cycle'.\n\nThat's the kind of data a clinician can act on.",
  "Download Neuera (link in bio) and try it for one cycle.",
  """30-second reel. Open with phone mockup, finger tapping mood emoji once. Cut to montage: voice note bubble appearing, calendar dots filling in, then the heatmap revealing the cyclic pattern. Voiceover: 'You can't see a pattern from inside your head. You need data. Here's what 60 days of one-tap tracking looks like.' Cover frame: phone showing the mood heatmap with phrase 'Patterns you couldn't see before.'""",
  S_APP_AND)

# ===== WEEK 2 — May 27 to Jun 2 — PCOS week =====
P(8, False, "reel", "education", "pcos-management", "is-this-pcos",
  "Is this PCOS — or is it just stress?",
  "Three years of irregular periods can look like both. Acne flaring on your chin and jawline can look like both. Sudden weight gain around the middle can look like both.\n\nHere's the difference:\n\nStress-driven menstrual changes usually resolve when the stress does. They don't come with rising androgens (the hormones behind hair growth, acne, scalp thinning) and they don't show up on an ovary ultrasound.\n\nPCOS is a clinical diagnosis using the Rotterdam criteria: any two of three — irregular ovulation, signs of high androgens, polycystic ovaries on ultrasound.\n\nIt won't disappear when life calms down. It needs a plan.\n\nThe only way to know which one you're dealing with: hormone panel + consult. Not Google.",
  "Comment PCOS — we'll DM the evaluation checklist.",
  """45s reel. Split-screen-style framing: left side 'STRESS' with calm imagery (yoga mat, journal), right side 'PCOS' with clinical imagery (lab vial, ultrasound). Voiceover walks through the Rotterdam criteria conversationally. On-screen overlay: '2 out of 3 = PCOS.' Cover: bold text 'Is it PCOS or just stress?' with a question-mark visual.""",
  S_PROG("pcos-management"))

P(9, False, "carousel", "education", "pcos-management", "pcos-symptoms-indian-women",
  "Six PCOS symptoms that show up differently in Indian women — and why we miss them.",
  "PCOS in Indian women is often underdiagnosed because the textbook presentation was built on a different population.\n\n1. **Lean PCOS** — your BMI can be 'normal' and you can still have PCOS. Indian women have a higher rate of lean PCOS than most populations studied.\n\n2. **Insulin resistance without obesity** — that midsection weight + sugar crashes pattern can show up well before the scale moves.\n\n3. **Hirsutism on the upper lip, chin, sideburns, and lower abdomen** — culturally normalised, clinically meaningful.\n\n4. **Hair thinning at the crown** — often dismissed as 'genetic' but worth investigating with hormone labs.\n\n5. **Acanthosis nigricans** — dark velvety patches on the neck or armpits, a strong sign of insulin resistance.\n\n6. **Persistent acne along the jawline** that doesn't respond to skincare.\n\nIf you nodded at two or more of these — book an evaluation.",
  "Tap link in bio to book a PCOS evaluation.",
  """8-slide carousel:
1. COVER — 'PCOS looks different in Indian women.' serif.
2-7. One slide per symptom — illustration + 1-line description.
8. CTA — 'Book a PCOS evaluation — neuera.care'
Visual style: line illustrations on a deep forest green background with cream type.""",
  S_PROG("pcos-management"))

P(9, True, "reel", "education", "pcos-management", "thin-pcos-myth",
  "Yes — thin women get PCOS too. And often go undiagnosed for years.",
  "If you've been told 'you can't have PCOS, you're not overweight' — your doctor was wrong, and so was the textbook they learned from.\n\nLean PCOS is real. It affects up to 30–40% of PCOS patients globally, and Indian women appear to be over-represented in that group.\n\nThe diagnostic criteria for PCOS don't include weight. They include irregular ovulation, signs of high androgens, and ovarian appearance on ultrasound. Any two of three.\n\nThe symptoms hit just as hard: fertility struggles, hair changes, mood, acne, insulin resistance you can't see from the outside.\n\nIf your cycle is off and a doctor has dismissed PCOS because of your size — get a second opinion.",
  "Comment LEAN to get our lean-PCOS lab checklist.",
  """30s reel. Direct-to-camera-feel even without a presenter: bold close-up of a phone screen showing a 'cycle: 47 days' calendar, slow zoom out to a thin-build patient looking at a doctor in a video call (stock + permission). Voiceover firm but warm. Final on-screen text: 'PCOS is not a body type.' Cover: split image of two body silhouettes with the caption 'Both can have PCOS.'""",
  S_PROG("pcos-management"))

P(10, False, "carousel", "program-spotlight", "pcos-management", "pcos-12-week-journey",
  "The 12-week PCOS Management journey — week by week.",
  "What 12–16 weeks with our PCOS Management program actually looks like:\n\n**Weeks 1–2** — Specialist OBGYN consult + baseline labs (androgen panel, fasting insulin, lipid panel, thyroid). We meet the whole you, not just the cycle.\n\n**Weeks 3–4** — Results review, working diagnosis, and a personalised treatment blueprint combining medicine + nutrition + lifestyle.\n\n**Weeks 5–8** — Implementation. WhatsApp-based Care Navigator support. Symptom and cycle tracking. Daily questions answered.\n\n**Weeks 9–12** — Clinical review #2. Plan adjustments based on what's working. Most patients see cycle regularity returning by this window.\n\n**Weeks 13–16** — Maintenance and transition to long-term care, including fertility planning if relevant.\n\nThis isn't a quick fix. PCOS is a lifelong condition. But 12 weeks is usually enough to feel meaningfully different.",
  "Start the program — link in bio.",
  """10-slide carousel:
1. COVER serif: 'PCOS Management — 12-week journey.'
2-9. One slide per phase (weeks 1-2, 3-4, 5-8, 9-12, 13-16) + 3 'what to expect' slides addressing mindset / fears / common questions.
10. CTA — 'Begin your journey — neuera.care'.
Visual: timeline graphic running through every slide, week-marker at top.""",
  S_PROG("pcos-management"))

P(11, False, "reel", "education", "pcos-management", "insulin-resistance-explained",
  "The single most underexplained thing about PCOS: insulin resistance.",
  "Most PCOS treatment plans don't work long-term because they treat the symptoms (irregular cycles, acne) without addressing the engine driving them.\n\nThe engine, for most PCOS patients, is insulin resistance.\n\nHere's the chain:\n\nCells stop responding properly to insulin → pancreas pumps out more → high insulin signals the ovaries to make more testosterone → testosterone disrupts ovulation, drives acne, drives unwanted hair growth.\n\nWhich means: if you fix insulin signalling, you often fix the cascade.\n\nHow? It's not 'eat less'. It's eating in a way that keeps blood sugar steady — protein and fibre first, refined carbs last. Sometimes it's metformin. Sometimes it's inositol. Always individualised.\n\nThis is why a real PCOS evaluation includes a fasting insulin test — not just glucose.",
  "Save this. Send to anyone with a PCOS diagnosis who's never had insulin tested.",
  """45s reel. Whiteboard-style explainer (animated drawing): pancreas → insulin → cells → testosterone → ovary. Voiceover walks the chain. Cover frame: cartoon ovary with a thought bubble showing rising insulin levels and the text 'The hidden engine of PCOS.'""",
  S_PROG("pcos-management"))

P(12, False, "image", "testimonial", "pcos-management", "pcos-quote-card",
  "'My first cycle in 11 months arrived in week 9.'",
  "We don't promise outcomes — every PCOS journey is different. But here's what we can promise: a real diagnostic workup, a plan grounded in evidence, and a Care Navigator who actually picks up the phone.\n\nThe rest comes from you and your body, in your time.\n\n",
  "Book a first consult — pay after choosing a slot. Link in bio.",
  """Single quote-card: warm peach gradient background. Big serif: 'My first cycle in 11 months arrived in week 9.' Attribution: '— A neuera patient, PCOS Management program'. Neuera logo bottom-right.""",
  S_PROG("pcos-management"))

P(12, True, "carousel", "program-spotlight", "ttc-pcos", "ttc-pcos-deepdive",
  "Trying to conceive with PCOS — what 'a real plan' looks like.",
  "If you have PCOS and you're trying to conceive, you've probably been told two contradictory things: 'just relax, it'll happen' and 'you'll need IVF eventually'.\n\nThe truth, for most people, is in the middle.\n\nOur TTC with PCOS pathway is 3–6 months long and stepwise:\n\n**Month 1** — Confirm PCOS, confirm ovulation status, confirm tubal patency if indicated. Partner semen analysis review. Lifestyle and metabolic baseline.\n\n**Months 2–4** — Targeted ovulation support. For many, this means timed-intercourse cycles with letrozole or clomiphene — both evidence-based, both first-line for PCOS-related anovulation.\n\n**Months 5–6** — If unsuccessful, structured escalation: IUI consideration, or referral to a fertility centre for IVF when clinically appropriate.\n\nThere's no shame in needing IVF. There's also no shame in trying simpler options first.",
  "Book the TTC with PCOS pathway — neuera.care.",
  """8-slide carousel:
1. COVER serif: 'Trying to conceive with PCOS? A real plan exists.'
2. The myth ('just relax') vs the truth.
3. Month 1 — confirm + baseline.
4. Months 2-4 — ovulation support (letrozole, clomiphene).
5. Months 5-6 — structured escalation.
6. What we *don't* do (no overnight miracles, no shame-based language).
7. The Care Navigator role through the journey.
8. CTA — 'Begin — neuera.care'.""",
  S_PROG("ttc-pcos"))

P(13, False, "reel", "education", "ttc-pcos", "ovulation-tracking-101",
  "How to actually know if you're ovulating — beyond an LH strip.",
  "LH strips are useful, but they're a starting point — not the full story. Especially in PCOS, where high baseline LH can give false positives.\n\nThe four signals that, together, actually confirm ovulation:\n\n1. **Cervical mucus** turning egg-white-stretchy mid-cycle.\n2. **Basal body temperature** rising 0.3–0.5°C after ovulation and staying up for 10+ days.\n3. **Mid-luteal progesterone** lab test (around day 21 of a 28-day cycle) showing >5 ng/mL.\n4. **Ultrasound follicle tracking** — the gold standard when stakes are high.\n\nNo single one of these is enough on its own — especially LH. For PCOS specifically, mid-luteal progesterone is the cleanest answer.\n\nIf you're 6+ months into trying without success, this is the conversation to have with a specialist.",
  "Comment OVULATE — we'll DM the at-home tracking template.",
  """45s reel. Each signal = one scene. Cervical mucus visualised by a textured stretch (silicone slime, no anatomical), BBT shown on a phone temperature chart, progesterone shown as a vial label, ultrasound follicle shown as a circle pulsing. On-screen captions in cream serif. Cover frame: 'LH strips are not enough.'""",
  S_PROG("ttc-pcos"))

P(14, False, "carousel", "education", "pcos-management", "pcos-diet-myths-indian",
  "Six PCOS 'diet rules' that don't fit an Indian kitchen — and what to do instead.",
  "Most PCOS diet advice on the internet is built around Mediterranean or Western plates. It doesn't survive contact with dal-chawal.\n\nHere's how we actually counsel patients:\n\n**Myth 1: Avoid all rice.** Reality: white rice + dal + sabzi is fine if you front-load protein and fibre. Add curd. Order matters more than elimination.\n\n**Myth 2: No fruit.** Reality: whole fruit is fine. Juice is not.\n\n**Myth 3: Roti is the enemy.** Reality: 1–2 rotis with vegetables and protein is balanced. The problem is 4 rotis with potato sabzi.\n\n**Myth 4: You must do keto.** Reality: extreme low-carb is unsustainable in Indian households and not necessary for most.\n\n**Myth 5: Avoid dairy.** Reality: paneer, curd, and milk are fine for most. A small subset benefits from reducing — it's individual.\n\n**Myth 6: Skip dinner / intermittent fast aggressively.** Reality: irregular eating worsens insulin resistance over time.",
  "Save this for the next person who says 'cut everything white'.",
  """8-slide carousel:
1. COVER serif: 'PCOS diet myths that don't survive an Indian kitchen.'
2-7. One myth per slide, beautifully shot Indian food in the background (thali, idli, paneer, dal-chawal). Myth in red strikethrough, reality in cream.
8. CTA — 'Get a personalised PCOS nutrition plan — neuera.care'""",
  S_PROG("pcos-management"))

# ===== WEEK 3 — Jun 3 to Jun 9 — Pain is not normal =====
P(15, False, "reel", "education", "period-pain", "pain-is-not-normal",
  "If your period pain stops you from working, it's not normal. It's a symptom.",
  "We've heard every version of this:\n\n'It's been like this since I was 14.' 'My mom had it too.' 'The doctor said I'd grow out of it.' 'It's just because I'm not married yet.'\n\nNone of these are answers. They're deflections.\n\nDisabling period pain — pain that stops you from working, sleeping, or eating — is a symptom. The most common causes we evaluate are endometriosis, adenomyosis, and uterine fibroids. All three can be diagnosed and treated.\n\nYou are not broken. You are not exaggerating. You don't have a low pain tolerance.\n\nYou have a symptom. Symptoms have causes. Causes have treatments.",
  "Book a Period Pain Evaluation — link in bio.",
  """30s reel. Open with a closeup of a hand gripping a hot water bottle, slow pan up to a woman's face at her laptop, brow furrowed. Voiceover overlays the common excuses. Cuts get sharper. Final scene: she closes the laptop and picks up her phone to call. On-screen text: 'Pain is not normal.' Cover frame: serif text on a deep maroon background.""",
  S_PROG("period-pain"))

P(15, True, "carousel", "education", "period-pain", "pelvic-pain-red-flags",
  "Eight signs of pelvic pain you should never normalise.",
  "Most women have been taught to under-report pain. We want to retrain that.\n\nThese are the eight signs we listen for in a Period Pain & Pelvic Pain Evaluation:\n\n1. Pain that needs more than 1–2 doses of OTC painkillers per cycle.\n2. Pain that radiates to the lower back or down the legs.\n3. Painful bowel movements during your period.\n4. Painful urination during your period.\n5. Pain during sex (deep, internal — not entry).\n6. Pain outside of your period, mid-cycle or randomly.\n7. Heavy bleeding paired with severe cramping.\n8. Pain so bad you've vomited or fainted.\n\nAny one of these = book an evaluation. Three or more = take it seriously now.",
  "Save this. Share it. Especially with the teenager in your family who's been told to 'tough it out'.",
  """10-slide carousel:
1. COVER serif: 'Eight signs you should never normalise.'
2-9. One sign per slide, line illustration + brief explanation.
10. CTA — 'Get evaluated — neuera.care'.
Visual: warm cream background, deep maroon accents.""",
  S_PROG("period-pain"))

P(16, False, "reel", "education", "period-pain", "endometriosis-101",
  "Endometriosis affects 1 in 10 women. The average time to diagnosis is 7–9 years.",
  "Endometriosis is when tissue similar to the uterine lining grows outside the uterus — on ovaries, fallopian tubes, the pelvic wall, sometimes further.\n\nIt bleeds with every cycle. With nowhere to go, it inflames surrounding tissue. The result: severe cramps, pain with sex, painful bowel movements, fatigue, and for many, infertility.\n\nThe diagnostic gap exists because endometriosis is invisible on standard ultrasound and is gold-standard-diagnosed via laparoscopy.\n\nBut you don't need a laparoscopy to start treatment. A specialist OBGYN can build a strong clinical suspicion from your history, examine you, and offer evidence-based first-line treatment (hormonal suppression, pelvic floor PT, pain management) while ruling out other causes.\n\nDon't wait 7 years for an answer.",
  "Comment ENDO — we'll DM the symptom journal template.",
  """45s reel. Animated explainer: simple anatomical line drawing of uterus + ovaries, then the same with endometrial deposits marked in red. Voiceover walks through the cycle of inflammation. On-screen: 'Average time to diagnosis: 7-9 years.' Cover frame: serif text 'You don't have 9 years.'""",
  S_PROG("period-pain"))

P(17, False, "carousel", "program-spotlight", "period-pain", "period-pain-evaluation",
  "What a real Period Pain Evaluation includes.",
  "If you've ever been told 'your scan is normal' and sent home with painkillers — this is for you.\n\nA standard pelvic ultrasound misses endometriosis, often misses adenomyosis, and only catches large fibroids. A *real* evaluation goes further.\n\nOur Period Pain & Pelvic Pain Evaluation, in 8–12 weeks:\n\n→ Detailed symptom mapping (when, where, how, with what triggers)\n→ Targeted physical examination\n→ Transvaginal ultrasound with a specialist sonographer\n→ MRI if adenomyosis or deep endometriosis is suspected\n→ Screening labs to rule out other causes\n→ Specialist OBGYN review and an evidence-based plan: medication, pelvic floor PT, surgical referral when indicated\n\nThe goal: a name for what's happening, and a plan that's not 'take ibuprofen and try again next month'.",
  "Book the evaluation — neuera.care, link in bio.",
  """8-slide carousel:
1. COVER serif: 'A real evaluation. Not just a scan.'
2. Why 'your scan is normal' is often wrong.
3. Symptom mapping.
4. Specialist sonography (vs general ultrasound).
5. When MRI is the right call.
6. Screening labs.
7. Treatment options across medication, PT, surgery.
8. CTA — 'Get evaluated — neuera.care'.""",
  S_PROG("period-pain"))

P(18, False, "image", "testimonial", "period-pain", "endo-testimonial",
  "'I waited 11 years to be told my pain had a name.'",
  "Endometriosis. Adenomyosis. Fibroids. PMDD. Vulvodynia. Pelvic floor dysfunction.\n\nThese conditions don't show up on a routine ultrasound. They show up when someone *listens* — and then runs the right tests.\n\nThat's the job we signed up for.",
  "Book a Period Pain Evaluation — link in bio.",
  """Single image: deep maroon background with a long quote-mark graphic. Serif: 'I waited 11 years to be told my pain had a name.' Attribution: '— A neuera patient, age 28'. Bottom corner: 'Period Pain Evaluation • neuera.care'.""",
  S_PROG("period-pain"))

P(18, True, "reel", "education", "period-pain", "fibroids-awareness",
  "Uterine fibroids: more common than you think, and often quietly disruptive.",
  "Uterine fibroids are benign growths in or on the uterus. Up to 70% of women will have at least one by age 50 — many never know.\n\nBut when fibroids cause symptoms, they really cause symptoms: heavy bleeding that ruins your week, pelvic pressure, frequent urination, low back pain, fertility complications.\n\nThe good news: fibroids are highly treatable. Watchful waiting works for small asymptomatic ones. For symptomatic ones, options range from hormonal medication to uterine artery embolisation to myomectomy (preserving fertility) to hysterectomy in select cases.\n\nThe right choice depends on your fibroids, your symptoms, your fertility plans, and what *you* want — not what someone else decides for you.",
  "Comment FIBROID for our fibroid options decision guide.",
  """30s reel. Animated uterus showing fibroid locations (submucosal, intramural, subserosal). Voiceover walks through treatment ladder. Final on-screen: 'Fibroids are treatable. You have options.' Cover: serif text 'Fibroids: 1 in 2 women. Almost no one talks about them.'""",
  S_PROG("period-pain"))

P(19, False, "carousel", "education", "period-pain", "when-to-see-a-doctor",
  "When should you actually see a doctor about period pain? Here's the threshold.",
  "We get this question constantly. Here's the simplest framework:\n\n**See a doctor if:**\n→ You miss 1+ days of work or school per cycle due to pain.\n→ Painkillers stopped working as well as they used to.\n→ Pain is increasing year on year.\n→ You experience pain during sex or bowel movements during periods.\n→ Bleeding is heavier than 'normal' for you, or you pass clots larger than a 10-rupee coin.\n→ Pain wakes you from sleep.\n→ You're considering pregnancy or struggling to conceive.\n→ You've ever been dismissed and the pain is still there.\n\nAny one of these = it's time.\n\nAnd if you're a teenager reading this: this list applies to you too. Especially you.",
  "Tag a friend who needs to see this. Save it for yourself.",
  """8-slide carousel:
1. COVER serif: 'When should you see a doctor about period pain?'
2-7. One trigger per slide, illustration + 1 line.
8. CTA — 'Book an evaluation — neuera.care'.""",
  S_PROG("period-pain"))

P(20, False, "reel", "education", "irregular-periods", "heavy-bleeding-flags",
  "If you're soaking a pad every hour for two hours in a row — that's not heavy. That's an emergency-ish.",
  "There's no glory in surviving a brutal period. Heavy menstrual bleeding (medically called menorrhagia) has clear thresholds:\n\n→ Soaking a regular pad or tampon every hour for 2+ consecutive hours\n→ Bleeding lasting more than 7 days\n→ Passing clots larger than a 10-rupee coin\n→ Bleeding so heavy you wake up to change at night\n→ Symptoms of anaemia: fatigue, breathlessness on stairs, looking pale, feeling dizzy when standing\n\nCommon causes: fibroids, adenomyosis, hormonal imbalance, bleeding disorders, thyroid issues.\n\nAll diagnosable. All treatable. None of which require you to white-knuckle your way through.\n\nGet evaluated. Get your iron checked. Get your life back.",
  "Comment FLOW — we'll DM the heavy-bleeding workup checklist.",
  """30s reel. Sharp cuts: a stack of pads, a clock at 2am, a pale face in a mirror, a phone with a Google search 'is this much bleeding normal'. Voiceover blunt and caring. Cover: serif text 'Heavy is a symptom. Not a personality trait.'""",
  S_PROG("irregular-periods"))

P(21, False, "carousel", "app", "app", "pain-tracking-guide",
  "How to track period pain in a way that actually helps your doctor.",
  "If you've ever walked into an appointment and forgotten how bad last month's pain was — this carousel is for you.\n\nWhat to track, daily, for at least one full cycle:\n\n1. **Pain level (0–10)** — at your worst moment that day.\n2. **Location** — where exactly. Lower back, deep pelvis, side, abdomen.\n3. **Duration** — hours of disabling pain vs hours of dull ache.\n4. **Painkillers used** — what, when, how many, did it help.\n5. **Disruption** — did you cancel anything? Miss work?\n6. **Bleeding flow** — light/medium/heavy/flooding.\n7. **Symptoms paired with pain** — bowel changes, urinary urgency, pain during sex.\n8. **Mood and sleep** — anxiety spikes, energy crashes, insomnia.\n\nThe Neuera app makes this a 30-second daily check-in instead of a chore. Bring 60 days of this to your consult — you'll get a fundamentally better evaluation.",
  "Download Neuera (link in bio) and start tracking today.",
  """9-slide carousel:
1. COVER serif: 'Track period pain like a clinician would.'
2-9. One field per slide with example screenshots from the app.""",
  [*S_APP_AND, *S_PROG("period-pain")])

P(21, True, "reel", "education", "period-pain", "painkillers-not-only-option",
  "If painkillers are your only plan for period pain — there are five other tools your doctor should be discussing.",
  "Painkillers (NSAIDs like mefenamic acid, naproxen, ibuprofen) are first-line for period pain. They work. But they're not the whole toolkit.\n\nOther evidence-based options, depending on cause:\n\n1. **Combined hormonal contraception** — suppresses ovulation and lightens periods. Game-changing for many.\n2. **Hormonal IUD (Mirena)** — reduces flow by 70–90%, often within months.\n3. **Pelvic floor physiotherapy** — wildly underused, often missing in standard plans, especially for chronic pelvic pain.\n4. **Targeted treatments for the underlying condition** — surgery for fibroids, hormonal suppression or surgery for endometriosis.\n5. **TENS units, heat therapy, magnesium** — adjuncts that genuinely help when stacked with the above.\n\nIf the only thing on your prescription is 'take painkillers and let me know if it's worse' — get a second opinion.",
  "Comment OPTIONS to get the full decision guide.",
  """45s reel. Each tool = one scene with a quick visual: pill bottle, IUD diagram, pelvic floor PT cue (foam roller), surgery icon, TENS unit. Voiceover firm. Cover: 'Painkillers shouldn't be the whole plan.'""",
  S_PROG("period-pain"))

# ===== WEEK 4 — Jun 10 to Jun 16 — Planning a baby =====
P(22, False, "reel", "education", "preconception-ttc", "fertile-window-myth",
  "Most people have the fertile window wrong. Here's the actual math.",
  "The fertile window is the 5 days *before* ovulation plus the day of ovulation itself. Six days total. That's it.\n\nKey points most people miss:\n\n→ Sperm survives in the female reproductive tract for up to 5 days. The egg only lives 12–24 hours.\n→ Conception is *most* likely 1–2 days *before* ovulation — not on ovulation day.\n→ Day 14 isn't universal. People with 28-day cycles ovulate around day 14. People with 35-day cycles ovulate around day 21.\n→ LH surge happens 24–36 hours before ovulation. That's why LH strips are useful, but you've already entered the fertile window when one turns positive.\n\nIf you're trying to conceive: time intercourse *every other day* across the fertile window, not 'on ovulation day'.",
  "Comment WINDOW for our fertile-window cheat sheet.",
  """45s reel. Calendar visual builds out, marking ovulation day, then expanding backward 5 days. Sperm and egg lifespan visualised with simple icons. Voiceover walks the math. Cover: 'You have 6 days. Make them count.'""",
  S_PROG("preconception-ttc"))

P(23, False, "carousel", "program-spotlight", "preconception-ttc", "preconception-checklist",
  "The preconception checklist no one handed you.",
  "Three to six months *before* you start trying — these are the things to put in place.\n\n**Labs:**\n→ Hormones (FSH, LH, AMH, thyroid, prolactin)\n→ Metabolic (fasting glucose, HbA1c, lipid panel)\n→ Nutrient (B12, ferritin, vitamin D, folate)\n→ Infectious screening (Rubella, Hep B, Hep C, HIV, syphilis)\n\n**Lifestyle:**\n→ Start folic acid 400–800 mcg/day, at least 1 month before trying\n→ Bring HbA1c into target range if elevated\n→ Vitamin D in optimal range\n→ Alcohol minimised; smoking stopped\n\n**Care:**\n→ Update vaccines (especially MMR and varicella — these are contraindicated *during* pregnancy)\n→ Review every medication you take with a clinician\n→ Dental check-up (gum health affects pregnancy outcomes)\n→ Partner labs (semen analysis)\n\nThis isn't paranoia. It's the difference between a clean baseline and 'we'll figure it out when it happens'.",
  "Book the Preconception & TTC program — link in bio.",
  """10-slide carousel:
1. COVER serif: 'The preconception checklist no one handed you.'
2-9. Grouped slides: labs, lifestyle, vaccines, partner.
10. CTA — 'Get the full workup — neuera.care'.""",
  S_PROG("preconception-ttc"))

P(24, False, "reel", "education", "preconception-ttc", "folic-acid-timing",
  "If you want to take folic acid right — start *before* you try to conceive.",
  "Folic acid prevents neural tube defects (spina bifida, anencephaly). It works because it's available in the bloodstream *when the neural tube is forming* — which happens in weeks 3–4 of pregnancy.\n\nMost women find out they're pregnant in weeks 4–6. By then, the critical window is closing.\n\nSo the WHO and ACOG both recommend: **400–800 mcg of folic acid daily, starting at least 1 month before you stop contraception.**\n\nIf you have a history of neural tube defect or you're on certain medications (some anti-epileptics, methotrexate), your dose may need to be 4 mg/day — that's 5–10× the standard. Discuss with a clinician.\n\nA prenatal multivitamin is great, but check the folate content. Many fall short.",
  "Save this. Share with anyone planning to try in the next year.",
  """30s reel. Calendar zoom-in: weeks 3-4 of pregnancy highlighted, then arrow back to '1 month before trying'. Visual of folic acid pill bottle. Final on-screen: 'The window opens before you know.' Cover: '400 mcg. Every day. Starts before pregnancy.'""",
  S_PROG("preconception-ttc"))

P(24, True, "carousel", "education", "preconception-ttc", "lab-panel-basics",
  "What every preconception lab panel should include — and why.",
  "If your doctor only ordered a thyroid test and called it a workup — this is for you.\n\nHere's the panel we run and *why* each marker matters:\n\n**Thyroid (TSH, free T4)** — Even subclinical hypothyroidism raises miscarriage risk.\n\n**Prolactin** — Elevated prolactin disrupts ovulation.\n\n**FSH, LH, AMH** — Ovarian reserve and ovulation pattern. AMH especially in your mid-30s and beyond.\n\n**Fasting insulin + HbA1c** — Insulin resistance and pre-diabetes affect both conception and pregnancy outcomes. Diabetes during pregnancy (gestational or pre-existing) is high-stakes.\n\n**Vitamin D, B12, ferritin** — Deficiencies are common in Indian women and affect implantation and early pregnancy.\n\n**Rubella immunity** — If non-immune, vaccinate now (you can't during pregnancy).\n\n**Hep B / Hep C / HIV / syphilis** — Routine, important.\n\n**Semen analysis (partner)** — 40–50% of fertility issues involve the male partner. Skipping this is medically negligent.",
  "Book a preconception lab review — neuera.care.",
  """10-slide carousel:
1. COVER serif: 'The labs that actually matter before you try.'
2-9. One marker (or grouping) per slide with a 1-line 'why'.
10. CTA.""",
  S_PROG("preconception-ttc"))

P(25, False, "image", "testimonial", "preconception-ttc", "partner-involvement",
  "'Fertility is not a women's issue. It's a couple's issue.'",
  "40–50% of fertility challenges involve the male partner. Sometimes it's the only factor. Always worth testing.\n\nSemen analysis is non-invasive, inexpensive, and gives an enormous amount of information about timing and pathways. Skipping it is one of the most common preconception mistakes we see.\n\nBring your partner. Run the analysis. Move forward together.",
  "Book a couple's preconception consult — link in bio.",
  """Single image: warm cream background, two hands (no specific gender styling) holding the same lab report. Serif quote: 'Fertility is not a women's issue. It's a couple's issue.' Attribution: 'neuera.care'. No stock-couple cliché.""",
  S_PROG("preconception-ttc"))

P(26, False, "carousel", "program-spotlight", "early-pregnancy", "first-trimester-flags",
  "First trimester: what to bring to your specialist, and what to call about immediately.",
  "The first 12 weeks of pregnancy are the most important — and often the least supported.\n\n**What to bring to your first specialist consult:**\n→ Last menstrual period date\n→ All current medications and supplements\n→ Personal medical history (chronic conditions, surgeries)\n→ Family history (genetic conditions, recurrent miscarriage, diabetes, hypertension)\n→ Partner's medical history if known\n\n**Call your doctor *today* if you have:**\n→ Heavy bleeding (more than spotting)\n→ Severe one-sided abdominal pain\n→ Shoulder-tip pain (could indicate ectopic)\n→ Vomiting so frequent you can't keep fluids down (hyperemesis gravidarum)\n→ Sudden cessation of pregnancy symptoms paired with bleeding\n→ Fever above 38°C\n\nFirst-trimester care isn't 'come back at 12 weeks'. It's active monitoring.",
  "Book Early Pregnancy Care — link in bio.",
  """10-slide carousel:
1. COVER serif: 'First trimester care matters most.'
2-5. What to bring slides.
6-9. Call-immediately red flag slides.
10. CTA.""",
  S_PROG("early-pregnancy"))

P(27, False, "reel", "education", "preconception-ttc", "supplement-myths",
  "Five preconception supplements you don't need — and the three you actually do.",
  "The fertility supplement industry is enormous. Most of it is unproven. Some of it is harmful.\n\n**Skip (or be skeptical of):**\n→ DHEA — only useful in specific diminished-ovarian-reserve cases under specialist guidance.\n→ Maca root — pleasant tea, weak evidence.\n→ Royal jelly — allergy risk, no robust evidence.\n→ Generic 'fertility blends' — usually expensive folic acid + things you don't need.\n→ Vitex (chasteberry) — sometimes pushed for ovulation; consult first, real interactions exist.\n\n**Actually evidence-based:**\n→ **Folic acid** 400–800 mcg/day (or methylfolate if MTHFR variant).\n→ **Vitamin D** if deficient — most Indians are.\n→ **Iron + B12** if deficient — common in vegetarian diets.\n\nAdditional consideration: inositol (myo + d-chiro at 40:1 ratio) has decent evidence for PCOS-related ovulation. Not a 'general' fertility supplement.",
  "Comment SUPP — we'll DM the full supplement guide.",
  """45s reel. Each supplement = one frame. Skip list shown with strikethrough; keep list shown clean. Voiceover candid, almost frustrated at industry hype. Cover: 'Most fertility supplements are noise.'""",
  S_PROG("preconception-ttc"))

P(27, True, "image", "app", "app", "app-cycle-screen",
  "Day 14? Day 21? Your cycle, on your phone, finally legible.",
  "Cycle apps have existed for years. Most of them are noisy: ads, paywalls, fertility predictions that are wrong half the time.\n\nNeuera is different. We built it so the data we collect is the data your doctor will actually find useful: real flow, real pain, real symptoms — not generic emoji guesses.\n\nAnd because it lives next to your mood, sleep, and voice notes, you walk into your consult with a real picture of your last 60 days. Not 'I think it started around the 8th'.",
  "Download Neuera — link in bio.",
  """Single image: phone mockup showing the cycle calendar screen, day-by-day flow and symptom marks visible. Cream background with subtle warm gradient. Serif: 'Your cycle, finally legible.' Sub: 'Neuera — daily check-ins for the body that's been talking.' Bottom: Play Store + App Store badges.""",
  S_APP_AND)

P(28, False, "carousel", "program-spotlight", "early-pregnancy", "early-pregnancy-program",
  "Early Pregnancy Care — what specialist support actually looks like in the first 12 weeks.",
  "Most early-pregnancy plans look like: 'Take folic acid, see you at 12 weeks.' Ours doesn't.\n\n**Weeks 4–6** — Confirm pregnancy, dating ultrasound, review of all medications for safety, baseline labs.\n\n**Weeks 6–8** — Specialist consult to address symptoms (nausea, fatigue, anxiety) with evidence-based interventions. Discuss any risk factors openly.\n\n**Weeks 8–10** — Early ultrasound for viability and dating. Genetic screening options reviewed (NIPT, anatomy scans, what's right for you).\n\n**Weeks 10–12** — Care navigator coordinates transition to obstetric partner of your choice. Continuity, not handoff.\n\n**Throughout** — WhatsApp Care Navigator for the 2am questions. The questions you don't want to call your gynaecologist about.",
  "Book Early Pregnancy Care — neuera.care, link in bio.",
  """8-slide carousel:
1. COVER serif: 'Early pregnancy care: not just folic acid.'
2-5. Weekly walkthrough.
6. The 2am question principle (Care Navigator).
7. What we don't do (we don't replace your OB, we bridge to them).
8. CTA.""",
  S_PROG("early-pregnancy"))

# ===== WEEK 5 — Jun 17 to Jun 23 — Perimenopause is real =====
P(29, False, "reel", "education", "perimenopause", "am-i-in-peri",
  "Am I in perimenopause — at 38?",
  "Perimenopause is the 4–10 year transition leading up to menopause. It can begin in your late 30s, and the average Indian woman enters it earlier than the global average.\n\nThe early signs are easy to miss because they look like everything else:\n\n→ Cycles getting shorter, longer, or unpredictable\n→ Sleep getting lighter, especially in the days before your period\n→ A new kind of anxiety in the luteal phase\n→ Hot flushes — not always 'classic', sometimes just feeling 'warmer than you should be'\n→ Brain fog around the time you'd expect a period\n→ Heavier periods, or shorter cycles with more PMS\n\nNone of these is 'you getting older'. It's a hormonal transition with real testing, real treatment, and real options.",
  "Comment PERI — we'll DM the symptom checklist.",
  """45s reel. Each symptom = one quick scene: a calendar with mismatched dots, a 3am ceiling shot, a brow furrowed at work, a hand fanning a face, a forgotten word. Voiceover: 'Maybe you're not falling apart. Maybe you're in peri.' Cover: serif 'Peri starts earlier than they told you.'""",
  S_PROG("perimenopause"))

P(30, False, "carousel", "education", "perimenopause", "peri-symptom-checker",
  "The 12-symptom perimenopause checker.",
  "If you're between 35 and 55 and any of these are new or worsening — perimenopause is on the table.\n\n1. Shorter or longer cycles than your baseline.\n2. Heavier or lighter flow than your baseline.\n3. Skipped periods.\n4. Hot flushes / night sweats.\n5. Sleep disruption, especially second half of cycle.\n6. New or worsening anxiety/irritability.\n7. Brain fog or word-finding difficulty.\n8. Mood shifts that feel hormonal, not situational.\n9. Vaginal dryness or pain with sex.\n10. New onset urinary urgency or recurrent UTIs.\n11. Joint aches you can't explain.\n12. Decreased libido.\n\n4 or more = book a perimenopause evaluation. 8 or more = please don't wait.",
  "Save this. Send it to the friend who's been told 'it's just stress'.",
  """8-slide carousel:
1. COVER serif: 'The 12-symptom peri checker.'
2-7. Grouped 2 symptoms per slide.
8. CTA — 'Book a peri evaluation — neuera.care'.""",
  S_PROG("perimenopause"))

P(30, True, "reel", "education", "perimenopause", "hrt-101",
  "HRT in 60 seconds — what it is, what it isn't, and who it's for.",
  "Hormone Replacement Therapy (HRT) — increasingly called Menopausal Hormone Therapy (MHT) — is one of the most evidence-based, undervalued treatments in women's health.\n\nWhat it is: replacing the oestrogen (and usually progesterone) that your body is no longer making at sufficient levels.\n\nWhat it treats well: hot flushes, night sweats, mood, sleep, vaginal symptoms, bone density, possibly cardiovascular protection when started in the right window.\n\nWhat it isn't: a cancer-causing pill. The 2002 study that scared everyone has been re-analysed extensively. For most women under 60 within 10 years of menopause, the benefits outweigh the risks — significantly.\n\nWho it's for: women in peri or early menopause with bothersome symptoms, after a proper individual risk assessment.\n\nWho it's *not* for: women with active hormone-sensitive cancers, recent blood clots, or certain liver conditions.\n\nIt's a conversation, not a default yes or no.",
  "Comment HRT — we'll DM the decision framework.",
  """60s reel. Direct text-on-screen format. Big serif phrase 'HRT in 60 seconds.' Each point shown for 5-7s with calm voiceover. Cover: 'HRT — the most underused tool in women's health.'""",
  S_PROG("perimenopause"))

P(31, False, "carousel", "education", "perimenopause", "sleep-and-hormones",
  "Why peri wrecks sleep — and what actually helps.",
  "Perimenopausal sleep disruption is a clinical phenomenon, not a personal failure.\n\nWhy it happens:\n→ Progesterone (a natural sleep aid) drops first and most volatilely in peri.\n→ Oestrogen fluctuations trigger night sweats and vasomotor wake-ups.\n→ Stress hormone (cortisol) rhythm shifts.\n→ Anxiety in the luteal phase spikes.\n\nWhat doesn't work well: 'just try magnesium' or 'go to bed earlier'.\n\nWhat does help, in evidence-based order:\n1. **HRT** — particularly cyclic progesterone — improves sleep dramatically for many.\n2. **Cognitive behavioural therapy for insomnia (CBT-I)** — gold-standard non-drug intervention.\n3. **Strict sleep hygiene** — cool room, dark room, no phones in bed, consistent timing.\n4. **Targeted supplements** — magnesium glycinate, L-theanine; evidence is modest but reasonable.\n5. **Avoid alcohol in the second half of cycle** — it tanks deep sleep.\n6. **Manage night sweats** — moisture-wicking sleepwear, bedside fan.\n\nIf sleep is gone for more than 2 weeks straight, it's a medical issue.",
  "Save this. Pin it to your bathroom mirror.",
  """8-slide carousel:
1. COVER serif: 'Why peri wrecks sleep.'
2-4. Why slides.
5-7. What helps, ranked.
8. CTA.""",
  S_PROG("perimenopause"))

P(32, False, "reel", "education", "perimenopause", "mood-swings-explained",
  "If your mood is doing things it never used to — your brain is processing real hormone shifts.",
  "Oestrogen and progesterone don't just regulate periods. They regulate serotonin, dopamine, and GABA — the same neurotransmitters that mood medications target.\n\nWhen oestrogen drops sharply (luteal phase, perimenopause), serotonin drops with it. That can show up as: new anxiety, irritability that feels alien, rumination, low mood, rage at small things, dread.\n\nThis is not 'stress'. It is real biochemistry.\n\nWhat helps:\n→ Tracking the pattern (so you can see the cycle behind it).\n→ HRT for the underlying hormone shift, when appropriate.\n→ SSRIs/SNRIs — first-line for severe mood symptoms in peri, with or without HRT.\n→ Targeted nutrition and movement.\n→ Therapy that knows hormones, not just generic CBT.\n\nThe goal isn't to feel grateful you're allowed to be irritable. The goal is to feel like yourself again.",
  "Comment MOOD — we'll DM the perimenopause mood support guide.",
  """45s reel. Brain illustration with neurotransmitter labels lighting up and dimming. Voiceover steady and validating. On-screen: 'It's not just stress. It's biology.' Cover: 'Peri mood: it's chemistry, not character.'""",
  S_PROG("perimenopause"))

P(33, False, "image", "testimonial", "perimenopause", "peri-quote",
  "'For the first time in five years, I felt like me again.'",
  "We hear this a lot — and not because anything dramatic happened. Just: a clear diagnosis, the right plan, and consistent support.\n\nIf you've spent the last few years feeling like a different person — you might not be. You might just be in peri.",
  "Book a Perimenopause Program consult — link in bio.",
  """Single image: deep navy background, warm gold serif: 'For the first time in five years, I felt like me again.' Attribution: '— A neuera patient, Perimenopause Program'. Subtle gold neuera logo.""",
  S_PROG("perimenopause"))

P(33, True, "carousel", "program-spotlight", "perimenopause", "peri-program-walkthrough",
  "The Perimenopause Program — 12 weeks, end to end.",
  "**Weeks 1–2** — Specialist OBGYN consult, complete symptom mapping, full hormonal and metabolic panel, baseline cardiovascular and bone risk assessment.\n\n**Weeks 3–4** — Results review. HRT evaluation if symptoms warrant — with a real risk/benefit conversation. Mood and sleep medication consideration if relevant.\n\n**Weeks 5–10** — Implementation. Titration. Care Navigator support via WhatsApp. Sleep, nutrition, and movement coaching layered in.\n\n**Weeks 11–12** — Review. Adjust. Plan for the next 6–12 months.\n\nWhat patients commonly report by week 12: better sleep, calmer mood, fewer hot flushes, more energy. Not 'back to 25' — but back to *you*.",
  "Begin the program — neuera.care, link in bio.",
  """8-slide carousel:
1. COVER serif: '12 weeks. End to end.'
2-7. Weekly phases.
8. CTA.""",
  S_PROG("perimenopause"))

P(34, False, "reel", "education", "perimenopause", "hot-flushes",
  "Hot flushes aren't just 'feeling warm'. Here's what's actually happening in your brain.",
  "A hot flush is a thermoregulatory event triggered by changes in oestrogen signalling to the hypothalamus — the brain region that controls your internal thermostat.\n\nThe thermostat 'window' (the range of body temperatures your brain considers OK) narrows in peri/menopause. Small upward shifts now trigger a panic response: rapid heart rate, sudden vasodilation, sweating, sometimes anxiety.\n\nIt's not in your head. It's in your hypothalamus.\n\nWhat helps:\n→ HRT (most effective, 80–90% reduction).\n→ Non-hormonal options: certain SSRIs, gabapentin, clonidine, and a newer class called NK3 antagonists.\n→ Lifestyle: avoid triggers (spicy food, alcohol, caffeine for some), dress in layers, cool bedroom.\n→ Cognitive behavioural therapy reduces *bother*, not frequency.\n\nIf hot flushes are eating your life — there are options.",
  "Comment FLUSH — we'll DM the hot flush treatment guide.",
  """45s reel. Animated hypothalamus illustration with a narrowing 'thermostat window'. Voiceover. Cover: 'Hot flushes start in your brain, not your body.'""",
  S_PROG("perimenopause"))

P(35, False, "carousel", "education", "perimenopause", "peri-at-35",
  "Peri at 35? Yes, it happens. Here's how to know.",
  "The average age of menopause in India is 46–48 — earlier than the global 51. That means perimenopause can begin in your mid-30s for some women.\n\nEarly perimenopause looks like:\n→ Cycles that were always reliable becoming subtly inconsistent.\n→ PMS becoming worse than it ever was.\n→ Sleep getting lighter without an obvious cause.\n→ New anxiety in your luteal phase.\n→ Heavier or more clotted bleeding.\n→ A vague 'something is off' that nobody else takes seriously.\n\n**Not** perimenopause (don't conflate): a single stressful season, post-pregnancy hormonal shifts, thyroid changes, or PCOS flare-ups. These need ruling out first.\n\nThe right test at 35 is not 'one FSH level' — it's a panel run over 2–3 cycles, paired with symptom tracking and an experienced clinician's interpretation.",
  "Book a perimenopause evaluation — link in bio.",
  """8-slide carousel:
1. COVER serif: 'Perimenopause at 35? Yes.'
2-3. Why earlier in Indian women.
4-5. What it looks like.
6. What it isn't.
7. The right test.
8. CTA.""",
  S_PROG("perimenopause"))

# ===== WEEK 6 — Jun 24 to Jun 30 — Menopause & beyond =====
P(36, False, "reel", "education", "menopause-care", "menopause-myths",
  "Five things you've been told about menopause that aren't true.",
  "1. **'Menopause is the end of your sex life.'** Wrong. With proper care (vaginal oestrogen, lubrication, sometimes therapy) sex life often improves in post-menopause: more confidence, more time, no contraception.\n\n2. **'HRT causes cancer.'** Overblown. For most women under 60 within 10 years of menopause, benefits outweigh risks. The famous 2002 study has been heavily re-analysed.\n\n3. **'Just push through, it's natural.'** So is appendicitis. We treat that. Bothersome menopausal symptoms can and should be treated.\n\n4. **'Your bones are fine if you don't feel anything.'** Bone loss is silent until you fracture. DEXA scans matter.\n\n5. **'It's the end.'** It's roughly the midpoint, statistically. The next 30+ years deserve a real care plan.",
  "Save this. Send to your mom, your aunt, your older sister.",
  """45s reel. Each myth shown with bold strikethrough text, then the truth in calm cream. Voiceover firm. Cover: 'Menopause myths — debunked.'""",
  S_PROG("menopause-care"))

P(36, True, "carousel", "education", "menopause-care", "dexa-bone-health",
  "Why a DEXA scan at menopause might be the most important test of your life.",
  "Bone density peaks around age 30 and declines gradually until menopause — when it drops sharply due to oestrogen loss. In the first 5 years post-menopause, women can lose up to 20% of their bone mass.\n\nOsteoporosis is silent until a fracture happens. By then, you've lost a decade of options.\n\n**A DEXA scan tells you:**\n→ Where your bone density sits today (T-score).\n→ Whether you're at risk of fracture in the next 10 years (FRAX score).\n→ What dose of intervention (calcium, vit D, exercise, possibly meds) is right.\n\n**Who needs one:**\n→ All women at menopause (baseline) and every 2 years after.\n→ Earlier if family history of fracture, low body weight, smoking, certain medications.\n\n**What helps regardless of result:**\n→ Resistance training (the single most effective lifestyle intervention).\n→ Adequate protein.\n→ Vitamin D + calcium in target.\n→ HRT for many.",
  "Book a Menopause Care consult to plan your bone health — link in bio.",
  """8-slide carousel:
1. COVER serif: 'The most important test you've never had.'
2-3. Why bone loss accelerates at menopause.
4. DEXA explained.
5. T-score interpretation.
6. Who needs it / how often.
7. What helps (resistance training emphasis).
8. CTA.""",
  S_PROG("menopause-care"))

P(37, False, "reel", "education", "menopause-care", "vaginal-estrogen",
  "Vaginal oestrogen: the most underused, safest, life-changing treatment in menopause.",
  "Up to 70% of post-menopausal women experience genitourinary syndrome of menopause (GSM): vaginal dryness, painful sex, recurrent UTIs, urinary urgency, microscopic vaginal tissue thinning.\n\nFor most of these symptoms, the most effective treatment is *local* vaginal oestrogen — a cream, tablet, or ring used a few times a week.\n\nWhy it's underused:\n→ Women aren't told it exists.\n→ The word 'oestrogen' triggers blanket fear.\n→ Doctors assume it's the same risk profile as systemic HRT — it isn't.\n\nReality: vaginal oestrogen is safe for almost every woman, including most breast cancer survivors (after discussion with their oncologist). It does not significantly raise blood oestrogen levels.\n\nIf you're peeing too often, getting recurrent UTIs, can't enjoy sex, or feel raw — this is a 5-minute conversation that could change your life.",
  "Comment VE — we'll DM the local oestrogen guide.",
  """45s reel. Animated cross-section diagram showing vaginal tissue changes pre- and post-treatment. Voiceover candid and reassuring. Cover: 'Vaginal oestrogen: safer than you've been told.'""",
  S_PROG("menopause-care"))

P(38, False, "carousel", "education", "menopause-care", "heart-health-postmeno",
  "Cardiovascular disease becomes the #1 killer of women after menopause. Here's how to fight back.",
  "Up to menopause, oestrogen is protective: it keeps blood vessels flexible and cholesterol profiles favourable. After menopause, that protection drops sharply.\n\nWithin 10 years post-menopause, cardiovascular disease overtakes everything else as the leading cause of death in women.\n\n**The baseline workup we recommend:**\n→ Lipid panel (LDL, HDL, triglycerides, ApoB if available)\n→ Blood pressure (home cuff, monthly)\n→ Fasting glucose + HbA1c\n→ Lp(a) — the inherited risk marker most doctors don't check\n→ hs-CRP — inflammation marker\n\n**The non-negotiable lifestyle four:**\n1. **150 min/week moderate cardio** + 2 strength sessions.\n2. **Mediterranean-style eating** — protein, fibre, healthy fats.\n3. **Sleep** 7+ hours.\n4. **Stress regulation** — yoga, breathwork, therapy — pick what sticks.\n\n**Medications when warranted:** statins, anti-hypertensives, sometimes metformin, sometimes HRT (in the right window, it may be cardio-protective).",
  "Book a post-menopausal cardiovascular review — neuera.care.",
  """10-slide carousel:
1. COVER serif: 'Why menopause changes your heart risk.'
2-3. The oestrogen mechanism.
4-6. The labs that matter.
7-9. The lifestyle four.
10. CTA.""",
  S_PROG("menopause-care"))

P(39, False, "image", "testimonial", "menopause-care", "menopause-quote",
  "'Menopause is not the end. It's the beginning of taking yourself seriously.'",
  "Some patients come to us afraid that menopause means decline. Most leave understanding it as a beginning — of clearer priorities, deeper self-care, and the kind of medical attention they should have been getting all along.\n\nYou get one body. The post-menopausal decades can be your best ones, with the right plan.",
  "Book a Menopause Care consult — link in bio.",
  """Single image: deep forest green background, gold serif quote. Attribution: '— A neuera patient'. Neuera logo.""",
  S_PROG("menopause-care"))

P(39, True, "reel", "education", "menopause-care", "sexual-wellness-menopause",
  "Sexual wellness in menopause: it's a clinical conversation, not a personal failing.",
  "Decreased libido, vaginal dryness, painful sex, slower arousal — all extremely common in menopause. None of them inevitable. All of them treatable.\n\nWhat we offer (and what your gynaecologist should):\n\n→ **Vaginal oestrogen** for tissue health and lubrication.\n→ **Lubricants and moisturisers** — different products, different uses (lubricant during sex, moisturiser 3x/week).\n→ **Pelvic floor PT** — underused, transformative.\n→ **Testosterone** for libido — yes, women have testosterone; supplementation is appropriate in some cases.\n→ **Couples conversation** — sometimes the work is communication and creativity, not medication.\n→ **Therapy** — body image and identity shifts deserve real space.\n\nNo single fix. Most patients land on a layered plan. None of it requires shame.",
  "Comment WELLNESS — we'll DM the menopause sexual health guide.",
  """45s reel. Soft visuals: silk fabric textures, gentle light, no anatomical illustration. On-screen text walks the layered plan. Voiceover warm and direct. Cover: 'Menopause sexual wellness — there's a plan.'""",
  S_PROG("menopause-care"))

P(40, False, "carousel", "education", "menopause-care", "strength-training-meno",
  "Why strength training matters more in menopause than it ever has before.",
  "Post-menopause, you lose roughly 1% of muscle mass per year if you don't actively train. That's huge: less muscle = slower metabolism, weaker bones, worse insulin sensitivity, higher fall risk.\n\nResistance training reverses much of this. It's the single highest-leverage intervention in post-menopausal health.\n\n**Where to start:**\n→ 2 sessions/week minimum, 3 ideal.\n→ Compound movements: squat, hinge, press, pull, carry.\n→ Heavier weights, lower reps — not high-rep light dumbbells.\n→ Progress weights over time. 'Just enough to be challenging' = 6–10 reps with effort.\n→ If you've never lifted: a trainer for 6–8 sessions to nail form.\n\n**What it changes:**\n→ Bone density (load-bearing signal).\n→ Lean mass (metabolic protection).\n→ Insulin sensitivity (glucose handling).\n→ Balance and fall prevention.\n→ Confidence.\n\nIt's not optional. It's medicine.",
  "Save this. Forward to one woman you love.",
  """8-slide carousel:
1. COVER serif: 'Strength training: post-meno medicine.'
2. The 1%/year stat.
3-6. Where to start.
7. What it changes.
8. CTA.""",
  S_PROG("menopause-care"))

P(41, False, "reel", "education", "menopause-care", "surgical-menopause",
  "Surgical menopause is not the same as natural menopause. Here's what changes.",
  "If you've had your ovaries removed (oophorectomy) — whether alongside a hysterectomy, for cancer, for endometriosis, or for genetic risk — you've entered surgical menopause.\n\nThe difference from natural menopause: it happens instantly. Oestrogen drops to near-zero overnight, not gradually.\n\nThe consequences if untreated:\n→ Severe and sudden hot flushes, mood, sleep symptoms.\n→ Accelerated bone loss.\n→ Higher long-term cardiovascular and cognitive risk *if it happens before natural menopause age (~50)*.\n\n**The standard of care, when not contraindicated:** HRT until at least the average natural menopause age, often longer. This isn't 'optional' — for most surgical menopause patients under 45, it's strongly indicated for long-term health.\n\nIf you've had this surgery and weren't offered HRT — please get a second opinion.",
  "Comment SURG — we'll DM our surgical menopause checklist.",
  """45s reel. Calm clinical visual style. Animated graphic showing oestrogen curve: natural (slow decline) vs surgical (cliff drop). Voiceover. Cover: 'Surgical menopause needs a different plan.'""",
  S_PROG("menopause-care"))

P(42, False, "carousel", "program-spotlight", "menopause-care", "menopause-program-walkthrough",
  "The Menopause Care Program — 16 weeks of comfort, strength, and long-term health.",
  "**Weeks 1–2** — Full intake. Specialist OBGYN consult. Symptom and history mapping. Lab orders: hormone panel, lipid panel, fasting insulin, HbA1c, vitamin D, calcium, TSH, FSH (if peri/early meno), CBC, ferritin. DEXA scan order if not already done.\n\n**Weeks 3–4** — Results review. HRT/MHT evaluation with informed consent. Vaginal oestrogen consideration. Cardiovascular and bone risk assessment.\n\n**Weeks 5–10** — Plan execution. Care Navigator support via WhatsApp. Nutrition and movement coaching. Strength training programming. Sleep and mood interventions.\n\n**Weeks 11–14** — Review and titration. Lab repeat if relevant. Therapy adjustments.\n\n**Weeks 15–16** — Long-term plan. Annual follow-up cadence. What to monitor.\n\nYou walk away with: a diagnosis (or confirmation), a treatment plan, a movement plan, a Care Navigator who knows you, and a clear horizon.",
  "Begin the program — neuera.care.",
  """10-slide carousel:
1. COVER serif: 'Menopause Care — 16 weeks.'
2-9. Phase walk-through.
10. CTA.""",
  S_PROG("menopause-care"))

P(42, True, "reel", "app", "app", "voice-journal-meno",
  "Some days writing is too much. That's why we built voice journaling into Neuera.",
  "The hardest days are the ones you don't have words for.\n\nWe built voice notes into the Neuera app for exactly this. Tap, talk for 30 seconds, walk away. The next time you see your clinician, you have a record — not a 'I think I was struggling around mid-month' guess.\n\nVoice notes are stored privately on your device, encrypted, never shared. You decide if and when to bring them into a consult.\n\nIt's not therapy. It's not medical advice. It's a small honest tool for people whose bodies are doing a lot.",
  "Download Neuera — link in bio.",
  """30s reel. Phone mockup, finger holding down the voice-record button, waveform animation, fade to a soft cream interface with the recorded note appearing. Voiceover gentle. Cover: 'Some days, words come hard.'""",
  S_APP_AND)

# ===== WEEK 7 (partial) — Jul 1 to Jul 3 — Women's health check + close =====
P(43, False, "reel", "education", "womens-health-check", "know-your-numbers",
  "If you don't know these five numbers about your body, this is your sign.",
  "Five numbers we want every woman in India to know — and have current within the last year:\n\n1. **Resting blood pressure** — should be under 120/80.\n2. **HbA1c** — your average blood sugar; should be under 5.7%.\n3. **LDL cholesterol** — varies by risk, but most women want under 100 mg/dL.\n4. **Vitamin D** — over 30 ng/mL is the floor; 40–60 is target.\n5. **TSH** — your thyroid stimulating hormone; should be in your lab's reference range (usually 0.4–4.0).\n\nDon't know any of these? Book a baseline. It's the most underrated investment in your future self.",
  "Comment NUMBERS — we'll DM the full preventive panel checklist.",
  """45s reel. Each number = one frame with a big bold value and the marker name. Voiceover steady. Cover: 'Five numbers. Know them.'""",
  S_PROG("womens-health-check"))

P(44, False, "carousel", "program-spotlight", "womens-health-check", "annual-health-check",
  "The annual women's health check, in detail.",
  "A real annual workup goes beyond 'CBC and lipid panel'. Here's the full panel we recommend, organised by what each marker is doing for you.\n\n**Cardiometabolic**\n→ Fasting glucose, HbA1c, fasting insulin\n→ Full lipid panel + ApoB + Lp(a)\n→ Blood pressure (home cuff + clinic)\n\n**Hormonal**\n→ TSH, free T4, TPO antibodies\n→ FSH, LH (if peri/menopause)\n→ AMH (if relevant for fertility planning)\n→ Cortisol (if symptoms warrant)\n\n**Nutrient**\n→ Vitamin D, B12, ferritin, folate\n\n**Cancer screening**\n→ Pap smear / HPV (per age & guidelines)\n→ Breast exam + mammogram (per age)\n→ Skin check (annual)\n\n**Bone**\n→ DEXA scan (peri/post menopause baseline)\n\n**Other**\n→ Pelvic ultrasound (if symptoms warrant)\n→ Dental and eye check (often forgotten, often consequential)\n\nThis is the panel that catches things early. Most women have never had half of it run.",
  "Book a Women's Health Check — link in bio.",
  """10-slide carousel:
1. COVER serif: 'A real annual workup.'
2-8. Each panel group on its own slide.
9. The 'most women have never had half of this' callout.
10. CTA.""",
  S_PROG("womens-health-check"))

P(45, False, "reel", "education", "womens-health-check", "what-labs-mean",
  "Your labs say 'normal'. Here's why that's not always good news.",
  "Lab reference ranges are statistical — they describe the middle 95% of the population, sick or healthy. 'Normal' often means 'not catastrophically off'. It doesn't mean 'optimal'.\n\nThree examples:\n\n→ **Vitamin D 'normal' is >20 ng/mL.** Optimal is 40–60. Most Indian women sit at 12–18.\n\n→ **TSH 'normal' is 0.4–4.0.** Many experts say symptoms of subclinical hypothyroidism appear from 2.5 onward, especially in TTC and peri.\n\n→ **Ferritin 'normal' is >12 ng/mL.** For premenopausal women, energy and hair issues often resolve only above 50.\n\nA good clinician reads labs as a story, not a binary. If 'all normal' doesn't match how you feel — push for a clinician who reads optimally, not statistically.",
  "Save this. Bring it to your next appointment.",
  """45s reel. On-screen comparisons: 'normal range' vs 'optimal range' for each example. Voiceover clear and slightly frustrated on the patient's behalf. Cover: 'Normal isn't always good news.'""",
  S_PROG("womens-health-check"))

P(45, True, "image", "promo", "brand", "campaign-close",
  "45 days. 60 posts. One promise: you don't walk this alone.",
  "Thank you for following along.\n\nYou've heard us talk about PCOS, periods that hurt, fertility, perimenopause, menopause, the labs that matter, the app that helps you track. The point of all of it was this: you have options, you have a team, you don't have to do this alone.\n\nIf any of these 45 days made you think 'that's me' — book a consult.\nIf any of them made you think of a friend — send them the post.\n\nAnd if you've been quietly carrying something for years that this campaign finally gave a name to — we're here.",
  "Book a first consult — pay only after picking a slot. Link in bio.",
  """Single image: warm cream background, large serif: '45 days. 60 posts. One promise.' Sub: 'You don't walk this alone.' Sub-sub: 'neuera.care' with logo. Bottom: 'Book your first consult — pay after choosing a slot.'""",
  S_BRAND)

# ---- Sanity: 60 entries, correct format counts -------------------------------
assert len(POSTS) == 60, f"expected 60 posts, got {len(POSTS)}"
fmt_count = {}
for p in POSTS:
    fmt_count[p["format"]] = fmt_count.get(p["format"], 0) + 1
print(f"# posts: {len(POSTS)}  format counts: {fmt_count}", file=__import__('sys').stderr)

# ---- Build per-post data with computed time + ids ----------------------------
RECORDS = []
for idx, p in enumerate(POSTS, start=1):
    dt_ist = post_datetime_ist(p["day"], p["extra"], idx)
    dt_utc = to_utc_iso(dt_ist)
    off_min = offset_minutes_from_start(dt_ist)
    record = dict(p)
    record["num"] = idx
    record["date_ist"] = dt_ist.strftime("%Y-%m-%d")
    record["time_ist"] = dt_ist.strftime("%H:%M")
    record["scheduled_for_utc"] = dt_utc
    record["track_offset_minutes"] = off_min
    record["hashtags"] = hashtags_for(p["program"])
    RECORDS.append(record)

# ---- Write markdown files ----------------------------------------------------
def write_markdown(r):
    fname = f"{r['num']:03d}-{r['date_ist']}-{r['format']}-{r['slug']}.md"
    path = POSTS_DIR / fname
    sources_block = "\n".join(f"  - {s}" for s in r["sources"])
    fm = f"""---
post_number: {r['num']:03d}
date_ist: {r['date_ist']}
time_ist: "{r['time_ist']}"
scheduled_for_utc: "{r['scheduled_for_utc']}"
track_offset_minutes: {r['track_offset_minutes']}
format: {r['format']}
post_kind: {r['format']}
pillar: {r['pillar']}
program: {r['program']}
hook: "{r['hook'].replace('"','\\"')}"
cta: "{r['cta'].replace('"','\\"')}"
hashtags_count: {len(r['hashtags'].split())}
sources:
{sources_block}
---

## Caption

{r['hook']}

{r['body']}

**{r['cta']}**

{DISCLAIMER}

{r['hashtags']}

## Visual brief

{r['brief']}

## Production notes

- Disclaimer placement: caption (above hashtags) AND last-frame on-screen text: "Not medical advice • neuera.care".
- Reach-first hashtag strategy ({len(r['hashtags'].split())} tags) — see `../style-guide.md`.
- {"Reel rules: voiceover + b-roll + on-screen text only. No trend audio, no dance, no point-at-text." if r['format'] == 'reel' else "Carousel cover frame must have a text hook ≤80 chars." if r['format'] == 'carousel' else "Single image: brand-consistent palette, serif headline, clear focal point."}
- Compliance: no named medications without disclaimer; no before/after photography; no fear-mongering language.
"""
    path.write_text(fm)
    return fname

filenames = [write_markdown(r) for r in RECORDS]

# ---- Write style-guide.md ----------------------------------------------------
(ROOT / "style-guide.md").write_text("""# Style guide — neuera.care Instagram

## Voice
Warm, clinician-led, judgement-free, India-specific, evidence-based.
Empathy first, then evidence. Plain language; unpack jargon. Never
fear-mongering. Never miracle claims. Never before/after body shots.

## Reel rules
- **No trend audio, no dance, no point-at-text gimmicks.**
- Voiceover + b-roll + bold on-screen captions only. Doctor-led
  explainer where a presenter is available.
- Cover frame must carry a text hook (≤80 chars).
- Last frame: "Not medical advice • neuera.care".
- Captions baked in (Indian audience watches a lot with sound off).

## Carousel rules
- Slide 1 = the hook (large serif). Slide 1 sells the swipe.
- Slide N = a single CTA.
- 6–10 slides. Save-worthy density per slide.

## Image rules
- Quote-led or app-led. No stock-photo faces of patients.
- Brand palette: warm cream, terracotta, deep forest, deep maroon,
  navy + gold for menopause weeks.

## Disclaimer pattern
Caption (above hashtags): `_Disclaimer: This is educational content,
not medical advice. For personalised care, book a consultation at
neuera.care._`

On-screen last frame: `Not medical advice • neuera.care`

## CTA bank (rotate)
- "Book a consultation — link in bio"
- "Download Neuera — Play Store / App Store"
- "Comment {KEYWORD} for the {guide}"
- "Save this for your next cycle"
- "Send to a friend who needs to hear this"

## Hashtag strategy (reach prioritised, ~30/post)
- 5 brand/owned (#neueracare etc.)
- ~15 program-specific (rotates per post)
- ~10 community/broad (#womenshealthindia, #cycleawareness, etc.)
See `build.py` for the canonical bank.

## App vs clinic positioning
- **App** = daily companion (mood, period, voice notes). NOT medical
  advice. The App Store page itself says "wellness tool, not a medical
  device."
- **Programs** = clinical care. Specialist OBGYN-led.
- Posts must not blur the line.

## Doctor copy
- Use "our OBGYN specialists" — brand-neutral, multiple practitioners.
- No named individuals on the program pages, so don't invent them.
""")

# ---- Write README.md ---------------------------------------------------------
header = "# neuera.care Instagram — 45-day launch (60 posts)\n\nStart **Wed 2026-05-20** • End **Fri 2026-07-03** • 45 days • 60 posts.\n\nDaily post: **10:30 IST**. Extras: **20:00–21:30 IST** (randomised, deterministic per post_number).\n\n## Format mix\n\n| Format | Count |\n|---|---:|\n"
for f in ("reel", "carousel", "image"):
    header += f"| {f} | {fmt_count.get(f,0)} |\n"

table_header = "\n## Calendar (60 posts)\n\n| # | Date | Time | Format | Pillar | Program | Hook | File |\n|--:|---|---|---|---|---|---|---|\n"
rows = []
for r, fn in zip(RECORDS, filenames):
    hook = r['hook'].replace("|", "\\|")
    if len(hook) > 80: hook = hook[:77] + "…"
    rows.append(f"| {r['num']} | {r['date_ist']} | {r['time_ist']} | {r['format']} | {r['pillar']} | {r['program']} | {hook} | [`{fn}`](posts/{fn}) |")
readme_calendar = table_header + "\n".join(rows) + "\n"

weekly = """
## Weekly themes

| Week | Dates | Theme | Programs |
|--:|---|---|---|
| 1 | May 20 – May 26 | Your body is talking | brand + app + irregular-periods |
| 2 | May 27 – Jun 02 | PCOS week | pcos-management, ttc-pcos |
| 3 | Jun 03 – Jun 09 | Pain is not normal | period-pain, irregular-periods |
| 4 | Jun 10 – Jun 16 | Planning a baby | preconception-ttc, early-pregnancy |
| 5 | Jun 17 – Jun 23 | Perimenopause is real | perimenopause |
| 6 | Jun 24 – Jun 30 | Menopause & beyond | menopause-care + app |
| 7 (partial) | Jul 01 – Jul 03 | Know your numbers + close | womens-health-check + brand |
"""

(ROOT / "README.md").write_text(header + weekly + readme_calendar)

# ---- Generate seed.sql -------------------------------------------------------
TRACK_ID = uuidv7()
def sqlstr(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"
def sqlint(n) -> str:
    return str(int(n))

sql_lines = [
    "-- neuera.care Instagram 45-day launch — seed",
    "-- Apply via: bun x wrangler d1 execute smm --remote -c api/wrangler.local.toml --file track/neuera_insta/launch/seed.sql",
    "",
    "BEGIN TRANSACTION;",
    "",
    "-- 1. Track",
    f"INSERT INTO tracks (id, project_id, name, description, account_id, start_at, tz, created_by) " +
    f"VALUES ({sqlstr(TRACK_ID)}, {sqlstr(PROJECT_ID)}, {sqlstr(TRACK_NAME)}, {sqlstr(TRACK_DESC)}, NULL, {sqlstr(CAMPAIGN_START_UTC)}, {sqlstr(TRACK_TZ)}, {sqlstr(CREATED_BY)});",
    "",
    "-- 2. Drafts",
]
for r in RECORDS:
    draft_id = uuidv7()
    body_md = f"{r['hook']}\n\n{r['body']}\n\n**{r['cta']}**\n\n{DISCLAIMER}\n\n{r['hashtags']}"
    title = r['hook'][:160]
    platform_options = json.dumps({
        "postKind": r["format"],
        "shareToFeed": True,
        "seedSequence": r["num"],
        "seedPillar": r["pillar"],
        "seedProgram": r["program"],
        "seedVisualBrief": r["brief"],
    })
    sql_lines.append(
        f"INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) " +
        f"VALUES ({sqlstr(draft_id)}, {sqlstr(PROJECT_ID)}, {sqlstr(TRACK_ID)}, NULL, 'draft', {sqlstr(title)}, {sqlstr(body_md)}, 'markdown', {sqlstr(platform_options)}, {sqlint(r['track_offset_minutes'])}, {float(r['num'])}, {sqlstr(r['scheduled_for_utc'])}, {sqlstr(TRACK_TZ)}, {sqlstr(CREATED_BY)});"
    )

sql_lines += ["", "COMMIT;", ""]

(ROOT / "seed.sql").write_text("\n".join(sql_lines))

print(f"OK: {len(filenames)} markdown files + style-guide.md + README.md + seed.sql", file=__import__('sys').stderr)
print(f"TRACK_ID = {TRACK_ID}", file=__import__('sys').stderr)
