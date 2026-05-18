-- neuera.care Instagram 45-day launch — seed
-- Apply via: bun x wrangler d1 execute smm --remote -c api/wrangler.local.toml --file track/neuera_insta/launch/seed.sql

BEGIN TRANSACTION;

-- 1. Track
INSERT INTO tracks (id, project_id, name, description, account_id, start_at, tz, created_by) VALUES ('019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', 'Instagram 45-day launch', '60-post Instagram campaign across all 9 programs + brand + app, May 20 – Jul 3, 2026.', NULL, '2026-05-20T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');

-- 2. Drafts
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-791d-8933-6b355fabe4ac', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Your body has been talking. We finally built somewhere it gets heard.', 'Your body has been talking. We finally built somewhere it gets heard.

Hi — we''re neuera.

We''re a women''s health practice built around one stubborn idea: care should be specialist-led from day one, not after years of being dismissed.

If you''ve been told your symptoms are ''normal'', ''just stress'', or ''just part of being a woman'' — this feed is for you.

Over the next 45 days we''re walking through everything we treat: PCOS, periods that hurt, fertility, perimenopause, menopause, the whole arc. Honest, evidence-based, judgement-free.

Follow along. Bring a friend.

**Follow @neuera.care and turn on notifications — you''ll thank us in week 3.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #indianwomenshealth #femalehealth #telehealthindia #onlineconsultation #doctorconsultation #evidencebasedmedicine #patientcare #compassionatecare #specialistled #obgynindia #womenshealthclinic #digitalhealth #personalisedcare #telegynecology #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 1, "seedPillar": "founder", "seedProgram": "brand", "seedVisualBrief": "Voiceover (30s): ''Your body has been talking. Cramps that double you over. Periods that vanish for months. Hot flushes at 41. Acne at 38. Most of us were taught to push through. We were taught to wait it out. We were told it''s normal. We disagree. We''re neuera. Specialist-led women''s health, online. Follow along.''\nB-roll: warm slow-mo of a woman writing in a journal, a doctor on a video call, a steaming chai cup, a phone showing the Neuera app, sunlight through a window.\nOn-screen text: ''Your body has been talking.'' \u2192 ''You deserve to be heard.'' \u2192 ''neuera.care''\nCover frame: portrait shot, bold serif text ''Your body has been talking.''"}', 0, 1.0, '2026-05-20T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b68-8d77-2297e740f87c', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Your period is your fifth vital sign. Here''s why your doctor should treat it like one.', 'Your period is your fifth vital sign. Here''s why your doctor should treat it like one.

Temperature. Pulse. Breathing. Blood pressure. Period.

The American College of Obstetricians and Gynecologists has called the menstrual cycle a vital sign since 2015. A cycle that''s regular, predictable, and not debilitating is a signal that your endocrine, metabolic, and reproductive systems are talking to each other properly.

A cycle that''s missing, late, painful, or heavy is a signal that *something is off* — not a personality trait you have to live with.

The four most common red flags we evaluate: cycles shorter than 21 or longer than 35 days, periods missing for 3+ months, bleeding heavy enough to change protection hourly, pain that stops you from working.

None of these are ''just how your body is''. All of them deserve a doctor.

**Save this. Share it with the friend who''s been told her cycle ''is just like that''.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #irregularperiods #missedperiods #periodproblems #hormonalimbalance #amenorrhea #oligomenorrhea #menstrualhealth #cycleawareness #periodtalk #periodawareness #menstrualcyclehealth #hormonalhealth #periodcare #periodtracking #cyclehealth #womenshealth #womenshealthawareness #periodpositive #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 2, "seedPillar": "education", "seedProgram": "irregular-periods", "seedVisualBrief": "7-slide carousel:\n1. COVER \u2014 bold serif: ''Your period is your fifth vital sign.'' subtitle: ''Here''s why that matters.''\n2. ACOG citation card \u2014 ''Since 2015, ACOG has recognised the menstrual cycle as a vital sign.''\n3. The 4 vital signs visual \u2014 temp, pulse, breath, BP \u2014 then add: ''and your cycle''\n4. Red flag #1 \u2014 cycles <21 or >35 days\n5. Red flag #2 \u2014 missing 3+ months\n6. Red flag #3 \u2014 heavy bleeding / #4 \u2014 pain stopping work\n7. CTA \u2014 ''Get a clear answer. neuera.care \u2022 link in bio''"}', 1440, 2.0, '2026-05-21T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e23-bd23-af5cac64338f', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Five things about periods you were taught — that are wrong.', 'Five things about periods you were taught — that are wrong.

1. ''A 28-day cycle is normal, anything else isn''t.'' False. Normal is 21–35 days, and it varies through life.

2. ''Pain is just part of having a period.'' False. Pain that needs you to skip work, school, or life is not normal.

3. ''Skipping periods on birth control is dangerous.'' False. The ''period'' on the pill is a hormone withdrawal bleed, not a real period.

4. ''PCOS means you can''t get pregnant.'' False. Most people with PCOS *can* get pregnant — with the right care.

5. ''Irregular periods sort themselves out.'' Sometimes. Often they don''t. And the underlying cause is worth knowing.

What''s a ''normal'' you were taught that turned out to be wrong?

**Comment one below — we''ll feature them this week.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #irregularperiods #missedperiods #periodproblems #hormonalimbalance #amenorrhea #oligomenorrhea #menstrualhealth #cycleawareness #periodtalk #periodawareness #menstrualcyclehealth #hormonalhealth #periodcare #periodtracking #cyclehealth #womenshealth #womenshealthawareness #periodpositive #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 3, "seedPillar": "education", "seedProgram": "irregular-periods", "seedVisualBrief": "Voiceover-led reel (45s): one myth per scene, b-roll of the visual world that myth lives in (a calendar, a heating pad, a contraceptive pack, a TTC test stick, a worried friend''s face). On-screen text: ''MYTH:'' in red, then the truth in calm cream. Final frame: ''You were taught wrong. We''re here to retrain.'' Cover: ''Five period myths you need to unlearn.''"}', 2880, 3.0, '2026-05-22T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-75e9-8d2d-ebff0f273be1', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''I felt heard for the first time in 7 years.''', '''I felt heard for the first time in 7 years.''

Most of our patients have been to 3–5 doctors before finding us.

Not because the doctors before us were wrong — but because 15-minute appointments don''t work for hormones. Your story takes longer than that. Your labs take longer to interpret than that. Your treatment takes longer to titrate than that.

We built neuera the way we wished healthcare looked: long first consults, ongoing WhatsApp support with a real Care Navigator, and a clinician you actually keep seeing.

No more starting over.

**Book a first consult — you only pay after choosing a slot. Link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #indianwomenshealth #femalehealth #telehealthindia #onlineconsultation #doctorconsultation #evidencebasedmedicine #patientcare #compassionatecare #specialistled #obgynindia #womenshealthclinic #digitalhealth #personalisedcare #telegynecology #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 4, "seedPillar": "testimonial", "seedProgram": "brand", "seedVisualBrief": "Single image: warm, deeply saturated, gentle gradient background (soft peach to terracotta). Pull-quote in elegant serif: ''I felt heard for the first time in 7 years.'' Attribution: ''\u2014 A patient, age 32, PCOS''. Small neuera logo bottom-right. No stock photo of a face \u2014 quote-only."}', 3491, 4.0, '2026-05-22T15:11:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-75c1-91bf-933966ecb193', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Nine things we treat. One way to start.', 'Nine things we treat. One way to start.

From the first missed period to the last hot flush — we built nine clinical pathways to meet you wherever you are.

→ PCOS Management (12–16 weeks)
→ Trying to Conceive with PCOS (3–6 months)
→ Preconception & TTC (3–6 months)
→ Early Pregnancy Care (first trimester)
→ Irregular Periods & Hormone Evaluation (8–12 weeks)
→ Period Pain & Pelvic Pain Evaluation (8–12 weeks)
→ Perimenopause Program (12 weeks)
→ Menopause Care (16 weeks)
→ Women''s Health Check & Risk Assessment (4–6 weeks)

Each pathway includes a specialist OBGYN consult, the labs that actually matter for *your* situation, a personalised treatment plan, and ongoing WhatsApp support.

Which one is calling your name?

**Tap the link in bio. Pay only after picking a slot.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #indianwomenshealth #femalehealth #telehealthindia #onlineconsultation #doctorconsultation #evidencebasedmedicine #patientcare #compassionatecare #specialistled #obgynindia #womenshealthclinic #digitalhealth #personalisedcare #telegynecology #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 5, "seedPillar": "program-spotlight", "seedProgram": "brand", "seedVisualBrief": "10-slide carousel:\n1. COVER \u2014 ''Nine pathways. One trusted team.'' big bold serif.\n2. PCOS Management \u2014 duration, key symptoms it addresses.\n3. TTC with PCOS \u2014 same shape.\n4. Preconception & TTC.\n5. Early Pregnancy Care.\n6. Irregular Periods Evaluation.\n7. Period Pain Evaluation.\n8. Perimenopause Program.\n9. Menopause Care + Women''s Health Check (combined).\n10. CTA \u2014 ''Find your pathway \u2014 neuera.care''\nEach slide same template: program name (serif), duration chip, 3 bullet symptoms it treats, an arrow to next. Color palette: warm terracotta, cream, deep forest."}', 4320, 5.0, '2026-05-23T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7290-96ce-1e3bfc36f6a1', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'A 30-second daily check-in that turns ''I think something''s off'' into data your doctor can use.', 'A 30-second daily check-in that turns ''I think something''s off'' into data your doctor can use.

Meet the Neuera app — your daily companion between consults.

Daily mood + symptom check-ins. Period and cycle logging. Voice notes for the days writing feels like too much. Weekly insight summaries that turn 12 weeks of scattered feelings into a single clear picture for your clinician.

It''s the wellness side of neuera (not a medical device — we keep the clinical work where it belongs, in consult). But it''s the difference between walking into an appointment with ''I''ve been feeling off'' versus ''here''s exactly when, how often, and how bad''.

Free to download. Yours to own. Sign in with Apple or Google.

**Download on Play Store or App Store — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodtracker #moodtracking #journalingapp #voicejournal #wellnessapp #selfcareapp #mentalwellness #periodtrackingapp #cycletracker #femtech #healthapp #mindfulnessapp #dailyjournal #femtechindia #appsforwomen #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 6, "seedPillar": "app", "seedProgram": "app", "seedVisualBrief": "Single image: phone mockup centered, showing the daily check-in screen with mood emoji selector + symptom chips. Background: soft cream with subtle texture. Text above phone (serif): ''Meet Neuera.'' Text below phone (sans): ''Daily check-ins. Mood. Cycle. Voice notes. Yours, privately.'' App store and Play Store badges bottom corners. Small disclaimer footer: ''Wellness app \u2014 not a medical device.''"}', 5760, 6.0, '2026-05-24T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7c5b-a9e1-aa7e0b8e82fd', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If your cycle is doing any of these four things, it''s time for a doctor — not a Google search.', 'If your cycle is doing any of these four things, it''s time for a doctor — not a Google search.

Four red flags we want every woman to know:

1. Periods consistently shorter than 21 days or longer than 35.
2. Missing periods for 3+ months when you''re not pregnant or breastfeeding.
3. Bleeding heavy enough to soak through a pad or tampon every hour for 2+ hours.
4. Pain so bad you cancel plans, miss work, or can''t get out of bed.

Any one of these = book an evaluation. Not because something is definitely wrong — but because *finding out* is how you take your time back.

Our Irregular Periods & Hormone Evaluation runs in 8–12 weeks: full hormone + metabolic panel, OBGYN review, a clear answer, a real plan.

**Comment CYCLE — we''ll DM the evaluation outline.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #irregularperiods #missedperiods #periodproblems #hormonalimbalance #amenorrhea #oligomenorrhea #menstrualhealth #cycleawareness #periodtalk #periodawareness #menstrualcyclehealth #hormonalhealth #periodcare #periodtracking #cyclehealth #womenshealth #womenshealthawareness #periodpositive #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 7, "seedPillar": "education", "seedProgram": "irregular-periods", "seedVisualBrief": "45-second reel. Each red flag = one scene. Scene 1: a calendar getting circled obsessively. Scene 2: a calendar with empty months. Scene 3: a stack of pads. Scene 4: a hot water bottle on a stomach. On-screen text in big red sans: ''RED FLAG 1'' etc. Voiceover steady and serious, not alarming. Cover frame: a closeup of a hand holding a phone with a period tracker open, text ''Four red flags. Don''t scroll past.''"}', 7200, 7.0, '2026-05-25T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7f94-9a79-650616017ffd', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'What an irregular-periods evaluation actually looks like, week by week.', 'What an irregular-periods evaluation actually looks like, week by week.

If you''ve been told ''let''s just wait and see'', this is what waiting looks like with a plan instead.

Week 1 — Intake call, full medical and family history, symptom audit. We order labs.

Week 2–3 — Hormone panel (FSH, LH, AMH, testosterone, prolactin, TSH, fasting insulin), metabolic markers, and a baseline ultrasound if indicated.

Week 4 — Specialist OBGYN consult to review results together. PCOS? Thyroid? Hyperprolactinaemia? Functional hypothalamic amenorrhea? We narrow it down.

Week 5–8 — A personalised plan begins: medication if indicated, nutrition that fits your kitchen, and cycle tracking via WhatsApp.

Week 9–12 — Review, adjust, and decide what''s next.

The goal isn''t a perfect cycle next month. It''s a clear answer and a path forward.

**Book the evaluation — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #irregularperiods #missedperiods #periodproblems #hormonalimbalance #amenorrhea #oligomenorrhea #menstrualhealth #cycleawareness #periodtalk #periodawareness #menstrualcyclehealth #hormonalhealth #periodcare #periodtracking #cyclehealth #womenshealth #womenshealthawareness #periodpositive #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 8, "seedPillar": "program-spotlight", "seedProgram": "irregular-periods", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''What an evaluation actually looks like.''\n2. Week 1 \u2014 intake (icon: phone)\n3. Week 2-3 \u2014 labs (icon: vial)\n4. Week 4 \u2014 specialist consult (icon: stethoscope)\n5. Week 5-8 \u2014 personalised plan (icon: plan)\n6. Week 9-12 \u2014 review + adjust (icon: arrow loop)\n7. What you walk away with: a diagnosis, a plan, ongoing support.\n8. CTA \u2014 ''Stop waiting. Start understanding. neuera.care''"}', 7770, 8.0, '2026-05-25T14:30:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7457-98c4-2631d6847ff0', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'What you''ll see when you track your mood for 60 days alongside your cycle.', 'What you''ll see when you track your mood for 60 days alongside your cycle.

Here''s what most cycle apps don''t tell you: tracking mood next to cycle phases is one of the highest-leverage habits in women''s health.

Why? Because mood patterns cluster. PMDD (premenstrual dysphoric disorder) is dramatically underdiagnosed. Perimenopausal mood shifts are routinely mistaken for depression. Anxiety that follows ovulation is a real, treatable pattern.

But you can''t see the pattern in your head. You need 60+ days of data.

The Neuera app lets you log mood with one tap, voice-note the bad days when typing is too much, and see the weekly heatmap that turns ''I just feel off'' into ''I''m consistently low on day 24 of every cycle''.

That''s the kind of data a clinician can act on.

**Download Neuera (link in bio) and try it for one cycle.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodtracker #moodtracking #journalingapp #voicejournal #wellnessapp #selfcareapp #mentalwellness #periodtrackingapp #cycletracker #femtech #healthapp #mindfulnessapp #dailyjournal #femtechindia #appsforwomen #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 9, "seedPillar": "app", "seedProgram": "app", "seedVisualBrief": "30-second reel. Open with phone mockup, finger tapping mood emoji once. Cut to montage: voice note bubble appearing, calendar dots filling in, then the heatmap revealing the cyclic pattern. Voiceover: ''You can''t see a pattern from inside your head. You need data. Here''s what 60 days of one-tap tracking looks like.'' Cover frame: phone showing the mood heatmap with phrase ''Patterns you couldn''t see before.''"}', 8640, 9.0, '2026-05-26T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7902-82c6-4405ec148514', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Is this PCOS — or is it just stress?', 'Is this PCOS — or is it just stress?

Three years of irregular periods can look like both. Acne flaring on your chin and jawline can look like both. Sudden weight gain around the middle can look like both.

Here''s the difference:

Stress-driven menstrual changes usually resolve when the stress does. They don''t come with rising androgens (the hormones behind hair growth, acne, scalp thinning) and they don''t show up on an ovary ultrasound.

PCOS is a clinical diagnosis using the Rotterdam criteria: any two of three — irregular ovulation, signs of high androgens, polycystic ovaries on ultrasound.

It won''t disappear when life calms down. It needs a plan.

The only way to know which one you''re dealing with: hormone panel + consult. Not Google.

**Comment PCOS — we''ll DM the evaluation checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 10, "seedPillar": "education", "seedProgram": "pcos-management", "seedVisualBrief": "45s reel. Split-screen-style framing: left side ''STRESS'' with calm imagery (yoga mat, journal), right side ''PCOS'' with clinical imagery (lab vial, ultrasound). Voiceover walks through the Rotterdam criteria conversationally. On-screen overlay: ''2 out of 3 = PCOS.'' Cover: bold text ''Is it PCOS or just stress?'' with a question-mark visual."}', 10080, 10.0, '2026-05-27T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7bfb-a08f-098550c8b99a', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Six PCOS symptoms that show up differently in Indian women — and why we miss them.', 'Six PCOS symptoms that show up differently in Indian women — and why we miss them.

PCOS in Indian women is often underdiagnosed because the textbook presentation was built on a different population.

1. **Lean PCOS** — your BMI can be ''normal'' and you can still have PCOS. Indian women have a higher rate of lean PCOS than most populations studied.

2. **Insulin resistance without obesity** — that midsection weight + sugar crashes pattern can show up well before the scale moves.

3. **Hirsutism on the upper lip, chin, sideburns, and lower abdomen** — culturally normalised, clinically meaningful.

4. **Hair thinning at the crown** — often dismissed as ''genetic'' but worth investigating with hormone labs.

5. **Acanthosis nigricans** — dark velvety patches on the neck or armpits, a strong sign of insulin resistance.

6. **Persistent acne along the jawline** that doesn''t respond to skincare.

If you nodded at two or more of these — book an evaluation.

**Tap link in bio to book a PCOS evaluation.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 11, "seedPillar": "education", "seedProgram": "pcos-management", "seedVisualBrief": "8-slide carousel:\n1. COVER \u2014 ''PCOS looks different in Indian women.'' serif.\n2-7. One slide per symptom \u2014 illustration + 1-line description.\n8. CTA \u2014 ''Book a PCOS evaluation \u2014 neuera.care''\nVisual style: line illustrations on a deep forest green background with cream type."}', 11520, 11.0, '2026-05-28T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7859-b4df-1a3f5ca3a9e5', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Yes — thin women get PCOS too. And often go undiagnosed for years.', 'Yes — thin women get PCOS too. And often go undiagnosed for years.

If you''ve been told ''you can''t have PCOS, you''re not overweight'' — your doctor was wrong, and so was the textbook they learned from.

Lean PCOS is real. It affects up to 30–40% of PCOS patients globally, and Indian women appear to be over-represented in that group.

The diagnostic criteria for PCOS don''t include weight. They include irregular ovulation, signs of high androgens, and ovarian appearance on ultrasound. Any two of three.

The symptoms hit just as hard: fertility struggles, hair changes, mood, acne, insulin resistance you can''t see from the outside.

If your cycle is off and a doctor has dismissed PCOS because of your size — get a second opinion.

**Comment LEAN to get our lean-PCOS lab checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 12, "seedPillar": "education", "seedProgram": "pcos-management", "seedVisualBrief": "30s reel. Direct-to-camera-feel even without a presenter: bold close-up of a phone screen showing a ''cycle: 47 days'' calendar, slow zoom out to a thin-build patient looking at a doctor in a video call (stock + permission). Voiceover firm but warm. Final on-screen text: ''PCOS is not a body type.'' Cover: split image of two body silhouettes with the caption ''Both can have PCOS.''"}', 12154, 12.0, '2026-05-28T15:34:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e37-b96c-e52d838a7a6f', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The 12-week PCOS Management journey — week by week.', 'The 12-week PCOS Management journey — week by week.

What 12–16 weeks with our PCOS Management program actually looks like:

**Weeks 1–2** — Specialist OBGYN consult + baseline labs (androgen panel, fasting insulin, lipid panel, thyroid). We meet the whole you, not just the cycle.

**Weeks 3–4** — Results review, working diagnosis, and a personalised treatment blueprint combining medicine + nutrition + lifestyle.

**Weeks 5–8** — Implementation. WhatsApp-based Care Navigator support. Symptom and cycle tracking. Daily questions answered.

**Weeks 9–12** — Clinical review #2. Plan adjustments based on what''s working. Most patients see cycle regularity returning by this window.

**Weeks 13–16** — Maintenance and transition to long-term care, including fertility planning if relevant.

This isn''t a quick fix. PCOS is a lifelong condition. But 12 weeks is usually enough to feel meaningfully different.

**Start the program — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 13, "seedPillar": "program-spotlight", "seedProgram": "pcos-management", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''PCOS Management \u2014 12-week journey.''\n2-9. One slide per phase (weeks 1-2, 3-4, 5-8, 9-12, 13-16) + 3 ''what to expect'' slides addressing mindset / fears / common questions.\n10. CTA \u2014 ''Begin your journey \u2014 neuera.care''.\nVisual: timeline graphic running through every slide, week-marker at top."}', 12960, 13.0, '2026-05-29T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-707f-bd33-c771151774c8', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The single most underexplained thing about PCOS: insulin resistance.', 'The single most underexplained thing about PCOS: insulin resistance.

Most PCOS treatment plans don''t work long-term because they treat the symptoms (irregular cycles, acne) without addressing the engine driving them.

The engine, for most PCOS patients, is insulin resistance.

Here''s the chain:

Cells stop responding properly to insulin → pancreas pumps out more → high insulin signals the ovaries to make more testosterone → testosterone disrupts ovulation, drives acne, drives unwanted hair growth.

Which means: if you fix insulin signalling, you often fix the cascade.

How? It''s not ''eat less''. It''s eating in a way that keeps blood sugar steady — protein and fibre first, refined carbs last. Sometimes it''s metformin. Sometimes it''s inositol. Always individualised.

This is why a real PCOS evaluation includes a fasting insulin test — not just glucose.

**Save this. Send to anyone with a PCOS diagnosis who''s never had insulin tested.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 14, "seedPillar": "education", "seedProgram": "pcos-management", "seedVisualBrief": "45s reel. Whiteboard-style explainer (animated drawing): pancreas \u2192 insulin \u2192 cells \u2192 testosterone \u2192 ovary. Voiceover walks the chain. Cover frame: cartoon ovary with a thought bubble showing rising insulin levels and the text ''The hidden engine of PCOS.''"}', 14400, 14.0, '2026-05-30T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7373-a878-20ab9617d419', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''My first cycle in 11 months arrived in week 9.''', '''My first cycle in 11 months arrived in week 9.''

We don''t promise outcomes — every PCOS journey is different. But here''s what we can promise: a real diagnostic workup, a plan grounded in evidence, and a Care Navigator who actually picks up the phone.

The rest comes from you and your body, in your time.



**Book a first consult — pay after choosing a slot. Link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 15, "seedPillar": "testimonial", "seedProgram": "pcos-management", "seedVisualBrief": "Single quote-card: warm peach gradient background. Big serif: ''My first cycle in 11 months arrived in week 9.'' Attribution: ''\u2014 A neuera patient, PCOS Management program''. Neuera logo bottom-right."}', 15840, 15.0, '2026-05-31T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e80-a8fc-f99b44319d0b', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Trying to conceive with PCOS — what ''a real plan'' looks like.', 'Trying to conceive with PCOS — what ''a real plan'' looks like.

If you have PCOS and you''re trying to conceive, you''ve probably been told two contradictory things: ''just relax, it''ll happen'' and ''you''ll need IVF eventually''.

The truth, for most people, is in the middle.

Our TTC with PCOS pathway is 3–6 months long and stepwise:

**Month 1** — Confirm PCOS, confirm ovulation status, confirm tubal patency if indicated. Partner semen analysis review. Lifestyle and metabolic baseline.

**Months 2–4** — Targeted ovulation support. For many, this means timed-intercourse cycles with letrozole or clomiphene — both evidence-based, both first-line for PCOS-related anovulation.

**Months 5–6** — If unsuccessful, structured escalation: IUI consideration, or referral to a fertility centre for IVF when clinically appropriate.

There''s no shame in needing IVF. There''s also no shame in trying simpler options first.

**Book the TTC with PCOS pathway — neuera.care.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #ttcindia #ttcjourney #ttcwithpcos #fertilityindia #ovulationinduction #babydust #tryingtoconceive #pcosfertility #ovulationtracking #fertileWindow #preconception #fertilityjourney #ttcsupport #trytoconceive #ivf #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 16, "seedPillar": "program-spotlight", "seedProgram": "ttc-pcos", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''Trying to conceive with PCOS? A real plan exists.''\n2. The myth (''just relax'') vs the truth.\n3. Month 1 \u2014 confirm + baseline.\n4. Months 2-4 \u2014 ovulation support (letrozole, clomiphene).\n5. Months 5-6 \u2014 structured escalation.\n6. What we *don''t* do (no overnight miracles, no shame-based language).\n7. The Care Navigator role through the journey.\n8. CTA \u2014 ''Begin \u2014 neuera.care''."}', 16425, 16.0, '2026-05-31T14:45:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e52-a199-6ee26f9c271d', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'How to actually know if you''re ovulating — beyond an LH strip.', 'How to actually know if you''re ovulating — beyond an LH strip.

LH strips are useful, but they''re a starting point — not the full story. Especially in PCOS, where high baseline LH can give false positives.

The four signals that, together, actually confirm ovulation:

1. **Cervical mucus** turning egg-white-stretchy mid-cycle.
2. **Basal body temperature** rising 0.3–0.5°C after ovulation and staying up for 10+ days.
3. **Mid-luteal progesterone** lab test (around day 21 of a 28-day cycle) showing >5 ng/mL.
4. **Ultrasound follicle tracking** — the gold standard when stakes are high.

No single one of these is enough on its own — especially LH. For PCOS specifically, mid-luteal progesterone is the cleanest answer.

If you''re 6+ months into trying without success, this is the conversation to have with a specialist.

**Comment OVULATE — we''ll DM the at-home tracking template.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #ttcindia #ttcjourney #ttcwithpcos #fertilityindia #ovulationinduction #babydust #tryingtoconceive #pcosfertility #ovulationtracking #fertileWindow #preconception #fertilityjourney #ttcsupport #trytoconceive #ivf #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 17, "seedPillar": "education", "seedProgram": "ttc-pcos", "seedVisualBrief": "45s reel. Each signal = one scene. Cervical mucus visualised by a textured stretch (silicone slime, no anatomical), BBT shown on a phone temperature chart, progesterone shown as a vial label, ultrasound follicle shown as a circle pulsing. On-screen captions in cream serif. Cover frame: ''LH strips are not enough.''"}', 17280, 17.0, '2026-06-01T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b42-9c10-42845cafdafb', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Six PCOS ''diet rules'' that don''t fit an Indian kitchen — and what to do instead.', 'Six PCOS ''diet rules'' that don''t fit an Indian kitchen — and what to do instead.

Most PCOS diet advice on the internet is built around Mediterranean or Western plates. It doesn''t survive contact with dal-chawal.

Here''s how we actually counsel patients:

**Myth 1: Avoid all rice.** Reality: white rice + dal + sabzi is fine if you front-load protein and fibre. Add curd. Order matters more than elimination.

**Myth 2: No fruit.** Reality: whole fruit is fine. Juice is not.

**Myth 3: Roti is the enemy.** Reality: 1–2 rotis with vegetables and protein is balanced. The problem is 4 rotis with potato sabzi.

**Myth 4: You must do keto.** Reality: extreme low-carb is unsustainable in Indian households and not necessary for most.

**Myth 5: Avoid dairy.** Reality: paneer, curd, and milk are fine for most. A small subset benefits from reducing — it''s individual.

**Myth 6: Skip dinner / intermittent fast aggressively.** Reality: irregular eating worsens insulin resistance over time.

**Save this for the next person who says ''cut everything white''.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #pcos #pcosindia #pcosawareness #pcoswarrior #pcoscommunity #pcoslife #pcosdiet #insulinresistance #androgens #hormonalacne #irregularperiods #ovarianhealth #hormonebalance #polycysticovarysyndrome #pcoscare #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 18, "seedPillar": "education", "seedProgram": "pcos-management", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''PCOS diet myths that don''t survive an Indian kitchen.''\n2-7. One myth per slide, beautifully shot Indian food in the background (thali, idli, paneer, dal-chawal). Myth in red strikethrough, reality in cream.\n8. CTA \u2014 ''Get a personalised PCOS nutrition plan \u2014 neuera.care''"}', 18720, 18.0, '2026-06-02T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7dac-b13f-1c4f48369d25', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If your period pain stops you from working, it''s not normal. It''s a symptom.', 'If your period pain stops you from working, it''s not normal. It''s a symptom.

We''ve heard every version of this:

''It''s been like this since I was 14.'' ''My mom had it too.'' ''The doctor said I''d grow out of it.'' ''It''s just because I''m not married yet.''

None of these are answers. They''re deflections.

Disabling period pain — pain that stops you from working, sleeping, or eating — is a symptom. The most common causes we evaluate are endometriosis, adenomyosis, and uterine fibroids. All three can be diagnosed and treated.

You are not broken. You are not exaggerating. You don''t have a low pain tolerance.

You have a symptom. Symptoms have causes. Causes have treatments.

**Book a Period Pain Evaluation — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 19, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "30s reel. Open with a closeup of a hand gripping a hot water bottle, slow pan up to a woman''s face at her laptop, brow furrowed. Voiceover overlays the common excuses. Cuts get sharper. Final scene: she closes the laptop and picks up her phone to call. On-screen text: ''Pain is not normal.'' Cover frame: serif text on a deep maroon background."}', 20160, 19.0, '2026-06-03T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-70e3-8142-755f38a5f1e9', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Eight signs of pelvic pain you should never normalise.', 'Eight signs of pelvic pain you should never normalise.

Most women have been taught to under-report pain. We want to retrain that.

These are the eight signs we listen for in a Period Pain & Pelvic Pain Evaluation:

1. Pain that needs more than 1–2 doses of OTC painkillers per cycle.
2. Pain that radiates to the lower back or down the legs.
3. Painful bowel movements during your period.
4. Painful urination during your period.
5. Pain during sex (deep, internal — not entry).
6. Pain outside of your period, mid-cycle or randomly.
7. Heavy bleeding paired with severe cramping.
8. Pain so bad you''ve vomited or fainted.

Any one of these = book an evaluation. Three or more = take it seriously now.

**Save this. Share it. Especially with the teenager in your family who''s been told to ''tough it out''.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 20, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''Eight signs you should never normalise.''\n2-9. One sign per slide, line illustration + brief explanation.\n10. CTA \u2014 ''Get evaluated \u2014 neuera.care''.\nVisual: warm cream background, deep maroon accents."}', 20754, 20.0, '2026-06-03T14:54:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7327-b7da-87ed0cffece6', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Endometriosis affects 1 in 10 women. The average time to diagnosis is 7–9 years.', 'Endometriosis affects 1 in 10 women. The average time to diagnosis is 7–9 years.

Endometriosis is when tissue similar to the uterine lining grows outside the uterus — on ovaries, fallopian tubes, the pelvic wall, sometimes further.

It bleeds with every cycle. With nowhere to go, it inflames surrounding tissue. The result: severe cramps, pain with sex, painful bowel movements, fatigue, and for many, infertility.

The diagnostic gap exists because endometriosis is invisible on standard ultrasound and is gold-standard-diagnosed via laparoscopy.

But you don''t need a laparoscopy to start treatment. A specialist OBGYN can build a strong clinical suspicion from your history, examine you, and offer evidence-based first-line treatment (hormonal suppression, pelvic floor PT, pain management) while ruling out other causes.

Don''t wait 7 years for an answer.

**Comment ENDO — we''ll DM the symptom journal template.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 21, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "45s reel. Animated explainer: simple anatomical line drawing of uterus + ovaries, then the same with endometrial deposits marked in red. Voiceover walks through the cycle of inflammation. On-screen: ''Average time to diagnosis: 7-9 years.'' Cover frame: serif text ''You don''t have 9 years.''"}', 21600, 21.0, '2026-06-04T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-79f5-a640-ff9949202f86', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'What a real Period Pain Evaluation includes.', 'What a real Period Pain Evaluation includes.

If you''ve ever been told ''your scan is normal'' and sent home with painkillers — this is for you.

A standard pelvic ultrasound misses endometriosis, often misses adenomyosis, and only catches large fibroids. A *real* evaluation goes further.

Our Period Pain & Pelvic Pain Evaluation, in 8–12 weeks:

→ Detailed symptom mapping (when, where, how, with what triggers)
→ Targeted physical examination
→ Transvaginal ultrasound with a specialist sonographer
→ MRI if adenomyosis or deep endometriosis is suspected
→ Screening labs to rule out other causes
→ Specialist OBGYN review and an evidence-based plan: medication, pelvic floor PT, surgical referral when indicated

The goal: a name for what''s happening, and a plan that''s not ''take ibuprofen and try again next month''.

**Book the evaluation — neuera.care, link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 22, "seedPillar": "program-spotlight", "seedProgram": "period-pain", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''A real evaluation. Not just a scan.''\n2. Why ''your scan is normal'' is often wrong.\n3. Symptom mapping.\n4. Specialist sonography (vs general ultrasound).\n5. When MRI is the right call.\n6. Screening labs.\n7. Treatment options across medication, PT, surgery.\n8. CTA \u2014 ''Get evaluated \u2014 neuera.care''."}', 23040, 22.0, '2026-06-05T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-70fb-828c-828dda3b7493', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''I waited 11 years to be told my pain had a name.''', '''I waited 11 years to be told my pain had a name.''

Endometriosis. Adenomyosis. Fibroids. PMDD. Vulvodynia. Pelvic floor dysfunction.

These conditions don''t show up on a routine ultrasound. They show up when someone *listens* — and then runs the right tests.

That''s the job we signed up for.

**Book a Period Pain Evaluation — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 23, "seedPillar": "testimonial", "seedProgram": "period-pain", "seedVisualBrief": "Single image: deep maroon background with a long quote-mark graphic. Serif: ''I waited 11 years to be told my pain had a name.'' Attribution: ''\u2014 A neuera patient, age 28''. Bottom corner: ''Period Pain Evaluation \u2022 neuera.care''."}', 24480, 23.0, '2026-06-06T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-729e-868b-a0fb93f69ea1', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Uterine fibroids: more common than you think, and often quietly disruptive.', 'Uterine fibroids: more common than you think, and often quietly disruptive.

Uterine fibroids are benign growths in or on the uterus. Up to 70% of women will have at least one by age 50 — many never know.

But when fibroids cause symptoms, they really cause symptoms: heavy bleeding that ruins your week, pelvic pressure, frequent urination, low back pain, fertility complications.

The good news: fibroids are highly treatable. Watchful waiting works for small asymptomatic ones. For symptomatic ones, options range from hormonal medication to uterine artery embolisation to myomectomy (preserving fertility) to hysterectomy in select cases.

The right choice depends on your fibroids, your symptoms, your fertility plans, and what *you* want — not what someone else decides for you.

**Comment FIBROID for our fibroid options decision guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 24, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "30s reel. Animated uterus showing fibroid locations (submucosal, intramural, subserosal). Voiceover walks through treatment ladder. Final on-screen: ''Fibroids are treatable. You have options.'' Cover: serif text ''Fibroids: 1 in 2 women. Almost no one talks about them.''"}', 25077, 24.0, '2026-06-06T14:57:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-76f1-a64c-1fc76b983716', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'When should you actually see a doctor about period pain? Here''s the threshold.', 'When should you actually see a doctor about period pain? Here''s the threshold.

We get this question constantly. Here''s the simplest framework:

**See a doctor if:**
→ You miss 1+ days of work or school per cycle due to pain.
→ Painkillers stopped working as well as they used to.
→ Pain is increasing year on year.
→ You experience pain during sex or bowel movements during periods.
→ Bleeding is heavier than ''normal'' for you, or you pass clots larger than a 10-rupee coin.
→ Pain wakes you from sleep.
→ You''re considering pregnancy or struggling to conceive.
→ You''ve ever been dismissed and the pain is still there.

Any one of these = it''s time.

And if you''re a teenager reading this: this list applies to you too. Especially you.

**Tag a friend who needs to see this. Save it for yourself.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 25, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''When should you see a doctor about period pain?''\n2-7. One trigger per slide, illustration + 1 line.\n8. CTA \u2014 ''Book an evaluation \u2014 neuera.care''."}', 25920, 25.0, '2026-06-07T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e48-90d5-8ec66cf0a2b7', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If you''re soaking a pad every hour for two hours in a row — that''s not heavy. That''s an emergency-ish.', 'If you''re soaking a pad every hour for two hours in a row — that''s not heavy. That''s an emergency-ish.

There''s no glory in surviving a brutal period. Heavy menstrual bleeding (medically called menorrhagia) has clear thresholds:

→ Soaking a regular pad or tampon every hour for 2+ consecutive hours
→ Bleeding lasting more than 7 days
→ Passing clots larger than a 10-rupee coin
→ Bleeding so heavy you wake up to change at night
→ Symptoms of anaemia: fatigue, breathlessness on stairs, looking pale, feeling dizzy when standing

Common causes: fibroids, adenomyosis, hormonal imbalance, bleeding disorders, thyroid issues.

All diagnosable. All treatable. None of which require you to white-knuckle your way through.

Get evaluated. Get your iron checked. Get your life back.

**Comment FLOW — we''ll DM the heavy-bleeding workup checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #irregularperiods #missedperiods #periodproblems #hormonalimbalance #amenorrhea #oligomenorrhea #menstrualhealth #cycleawareness #periodtalk #periodawareness #menstrualcyclehealth #hormonalhealth #periodcare #periodtracking #cyclehealth #womenshealth #womenshealthawareness #periodpositive #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 26, "seedPillar": "education", "seedProgram": "irregular-periods", "seedVisualBrief": "30s reel. Sharp cuts: a stack of pads, a clock at 2am, a pale face in a mirror, a phone with a Google search ''is this much bleeding normal''. Voiceover blunt and caring. Cover: serif text ''Heavy is a symptom. Not a personality trait.''"}', 27360, 26.0, '2026-06-08T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-77c3-8ab9-792ba32a0662', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'How to track period pain in a way that actually helps your doctor.', 'How to track period pain in a way that actually helps your doctor.

If you''ve ever walked into an appointment and forgotten how bad last month''s pain was — this carousel is for you.

What to track, daily, for at least one full cycle:

1. **Pain level (0–10)** — at your worst moment that day.
2. **Location** — where exactly. Lower back, deep pelvis, side, abdomen.
3. **Duration** — hours of disabling pain vs hours of dull ache.
4. **Painkillers used** — what, when, how many, did it help.
5. **Disruption** — did you cancel anything? Miss work?
6. **Bleeding flow** — light/medium/heavy/flooding.
7. **Symptoms paired with pain** — bowel changes, urinary urgency, pain during sex.
8. **Mood and sleep** — anxiety spikes, energy crashes, insomnia.

The Neuera app makes this a 30-second daily check-in instead of a chore. Bring 60 days of this to your consult — you''ll get a fundamentally better evaluation.

**Download Neuera (link in bio) and start tracking today.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodtracker #moodtracking #journalingapp #voicejournal #wellnessapp #selfcareapp #mentalwellness #periodtrackingapp #cycletracker #femtech #healthapp #mindfulnessapp #dailyjournal #femtechindia #appsforwomen #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 27, "seedPillar": "app", "seedProgram": "app", "seedVisualBrief": "9-slide carousel:\n1. COVER serif: ''Track period pain like a clinician would.''\n2-9. One field per slide with example screenshots from the app."}', 28800, 27.0, '2026-06-09T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-789e-b10f-b5ed075e99c6', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If painkillers are your only plan for period pain — there are five other tools your doctor should be discussing.', 'If painkillers are your only plan for period pain — there are five other tools your doctor should be discussing.

Painkillers (NSAIDs like mefenamic acid, naproxen, ibuprofen) are first-line for period pain. They work. But they''re not the whole toolkit.

Other evidence-based options, depending on cause:

1. **Combined hormonal contraception** — suppresses ovulation and lightens periods. Game-changing for many.
2. **Hormonal IUD (Mirena)** — reduces flow by 70–90%, often within months.
3. **Pelvic floor physiotherapy** — wildly underused, often missing in standard plans, especially for chronic pelvic pain.
4. **Targeted treatments for the underlying condition** — surgery for fibroids, hormonal suppression or surgery for endometriosis.
5. **TENS units, heat therapy, magnesium** — adjuncts that genuinely help when stacked with the above.

If the only thing on your prescription is ''take painkillers and let me know if it''s worse'' — get a second opinion.

**Comment OPTIONS to get the full decision guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodpainisnotnormal #endometriosis #endowarrior #adenomyosis #fibroids #pelvicpain #periodpain #endoindia #endometriosisawareness #menstrualpain #dysmenorrhea #chronicpelvicpain #endometriosissupport #painfulperiods #endoawareness #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 28, "seedPillar": "education", "seedProgram": "period-pain", "seedVisualBrief": "45s reel. Each tool = one scene with a quick visual: pill bottle, IUD diagram, pelvic floor PT cue (foam roller), surgery icon, TENS unit. Voiceover firm. Cover: ''Painkillers shouldn''t be the whole plan.''"}', 29423, 28.0, '2026-06-09T15:23:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-75db-9f93-33541892e1ab', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Most people have the fertile window wrong. Here''s the actual math.', 'Most people have the fertile window wrong. Here''s the actual math.

The fertile window is the 5 days *before* ovulation plus the day of ovulation itself. Six days total. That''s it.

Key points most people miss:

→ Sperm survives in the female reproductive tract for up to 5 days. The egg only lives 12–24 hours.
→ Conception is *most* likely 1–2 days *before* ovulation — not on ovulation day.
→ Day 14 isn''t universal. People with 28-day cycles ovulate around day 14. People with 35-day cycles ovulate around day 21.
→ LH surge happens 24–36 hours before ovulation. That''s why LH strips are useful, but you''ve already entered the fertile window when one turns positive.

If you''re trying to conceive: time intercourse *every other day* across the fertile window, not ''on ovulation day''.

**Comment WINDOW for our fertile-window cheat sheet.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 29, "seedPillar": "education", "seedProgram": "preconception-ttc", "seedVisualBrief": "45s reel. Calendar visual builds out, marking ovulation day, then expanding backward 5 days. Sperm and egg lifespan visualised with simple icons. Voiceover walks the math. Cover: ''You have 6 days. Make them count.''"}', 30240, 29.0, '2026-06-10T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7ecc-805a-e7963224e4ad', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The preconception checklist no one handed you.', 'The preconception checklist no one handed you.

Three to six months *before* you start trying — these are the things to put in place.

**Labs:**
→ Hormones (FSH, LH, AMH, thyroid, prolactin)
→ Metabolic (fasting glucose, HbA1c, lipid panel)
→ Nutrient (B12, ferritin, vitamin D, folate)
→ Infectious screening (Rubella, Hep B, Hep C, HIV, syphilis)

**Lifestyle:**
→ Start folic acid 400–800 mcg/day, at least 1 month before trying
→ Bring HbA1c into target range if elevated
→ Vitamin D in optimal range
→ Alcohol minimised; smoking stopped

**Care:**
→ Update vaccines (especially MMR and varicella — these are contraindicated *during* pregnancy)
→ Review every medication you take with a clinician
→ Dental check-up (gum health affects pregnancy outcomes)
→ Partner labs (semen analysis)

This isn''t paranoia. It''s the difference between a clean baseline and ''we''ll figure it out when it happens''.

**Book the Preconception & TTC program — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 30, "seedPillar": "program-spotlight", "seedProgram": "preconception-ttc", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''The preconception checklist no one handed you.''\n2-9. Grouped slides: labs, lifestyle, vaccines, partner.\n10. CTA \u2014 ''Get the full workup \u2014 neuera.care''."}', 31680, 30.0, '2026-06-11T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b21-b8b8-b3968052da06', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If you want to take folic acid right — start *before* you try to conceive.', 'If you want to take folic acid right — start *before* you try to conceive.

Folic acid prevents neural tube defects (spina bifida, anencephaly). It works because it''s available in the bloodstream *when the neural tube is forming* — which happens in weeks 3–4 of pregnancy.

Most women find out they''re pregnant in weeks 4–6. By then, the critical window is closing.

So the WHO and ACOG both recommend: **400–800 mcg of folic acid daily, starting at least 1 month before you stop contraception.**

If you have a history of neural tube defect or you''re on certain medications (some anti-epileptics, methotrexate), your dose may need to be 4 mg/day — that''s 5–10× the standard. Discuss with a clinician.

A prenatal multivitamin is great, but check the folate content. Many fall short.

**Save this. Share with anyone planning to try in the next year.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 31, "seedPillar": "education", "seedProgram": "preconception-ttc", "seedVisualBrief": "30s reel. Calendar zoom-in: weeks 3-4 of pregnancy highlighted, then arrow back to ''1 month before trying''. Visual of folic acid pill bottle. Final on-screen: ''The window opens before you know.'' Cover: ''400 mcg. Every day. Starts before pregnancy.''"}', 33120, 31.0, '2026-06-12T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-78de-867f-5b98dc4cf55c', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'What every preconception lab panel should include — and why.', 'What every preconception lab panel should include — and why.

If your doctor only ordered a thyroid test and called it a workup — this is for you.

Here''s the panel we run and *why* each marker matters:

**Thyroid (TSH, free T4)** — Even subclinical hypothyroidism raises miscarriage risk.

**Prolactin** — Elevated prolactin disrupts ovulation.

**FSH, LH, AMH** — Ovarian reserve and ovulation pattern. AMH especially in your mid-30s and beyond.

**Fasting insulin + HbA1c** — Insulin resistance and pre-diabetes affect both conception and pregnancy outcomes. Diabetes during pregnancy (gestational or pre-existing) is high-stakes.

**Vitamin D, B12, ferritin** — Deficiencies are common in Indian women and affect implantation and early pregnancy.

**Rubella immunity** — If non-immune, vaccinate now (you can''t during pregnancy).

**Hep B / Hep C / HIV / syphilis** — Routine, important.

**Semen analysis (partner)** — 40–50% of fertility issues involve the male partner. Skipping this is medically negligent.

**Book a preconception lab review — neuera.care.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 32, "seedPillar": "education", "seedProgram": "preconception-ttc", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''The labs that actually matter before you try.''\n2-9. One marker (or grouping) per slide with a 1-line ''why''.\n10. CTA."}', 33695, 32.0, '2026-06-12T14:35:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-711f-a81f-66a4a17503ff', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''Fertility is not a women''s issue. It''s a couple''s issue.''', '''Fertility is not a women''s issue. It''s a couple''s issue.''

40–50% of fertility challenges involve the male partner. Sometimes it''s the only factor. Always worth testing.

Semen analysis is non-invasive, inexpensive, and gives an enormous amount of information about timing and pathways. Skipping it is one of the most common preconception mistakes we see.

Bring your partner. Run the analysis. Move forward together.

**Book a couple''s preconception consult — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 33, "seedPillar": "testimonial", "seedProgram": "preconception-ttc", "seedVisualBrief": "Single image: warm cream background, two hands (no specific gender styling) holding the same lab report. Serif quote: ''Fertility is not a women''s issue. It''s a couple''s issue.'' Attribution: ''neuera.care''. No stock-couple clich\u00e9."}', 34560, 33.0, '2026-06-13T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7288-8711-d0b20aa6a521', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'First trimester: what to bring to your specialist, and what to call about immediately.', 'First trimester: what to bring to your specialist, and what to call about immediately.

The first 12 weeks of pregnancy are the most important — and often the least supported.

**What to bring to your first specialist consult:**
→ Last menstrual period date
→ All current medications and supplements
→ Personal medical history (chronic conditions, surgeries)
→ Family history (genetic conditions, recurrent miscarriage, diabetes, hypertension)
→ Partner''s medical history if known

**Call your doctor *today* if you have:**
→ Heavy bleeding (more than spotting)
→ Severe one-sided abdominal pain
→ Shoulder-tip pain (could indicate ectopic)
→ Vomiting so frequent you can''t keep fluids down (hyperemesis gravidarum)
→ Sudden cessation of pregnancy symptoms paired with bleeding
→ Fever above 38°C

First-trimester care isn''t ''come back at 12 weeks''. It''s active monitoring.

**Book Early Pregnancy Care — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #earlypregnancy #firsttrimester #pregnancyindia #pregnancycare #pregnancyjourney #newmomtobe #pregnant #indianpregnancy #morningSickness #pregnancytips #earlypregnancycare #obgyncare #pregnancysupport #expectingmom #babybump #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 34, "seedPillar": "program-spotlight", "seedProgram": "early-pregnancy", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''First trimester care matters most.''\n2-5. What to bring slides.\n6-9. Call-immediately red flag slides.\n10. CTA."}', 36000, 34.0, '2026-06-14T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7bb4-9978-8f0562f070dd', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Five preconception supplements you don''t need — and the three you actually do.', 'Five preconception supplements you don''t need — and the three you actually do.

The fertility supplement industry is enormous. Most of it is unproven. Some of it is harmful.

**Skip (or be skeptical of):**
→ DHEA — only useful in specific diminished-ovarian-reserve cases under specialist guidance.
→ Maca root — pleasant tea, weak evidence.
→ Royal jelly — allergy risk, no robust evidence.
→ Generic ''fertility blends'' — usually expensive folic acid + things you don''t need.
→ Vitex (chasteberry) — sometimes pushed for ovulation; consult first, real interactions exist.

**Actually evidence-based:**
→ **Folic acid** 400–800 mcg/day (or methylfolate if MTHFR variant).
→ **Vitamin D** if deficient — most Indians are.
→ **Iron + B12** if deficient — common in vegetarian diets.

Additional consideration: inositol (myo + d-chiro at 40:1 ratio) has decent evidence for PCOS-related ovulation. Not a ''general'' fertility supplement.

**Comment SUPP — we''ll DM the full supplement guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preconception #tryingforababy #fertilityjourney #ttcindia #babydust #ovulationtracking #fertileWindow #preconceptionhealth #preconceptioncare #trytoconceive #ttcsisters #fertilityawareness #pregnancyprep #preconceptionplanning #futureparents #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 35, "seedPillar": "education", "seedProgram": "preconception-ttc", "seedVisualBrief": "45s reel. Each supplement = one frame. Skip list shown with strikethrough; keep list shown clean. Voiceover candid, almost frustrated at industry hype. Cover: ''Most fertility supplements are noise.''"}', 37440, 35.0, '2026-06-15T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7225-9ab3-3c2feaef6cc4', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Day 14? Day 21? Your cycle, on your phone, finally legible.', 'Day 14? Day 21? Your cycle, on your phone, finally legible.

Cycle apps have existed for years. Most of them are noisy: ads, paywalls, fertility predictions that are wrong half the time.

Neuera is different. We built it so the data we collect is the data your doctor will actually find useful: real flow, real pain, real symptoms — not generic emoji guesses.

And because it lives next to your mood, sleep, and voice notes, you walk into your consult with a real picture of your last 60 days. Not ''I think it started around the 8th''.

**Download Neuera — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodtracker #moodtracking #journalingapp #voicejournal #wellnessapp #selfcareapp #mentalwellness #periodtrackingapp #cycletracker #femtech #healthapp #mindfulnessapp #dailyjournal #femtechindia #appsforwomen #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 36, "seedPillar": "app", "seedProgram": "app", "seedVisualBrief": "Single image: phone mockup showing the cycle calendar screen, day-by-day flow and symptom marks visible. Cream background with subtle warm gradient. Serif: ''Your cycle, finally legible.'' Sub: ''Neuera \u2014 daily check-ins for the body that''s been talking.'' Bottom: Play Store + App Store badges."}', 38039, 36.0, '2026-06-15T14:59:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-791b-b1fe-b576327ff378', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Early Pregnancy Care — what specialist support actually looks like in the first 12 weeks.', 'Early Pregnancy Care — what specialist support actually looks like in the first 12 weeks.

Most early-pregnancy plans look like: ''Take folic acid, see you at 12 weeks.'' Ours doesn''t.

**Weeks 4–6** — Confirm pregnancy, dating ultrasound, review of all medications for safety, baseline labs.

**Weeks 6–8** — Specialist consult to address symptoms (nausea, fatigue, anxiety) with evidence-based interventions. Discuss any risk factors openly.

**Weeks 8–10** — Early ultrasound for viability and dating. Genetic screening options reviewed (NIPT, anatomy scans, what''s right for you).

**Weeks 10–12** — Care navigator coordinates transition to obstetric partner of your choice. Continuity, not handoff.

**Throughout** — WhatsApp Care Navigator for the 2am questions. The questions you don''t want to call your gynaecologist about.

**Book Early Pregnancy Care — neuera.care, link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #earlypregnancy #firsttrimester #pregnancyindia #pregnancycare #pregnancyjourney #newmomtobe #pregnant #indianpregnancy #morningSickness #pregnancytips #earlypregnancycare #obgyncare #pregnancysupport #expectingmom #babybump #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 37, "seedPillar": "program-spotlight", "seedProgram": "early-pregnancy", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''Early pregnancy care: not just folic acid.''\n2-5. Weekly walkthrough.\n6. The 2am question principle (Care Navigator).\n7. What we don''t do (we don''t replace your OB, we bridge to them).\n8. CTA."}', 38880, 37.0, '2026-06-16T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7a02-8b7b-e4f0639f8850', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Am I in perimenopause — at 38?', 'Am I in perimenopause — at 38?

Perimenopause is the 4–10 year transition leading up to menopause. It can begin in your late 30s, and the average Indian woman enters it earlier than the global average.

The early signs are easy to miss because they look like everything else:

→ Cycles getting shorter, longer, or unpredictable
→ Sleep getting lighter, especially in the days before your period
→ A new kind of anxiety in the luteal phase
→ Hot flushes — not always ''classic'', sometimes just feeling ''warmer than you should be''
→ Brain fog around the time you''d expect a period
→ Heavier periods, or shorter cycles with more PMS

None of these is ''you getting older''. It''s a hormonal transition with real testing, real treatment, and real options.

**Comment PERI — we''ll DM the symptom checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 38, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "45s reel. Each symptom = one quick scene: a calendar with mismatched dots, a 3am ceiling shot, a brow furrowed at work, a hand fanning a face, a forgotten word. Voiceover: ''Maybe you''re not falling apart. Maybe you''re in peri.'' Cover: serif ''Peri starts earlier than they told you.''"}', 40320, 38.0, '2026-06-17T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7bd7-800a-8b1eb60e1cd5', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The 12-symptom perimenopause checker.', 'The 12-symptom perimenopause checker.

If you''re between 35 and 55 and any of these are new or worsening — perimenopause is on the table.

1. Shorter or longer cycles than your baseline.
2. Heavier or lighter flow than your baseline.
3. Skipped periods.
4. Hot flushes / night sweats.
5. Sleep disruption, especially second half of cycle.
6. New or worsening anxiety/irritability.
7. Brain fog or word-finding difficulty.
8. Mood shifts that feel hormonal, not situational.
9. Vaginal dryness or pain with sex.
10. New onset urinary urgency or recurrent UTIs.
11. Joint aches you can''t explain.
12. Decreased libido.

4 or more = book a perimenopause evaluation. 8 or more = please don''t wait.

**Save this. Send it to the friend who''s been told ''it''s just stress''.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 39, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''The 12-symptom peri checker.''\n2-7. Grouped 2 symptoms per slide.\n8. CTA \u2014 ''Book a peri evaluation \u2014 neuera.care''."}', 41760, 39.0, '2026-06-18T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-71ff-a2b6-bab44b52c018', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'HRT in 60 seconds — what it is, what it isn''t, and who it''s for.', 'HRT in 60 seconds — what it is, what it isn''t, and who it''s for.

Hormone Replacement Therapy (HRT) — increasingly called Menopausal Hormone Therapy (MHT) — is one of the most evidence-based, undervalued treatments in women''s health.

What it is: replacing the oestrogen (and usually progesterone) that your body is no longer making at sufficient levels.

What it treats well: hot flushes, night sweats, mood, sleep, vaginal symptoms, bone density, possibly cardiovascular protection when started in the right window.

What it isn''t: a cancer-causing pill. The 2002 study that scared everyone has been re-analysed extensively. For most women under 60 within 10 years of menopause, the benefits outweigh the risks — significantly.

Who it''s for: women in peri or early menopause with bothersome symptoms, after a proper individual risk assessment.

Who it''s *not* for: women with active hormone-sensitive cancers, recent blood clots, or certain liver conditions.

It''s a conversation, not a default yes or no.

**Comment HRT — we''ll DM the decision framework.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 40, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "60s reel. Direct text-on-screen format. Big serif phrase ''HRT in 60 seconds.'' Each point shown for 5-7s with calm voiceover. Cover: ''HRT \u2014 the most underused tool in women''s health.''"}', 42380, 40.0, '2026-06-18T15:20:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7579-a426-824d5c28e74f', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Why peri wrecks sleep — and what actually helps.', 'Why peri wrecks sleep — and what actually helps.

Perimenopausal sleep disruption is a clinical phenomenon, not a personal failure.

Why it happens:
→ Progesterone (a natural sleep aid) drops first and most volatilely in peri.
→ Oestrogen fluctuations trigger night sweats and vasomotor wake-ups.
→ Stress hormone (cortisol) rhythm shifts.
→ Anxiety in the luteal phase spikes.

What doesn''t work well: ''just try magnesium'' or ''go to bed earlier''.

What does help, in evidence-based order:
1. **HRT** — particularly cyclic progesterone — improves sleep dramatically for many.
2. **Cognitive behavioural therapy for insomnia (CBT-I)** — gold-standard non-drug intervention.
3. **Strict sleep hygiene** — cool room, dark room, no phones in bed, consistent timing.
4. **Targeted supplements** — magnesium glycinate, L-theanine; evidence is modest but reasonable.
5. **Avoid alcohol in the second half of cycle** — it tanks deep sleep.
6. **Manage night sweats** — moisture-wicking sleepwear, bedside fan.

If sleep is gone for more than 2 weeks straight, it''s a medical issue.

**Save this. Pin it to your bathroom mirror.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 41, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''Why peri wrecks sleep.''\n2-4. Why slides.\n5-7. What helps, ranked.\n8. CTA."}', 43200, 41.0, '2026-06-19T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7cfb-9396-4e0467596ee4', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If your mood is doing things it never used to — your brain is processing real hormone shifts.', 'If your mood is doing things it never used to — your brain is processing real hormone shifts.

Oestrogen and progesterone don''t just regulate periods. They regulate serotonin, dopamine, and GABA — the same neurotransmitters that mood medications target.

When oestrogen drops sharply (luteal phase, perimenopause), serotonin drops with it. That can show up as: new anxiety, irritability that feels alien, rumination, low mood, rage at small things, dread.

This is not ''stress''. It is real biochemistry.

What helps:
→ Tracking the pattern (so you can see the cycle behind it).
→ HRT for the underlying hormone shift, when appropriate.
→ SSRIs/SNRIs — first-line for severe mood symptoms in peri, with or without HRT.
→ Targeted nutrition and movement.
→ Therapy that knows hormones, not just generic CBT.

The goal isn''t to feel grateful you''re allowed to be irritable. The goal is to feel like yourself again.

**Comment MOOD — we''ll DM the perimenopause mood support guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 42, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "45s reel. Brain illustration with neurotransmitter labels lighting up and dimming. Voiceover steady and validating. On-screen: ''It''s not just stress. It''s biology.'' Cover: ''Peri mood: it''s chemistry, not character.''"}', 44640, 42.0, '2026-06-20T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-702b-95be-4e6010e15e70', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''For the first time in five years, I felt like me again.''', '''For the first time in five years, I felt like me again.''

We hear this a lot — and not because anything dramatic happened. Just: a clear diagnosis, the right plan, and consistent support.

If you''ve spent the last few years feeling like a different person — you might not be. You might just be in peri.

**Book a Perimenopause Program consult — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 43, "seedPillar": "testimonial", "seedProgram": "perimenopause", "seedVisualBrief": "Single image: deep navy background, warm gold serif: ''For the first time in five years, I felt like me again.'' Attribution: ''\u2014 A neuera patient, Perimenopause Program''. Subtle gold neuera logo."}', 46080, 43.0, '2026-06-21T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-747b-992e-4b88bc619024', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The Perimenopause Program — 12 weeks, end to end.', 'The Perimenopause Program — 12 weeks, end to end.

**Weeks 1–2** — Specialist OBGYN consult, complete symptom mapping, full hormonal and metabolic panel, baseline cardiovascular and bone risk assessment.

**Weeks 3–4** — Results review. HRT evaluation if symptoms warrant — with a real risk/benefit conversation. Mood and sleep medication consideration if relevant.

**Weeks 5–10** — Implementation. Titration. Care Navigator support via WhatsApp. Sleep, nutrition, and movement coaching layered in.

**Weeks 11–12** — Review. Adjust. Plan for the next 6–12 months.

What patients commonly report by week 12: better sleep, calmer mood, fewer hot flushes, more energy. Not ''back to 25'' — but back to *you*.

**Begin the program — neuera.care, link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 44, "seedPillar": "program-spotlight", "seedProgram": "perimenopause", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''12 weeks. End to end.''\n2-7. Weekly phases.\n8. CTA."}', 46716, 44.0, '2026-06-21T15:36:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7f2e-848a-7861e0d84225', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Hot flushes aren''t just ''feeling warm''. Here''s what''s actually happening in your brain.', 'Hot flushes aren''t just ''feeling warm''. Here''s what''s actually happening in your brain.

A hot flush is a thermoregulatory event triggered by changes in oestrogen signalling to the hypothalamus — the brain region that controls your internal thermostat.

The thermostat ''window'' (the range of body temperatures your brain considers OK) narrows in peri/menopause. Small upward shifts now trigger a panic response: rapid heart rate, sudden vasodilation, sweating, sometimes anxiety.

It''s not in your head. It''s in your hypothalamus.

What helps:
→ HRT (most effective, 80–90% reduction).
→ Non-hormonal options: certain SSRIs, gabapentin, clonidine, and a newer class called NK3 antagonists.
→ Lifestyle: avoid triggers (spicy food, alcohol, caffeine for some), dress in layers, cool bedroom.
→ Cognitive behavioural therapy reduces *bother*, not frequency.

If hot flushes are eating your life — there are options.

**Comment FLUSH — we''ll DM the hot flush treatment guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 45, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "45s reel. Animated hypothalamus illustration with a narrowing ''thermostat window''. Voiceover. Cover: ''Hot flushes start in your brain, not your body.''"}', 47520, 45.0, '2026-06-22T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-77f8-b36b-07f3f578e7d5', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Peri at 35? Yes, it happens. Here''s how to know.', 'Peri at 35? Yes, it happens. Here''s how to know.

The average age of menopause in India is 46–48 — earlier than the global 51. That means perimenopause can begin in your mid-30s for some women.

Early perimenopause looks like:
→ Cycles that were always reliable becoming subtly inconsistent.
→ PMS becoming worse than it ever was.
→ Sleep getting lighter without an obvious cause.
→ New anxiety in your luteal phase.
→ Heavier or more clotted bleeding.
→ A vague ''something is off'' that nobody else takes seriously.

**Not** perimenopause (don''t conflate): a single stressful season, post-pregnancy hormonal shifts, thyroid changes, or PCOS flare-ups. These need ruling out first.

The right test at 35 is not ''one FSH level'' — it''s a panel run over 2–3 cycles, paired with symptom tracking and an experienced clinician''s interpretation.

**Book a perimenopause evaluation — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #perimenopause #perimenopauseindia #perimenopausalsupport #hormonebalance #midlifehealth #hotflashes #hrt #hormonereplacement #midlifehormones #menopauseawareness #perimenopausalwomen #estrogen #progesterone #midlifewellness #hormonalshift #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 46, "seedPillar": "education", "seedProgram": "perimenopause", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''Perimenopause at 35? Yes.''\n2-3. Why earlier in Indian women.\n4-5. What it looks like.\n6. What it isn''t.\n7. The right test.\n8. CTA."}', 48960, 46.0, '2026-06-23T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-79ff-917c-6ab04aea0917', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Five things you''ve been told about menopause that aren''t true.', 'Five things you''ve been told about menopause that aren''t true.

1. **''Menopause is the end of your sex life.''** Wrong. With proper care (vaginal oestrogen, lubrication, sometimes therapy) sex life often improves in post-menopause: more confidence, more time, no contraception.

2. **''HRT causes cancer.''** Overblown. For most women under 60 within 10 years of menopause, benefits outweigh risks. The famous 2002 study has been heavily re-analysed.

3. **''Just push through, it''s natural.''** So is appendicitis. We treat that. Bothersome menopausal symptoms can and should be treated.

4. **''Your bones are fine if you don''t feel anything.''** Bone loss is silent until you fracture. DEXA scans matter.

5. **''It''s the end.''** It''s roughly the midpoint, statistically. The next 30+ years deserve a real care plan.

**Save this. Send to your mom, your aunt, your older sister.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 47, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "45s reel. Each myth shown with bold strikethrough text, then the truth in calm cream. Voiceover firm. Cover: ''Menopause myths \u2014 debunked.''"}', 50400, 47.0, '2026-06-24T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-769f-9a82-a637a17a91a6', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Why a DEXA scan at menopause might be the most important test of your life.', 'Why a DEXA scan at menopause might be the most important test of your life.

Bone density peaks around age 30 and declines gradually until menopause — when it drops sharply due to oestrogen loss. In the first 5 years post-menopause, women can lose up to 20% of their bone mass.

Osteoporosis is silent until a fracture happens. By then, you''ve lost a decade of options.

**A DEXA scan tells you:**
→ Where your bone density sits today (T-score).
→ Whether you''re at risk of fracture in the next 10 years (FRAX score).
→ What dose of intervention (calcium, vit D, exercise, possibly meds) is right.

**Who needs one:**
→ All women at menopause (baseline) and every 2 years after.
→ Earlier if family history of fracture, low body weight, smoking, certain medications.

**What helps regardless of result:**
→ Resistance training (the single most effective lifestyle intervention).
→ Adequate protein.
→ Vitamin D + calcium in target.
→ HRT for many.

**Book a Menopause Care consult to plan your bone health — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 48, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''The most important test you''ve never had.''\n2-3. Why bone loss accelerates at menopause.\n4. DEXA explained.\n5. T-score interpretation.\n6. Who needs it / how often.\n7. What helps (resistance training emphasis).\n8. CTA."}', 51016, 48.0, '2026-06-24T15:16:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-75b9-9cb5-f7ca97d1932c', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Vaginal oestrogen: the most underused, safest, life-changing treatment in menopause.', 'Vaginal oestrogen: the most underused, safest, life-changing treatment in menopause.

Up to 70% of post-menopausal women experience genitourinary syndrome of menopause (GSM): vaginal dryness, painful sex, recurrent UTIs, urinary urgency, microscopic vaginal tissue thinning.

For most of these symptoms, the most effective treatment is *local* vaginal oestrogen — a cream, tablet, or ring used a few times a week.

Why it''s underused:
→ Women aren''t told it exists.
→ The word ''oestrogen'' triggers blanket fear.
→ Doctors assume it''s the same risk profile as systemic HRT — it isn''t.

Reality: vaginal oestrogen is safe for almost every woman, including most breast cancer survivors (after discussion with their oncologist). It does not significantly raise blood oestrogen levels.

If you''re peeing too often, getting recurrent UTIs, can''t enjoy sex, or feel raw — this is a 5-minute conversation that could change your life.

**Comment VE — we''ll DM the local oestrogen guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 49, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "45s reel. Animated cross-section diagram showing vaginal tissue changes pre- and post-treatment. Voiceover candid and reassuring. Cover: ''Vaginal oestrogen: safer than you''ve been told.''"}', 51840, 49.0, '2026-06-25T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b57-8ee5-6679f2397b60', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Cardiovascular disease becomes the #1 killer of women after menopause. Here''s how to fight back.', 'Cardiovascular disease becomes the #1 killer of women after menopause. Here''s how to fight back.

Up to menopause, oestrogen is protective: it keeps blood vessels flexible and cholesterol profiles favourable. After menopause, that protection drops sharply.

Within 10 years post-menopause, cardiovascular disease overtakes everything else as the leading cause of death in women.

**The baseline workup we recommend:**
→ Lipid panel (LDL, HDL, triglycerides, ApoB if available)
→ Blood pressure (home cuff, monthly)
→ Fasting glucose + HbA1c
→ Lp(a) — the inherited risk marker most doctors don''t check
→ hs-CRP — inflammation marker

**The non-negotiable lifestyle four:**
1. **150 min/week moderate cardio** + 2 strength sessions.
2. **Mediterranean-style eating** — protein, fibre, healthy fats.
3. **Sleep** 7+ hours.
4. **Stress regulation** — yoga, breathwork, therapy — pick what sticks.

**Medications when warranted:** statins, anti-hypertensives, sometimes metformin, sometimes HRT (in the right window, it may be cardio-protective).

**Book a post-menopausal cardiovascular review — neuera.care.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 50, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''Why menopause changes your heart risk.''\n2-3. The oestrogen mechanism.\n4-6. The labs that matter.\n7-9. The lifestyle four.\n10. CTA."}', 53280, 50.0, '2026-06-26T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7bbb-a0e2-9adbfb31a1cc', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '''Menopause is not the end. It''s the beginning of taking yourself seriously.''', '''Menopause is not the end. It''s the beginning of taking yourself seriously.''

Some patients come to us afraid that menopause means decline. Most leave understanding it as a beginning — of clearer priorities, deeper self-care, and the kind of medical attention they should have been getting all along.

You get one body. The post-menopausal decades can be your best ones, with the right plan.

**Book a Menopause Care consult — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 51, "seedPillar": "testimonial", "seedProgram": "menopause-care", "seedVisualBrief": "Single image: deep forest green background, gold serif quote. Attribution: ''\u2014 A neuera patient''. Neuera logo."}', 54720, 51.0, '2026-06-27T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e72-b1aa-9d657313af54', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Sexual wellness in menopause: it''s a clinical conversation, not a personal failing.', 'Sexual wellness in menopause: it''s a clinical conversation, not a personal failing.

Decreased libido, vaginal dryness, painful sex, slower arousal — all extremely common in menopause. None of them inevitable. All of them treatable.

What we offer (and what your gynaecologist should):

→ **Vaginal oestrogen** for tissue health and lubrication.
→ **Lubricants and moisturisers** — different products, different uses (lubricant during sex, moisturiser 3x/week).
→ **Pelvic floor PT** — underused, transformative.
→ **Testosterone** for libido — yes, women have testosterone; supplementation is appropriate in some cases.
→ **Couples conversation** — sometimes the work is communication and creativity, not medication.
→ **Therapy** — body image and identity shifts deserve real space.

No single fix. Most patients land on a layered plan. None of it requires shame.

**Comment WELLNESS — we''ll DM the menopause sexual health guide.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 52, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "45s reel. Soft visuals: silk fabric textures, gentle light, no anatomical illustration. On-screen text walks the layered plan. Voiceover warm and direct. Cover: ''Menopause sexual wellness \u2014 there''s a plan.''"}', 55353, 52.0, '2026-06-27T15:33:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7d75-ad5c-b56b6819fe72', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Why strength training matters more in menopause than it ever has before.', 'Why strength training matters more in menopause than it ever has before.

Post-menopause, you lose roughly 1% of muscle mass per year if you don''t actively train. That''s huge: less muscle = slower metabolism, weaker bones, worse insulin sensitivity, higher fall risk.

Resistance training reverses much of this. It''s the single highest-leverage intervention in post-menopausal health.

**Where to start:**
→ 2 sessions/week minimum, 3 ideal.
→ Compound movements: squat, hinge, press, pull, carry.
→ Heavier weights, lower reps — not high-rep light dumbbells.
→ Progress weights over time. ''Just enough to be challenging'' = 6–10 reps with effort.
→ If you''ve never lifted: a trainer for 6–8 sessions to nail form.

**What it changes:**
→ Bone density (load-bearing signal).
→ Lean mass (metabolic protection).
→ Insulin sensitivity (glucose handling).
→ Balance and fall prevention.
→ Confidence.

It''s not optional. It''s medicine.

**Save this. Forward to one woman you love.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 53, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "8-slide carousel:\n1. COVER serif: ''Strength training: post-meno medicine.''\n2. The 1%/year stat.\n3-6. Where to start.\n7. What it changes.\n8. CTA."}', 56160, 53.0, '2026-06-28T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b14-b1ac-76739df6de39', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Surgical menopause is not the same as natural menopause. Here''s what changes.', 'Surgical menopause is not the same as natural menopause. Here''s what changes.

If you''ve had your ovaries removed (oophorectomy) — whether alongside a hysterectomy, for cancer, for endometriosis, or for genetic risk — you''ve entered surgical menopause.

The difference from natural menopause: it happens instantly. Oestrogen drops to near-zero overnight, not gradually.

The consequences if untreated:
→ Severe and sudden hot flushes, mood, sleep symptoms.
→ Accelerated bone loss.
→ Higher long-term cardiovascular and cognitive risk *if it happens before natural menopause age (~50)*.

**The standard of care, when not contraindicated:** HRT until at least the average natural menopause age, often longer. This isn''t ''optional'' — for most surgical menopause patients under 45, it''s strongly indicated for long-term health.

If you''ve had this surgery and weren''t offered HRT — please get a second opinion.

**Comment SURG — we''ll DM our surgical menopause checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 54, "seedPillar": "education", "seedProgram": "menopause-care", "seedVisualBrief": "45s reel. Calm clinical visual style. Animated graphic showing oestrogen curve: natural (slow decline) vs surgical (cliff drop). Voiceover. Cover: ''Surgical menopause needs a different plan.''"}', 57600, 54.0, '2026-06-29T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7269-8eaf-f783707e16f9', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The Menopause Care Program — 16 weeks of comfort, strength, and long-term health.', 'The Menopause Care Program — 16 weeks of comfort, strength, and long-term health.

**Weeks 1–2** — Full intake. Specialist OBGYN consult. Symptom and history mapping. Lab orders: hormone panel, lipid panel, fasting insulin, HbA1c, vitamin D, calcium, TSH, FSH (if peri/early meno), CBC, ferritin. DEXA scan order if not already done.

**Weeks 3–4** — Results review. HRT/MHT evaluation with informed consent. Vaginal oestrogen consideration. Cardiovascular and bone risk assessment.

**Weeks 5–10** — Plan execution. Care Navigator support via WhatsApp. Nutrition and movement coaching. Strength training programming. Sleep and mood interventions.

**Weeks 11–14** — Review and titration. Lab repeat if relevant. Therapy adjustments.

**Weeks 15–16** — Long-term plan. Annual follow-up cadence. What to monitor.

You walk away with: a diagnosis (or confirmation), a treatment plan, a movement plan, a Care Navigator who knows you, and a clear horizon.

**Begin the program — neuera.care.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #menopause #menopauseindia #menopausesupport #menopausematters #hrt #hormonereplacement #vaginalestrogen #bonehealth #dexascan #menopausewellness #postmenopause #midlifehealth #menopausalsymptoms #hotflashes #vaginalhealth #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 55, "seedPillar": "program-spotlight", "seedProgram": "menopause-care", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''Menopause Care \u2014 16 weeks.''\n2-9. Phase walk-through.\n10. CTA."}', 59040, 55.0, '2026-06-30T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7b0d-89af-ba363b2dae67', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Some days writing is too much. That''s why we built voice journaling into Neuera.', 'Some days writing is too much. That''s why we built voice journaling into Neuera.

The hardest days are the ones you don''t have words for.

We built voice notes into the Neuera app for exactly this. Tap, talk for 30 seconds, walk away. The next time you see your clinician, you have a record — not a ''I think I was struggling around mid-month'' guess.

Voice notes are stored privately on your device, encrypted, never shared. You decide if and when to bring them into a consult.

It''s not therapy. It''s not medical advice. It''s a small honest tool for people whose bodies are doing a lot.

**Download Neuera — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #periodtracker #moodtracking #journalingapp #voicejournal #wellnessapp #selfcareapp #mentalwellness #periodtrackingapp #cycletracker #femtech #healthapp #mindfulnessapp #dailyjournal #femtechindia #appsforwomen #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 56, "seedPillar": "app", "seedProgram": "app", "seedVisualBrief": "30s reel. Phone mockup, finger holding down the voice-record button, waveform animation, fade to a soft cream interface with the recorded note appearing. Voiceover gentle. Cover: ''Some days, words come hard.''"}', 59695, 56.0, '2026-06-30T15:55:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7323-b0c8-e3171575b1c8', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'If you don''t know these five numbers about your body, this is your sign.', 'If you don''t know these five numbers about your body, this is your sign.

Five numbers we want every woman in India to know — and have current within the last year:

1. **Resting blood pressure** — should be under 120/80.
2. **HbA1c** — your average blood sugar; should be under 5.7%.
3. **LDL cholesterol** — varies by risk, but most women want under 100 mg/dL.
4. **Vitamin D** — over 30 ng/mL is the floor; 40–60 is target.
5. **TSH** — your thyroid stimulating hormone; should be in your lab''s reference range (usually 0.4–4.0).

Don''t know any of these? Book a baseline. It''s the most underrated investment in your future self.

**Comment NUMBERS — we''ll DM the full preventive panel checklist.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preventivehealth #healthcheckup #womenshealthcheck #annualcheckup #hormonalpanel #metabolichealth #bonedensity #cardiovascularhealth #healthscreening #preventivecare #hormonetesting #healthyhabits #knowyournumbers #healthawareness #longevity #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 57, "seedPillar": "education", "seedProgram": "womens-health-check", "seedVisualBrief": "45s reel. Each number = one frame with a big bold value and the marker name. Voiceover steady. Cover: ''Five numbers. Know them.''"}', 60480, 57.0, '2026-07-01T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7e93-aa6c-f7e85d63e088', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'The annual women''s health check, in detail.', 'The annual women''s health check, in detail.

A real annual workup goes beyond ''CBC and lipid panel''. Here''s the full panel we recommend, organised by what each marker is doing for you.

**Cardiometabolic**
→ Fasting glucose, HbA1c, fasting insulin
→ Full lipid panel + ApoB + Lp(a)
→ Blood pressure (home cuff + clinic)

**Hormonal**
→ TSH, free T4, TPO antibodies
→ FSH, LH (if peri/menopause)
→ AMH (if relevant for fertility planning)
→ Cortisol (if symptoms warrant)

**Nutrient**
→ Vitamin D, B12, ferritin, folate

**Cancer screening**
→ Pap smear / HPV (per age & guidelines)
→ Breast exam + mammogram (per age)
→ Skin check (annual)

**Bone**
→ DEXA scan (peri/post menopause baseline)

**Other**
→ Pelvic ultrasound (if symptoms warrant)
→ Dental and eye check (often forgotten, often consequential)

This is the panel that catches things early. Most women have never had half of it run.

**Book a Women''s Health Check — link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preventivehealth #healthcheckup #womenshealthcheck #annualcheckup #hormonalpanel #metabolichealth #bonedensity #cardiovascularhealth #healthscreening #preventivecare #hormonetesting #healthyhabits #knowyournumbers #healthawareness #longevity #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "carousel", "shareToFeed": true, "seedSequence": 58, "seedPillar": "program-spotlight", "seedProgram": "womens-health-check", "seedVisualBrief": "10-slide carousel:\n1. COVER serif: ''A real annual workup.''\n2-8. Each panel group on its own slide.\n9. The ''most women have never had half of this'' callout.\n10. CTA."}', 61920, 58.0, '2026-07-02T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-7982-aa54-20282dc36d05', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', 'Your labs say ''normal''. Here''s why that''s not always good news.', 'Your labs say ''normal''. Here''s why that''s not always good news.

Lab reference ranges are statistical — they describe the middle 95% of the population, sick or healthy. ''Normal'' often means ''not catastrophically off''. It doesn''t mean ''optimal''.

Three examples:

→ **Vitamin D ''normal'' is >20 ng/mL.** Optimal is 40–60. Most Indian women sit at 12–18.

→ **TSH ''normal'' is 0.4–4.0.** Many experts say symptoms of subclinical hypothyroidism appear from 2.5 onward, especially in TTC and peri.

→ **Ferritin ''normal'' is >12 ng/mL.** For premenopausal women, energy and hair issues often resolve only above 50.

A good clinician reads labs as a story, not a binary. If ''all normal'' doesn''t match how you feel — push for a clinician who reads optimally, not statistically.

**Save this. Bring it to your next appointment.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #preventivehealth #healthcheckup #womenshealthcheck #annualcheckup #hormonalpanel #metabolichealth #bonedensity #cardiovascularhealth #healthscreening #preventivecare #hormonetesting #healthyhabits #knowyournumbers #healthawareness #longevity #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "reel", "shareToFeed": true, "seedSequence": 59, "seedPillar": "education", "seedProgram": "womens-health-check", "seedVisualBrief": "45s reel. On-screen comparisons: ''normal range'' vs ''optimal range'' for each example. Voiceover clear and slightly frustrated on the patient''s behalf. Cover: ''Normal isn''t always good news.''"}', 63360, 59.0, '2026-07-03T05:00:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');
INSERT INTO drafts (id, project_id, track_id, account_id, status, title, body, body_format, platform_options, track_offset_minutes, sequence_in_track, scheduled_for, scheduled_tz, created_by) VALUES ('019e2fe5-b67e-79b9-8472-3b888a157f78', '978f15b0-368e-7316-8faa-72c4ef6a9f6b', '019e2fe5-b67e-77c5-b7af-7ba9ef2c1133', NULL, 'draft', '45 days. 60 posts. One promise: you don''t walk this alone.', '45 days. 60 posts. One promise: you don''t walk this alone.

Thank you for following along.

You''ve heard us talk about PCOS, periods that hurt, fertility, perimenopause, menopause, the labs that matter, the app that helps you track. The point of all of it was this: you have options, you have a team, you don''t have to do this alone.

If any of these 45 days made you think ''that''s me'' — book a consult.
If any of them made you think of a friend — send them the post.

And if you''ve been quietly carrying something for years that this campaign finally gave a name to — we''re here.

**Book a first consult — pay only after picking a slot. Link in bio.**

_Disclaimer: This is educational content, not medical advice. For personalised care, book a consultation at neuera.care._

#neueracare #neueraapp #neueraprograms #neuera #womenshealthindia #indianwomenshealth #femalehealth #telehealthindia #onlineconsultation #doctorconsultation #evidencebasedmedicine #patientcare #compassionatecare #specialistled #obgynindia #womenshealthclinic #digitalhealth #personalisedcare #telegynecology #womenshealth #womenshealthawareness #periodpositive #cycleawareness #judgementfreecare #neverwalkalone #obgyn #hormonehealth #womensupportingwomen #indianwomen', 'markdown', '{"postKind": "image", "shareToFeed": true, "seedSequence": 60, "seedPillar": "promo", "seedProgram": "brand", "seedVisualBrief": "Single image: warm cream background, large serif: ''45 days. 60 posts. One promise.'' Sub: ''You don''t walk this alone.'' Sub-sub: ''neuera.care'' with logo. Bottom: ''Book your first consult \u2014 pay after choosing a slot.''"}', 63992, 60.0, '2026-07-03T15:32:00.000Z', 'Asia/Kolkata', '019e02b3-ec81-7bd2-abfd-19c2f5bc6973');

COMMIT;
