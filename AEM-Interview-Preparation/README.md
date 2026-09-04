# AEM Interview Preparation — Complete Guide

> **31 files. One writing style. One goal:** turning four years of AEM *support* experience into interview-ready AEM *developer* answers, for 3–4 year experienced roles at Indian service companies — Valtech, Publicis Sapient, Deloitte Digital, Cognizant, Accenture, TCS, Capgemini, Infosys, IBM, LTIMindtree, and similar.

---

## Why this repository exists

Four years of AEM support builds a real, valuable kind of knowledge — you've seen more production incidents, more "why is this blank on publish," more replication failures than most developers who've only ever worked in a sandbox. What it doesn't automatically build is the *vocabulary* to turn that knowledge into a developer-level interview answer, or the hands-on Java and component-authoring fluency that a developer role expects on day one.

This repository is that translation layer. Every file takes one topic, explains it properly from first principles, and then spends most of its length doing the thing a textbook or the official documentation won't: showing you exactly how the topic gets **drilled in an interview** — the follow-up questions, the cross-questions that expose a shallow answer, the spoken model answers you can actually rehearse, and the real project stories shaped the way a good developer tells them (a requirement, what made it hard, the approach, the part that went wrong, and what was learned from it).

**One rule holds across every file, and it matters:** the "In my project we…" passages throughout this repository are **templates to fill in with your own real work**, not scripts to recite word for word. An interviewer who's actually worked in AEM will notice a memorised story instantly. The stories here are built from real, observed patterns on a real energy-sector marketing site — the technical shape is accurate; the specific details are yours to swap in.

---

## How this repository is organised

### Part 1 — The core syllabus (files 01–18)

These cover every point from the original 27-point AEM developer syllabus, in the order a developer typically learns them — architecture first, then components, then the platform features built on top.

| File | Topic |
|---|---|
| 01 | AEM Architecture *(two versions — a dense first draft, and the chosen teaching-style rewrite; read the `-v2-teaching-style` one)* |
| 02 | Component Development |
| 03 | Editable Templates and Policies |
| 04 | Clientlibs |
| 05 | Sling Models |
| 06 | OSGi and Services |
| 07 | Servlets |
| 08 | HTL (Sightly) |
| 09 | Workflows |
| 10 | Schedulers, Jobs and Events |
| 11 | Dialogs and Validation |
| 12 | MSM and Translation |
| 13 | Users, Groups and Permissions |
| 14 | AEM as a Cloud Service |
| 15 | Content Fragments |
| 16 | Experience Fragments |
| 17 | Sling Model Exporter |
| 18 | Replication and Distribution |

### Part 2 — The supplementary deep dives (files 19–26)

Topics that come up constantly in real interviews but sit outside the original syllabus — infrastructure, the repository itself, and how a change actually gets from a laptop to production.

| File | Topic |
|---|---|
| 19 | Dispatcher, Caching and CDN |
| 20 | JCR, Oak and the Repository |
| 21 | Querying, QueryBuilder and Indexes |
| 22 | Core Components and the Style System |
| 23 | Resource Resolution and the Sling Resource Merger |
| 24 | Headless AEM, GraphQL and the SPA Editor |
| 25 | Maven, Packages and the AEM Project Structure |
| 26 | Cloud Manager, Pipelines and CI/CD |

### Part 3 — The skills underneath the platform (files 27–31)

The practical, cross-cutting skills a 3–4 year developer is expected to have alongside AEM-specific knowledge — testing, quality, security, core Java, and how to reason about a system rather than just a component.

| File | Topic |
|---|---|
| 27 | Unit Testing — JUnit, Mockito and AEM Mocks |
| 28 | Code Quality, SonarQube and Best Practices |
| 29 | Security Best Practices for AEM Developers |
| 30 | Java Fundamentals for AEM Developers |
| 31 | System Design Basics for AEM Developers |

---

## What's inside every file

Every file (with minor variation for 30 and 31, which are less AEM-specific) follows the same 21-section shape, so once you know how to use one, you know how to use all of them:

1. **Introduction** — what the topic is and why it matters, explained before any syntax.
2. **Core Concepts** — the mental model, built up with analogies and worked reasoning, not just definitions.
3. **Internal Working** — what actually happens under the hood, for the follow-up questions that ask "but how does that actually work?"
4. **Important Interview Questions** — graded Basic → Intermediate → Advanced, each with a **Cross** line showing the follow-ups a good interviewer asks next.
5. **Cross Questions** — full drill-down chains, showing how one opening question turns into four or five.
6. **Best Interview Answers** — full spoken-style answers with realistic timing ("about 90 seconds"), meant to be read aloud and rehearsed, not read silently.
7. **Real Project Examples** — stories in the requirement → what made it hard → approach → hard part → result shape, each ending with a stated lesson.
8. **Coding / Configuration Examples** — heavily commented code, explaining *why* each line matters, not just what it does.
9. **Common Mistakes** — a table of what goes wrong, why, and what it actually costs.
10. **Best Practices** — the habits that prevent section 9's mistakes.
11. **Debugging Tips** — symptom → where to look → what it usually means.
12. **Performance Notes** — what actually costs something at scale, and what doesn't.
13. **Real Production Scenarios** — a bank of "what would you do if…" situations.
14. **Follow-up Questions** — the kind an interviewer asks after your main answer lands well.
15. **Comparison Tables** — the distinctions that get confused under pressure, laid out side by side.
16. **Memory Tricks** — short, quotable phrases that compress a whole concept.
17. **Revision Notes** — a dense paragraph summarising the entire file, for the day before an interview.
18. **Cheat Sheet** — a scannable reference block.
19. **Frequently Forgotten Things** — the specific details people know but blank on under pressure.
20. **Final Interview Summary** — the one thing to hold onto if you remember nothing else.
21. **Mock Interview** — a full sequence of questions with complete, spoken model answers.

---

## How to actually use this repository

**Don't read it like a reference manual.** Read one file's sections 1–3 slowly, until the mental model genuinely clicks — most of these topics are more about understanding than memorisation, and the understanding is what survives a follow-up question a memorised answer wouldn't.

**Read sections 4–7 with a notepad, not silently.** Try answering each question yourself, out loud, before reading the given answer. The gap between what you said and what's written is exactly what needs more work.

**Treat section 7's stories as a worksheet, not a script.** For every story, write your own version from your actual four years of support work — you have more real incidents to draw on than you probably think. A real, slightly rougher story beats a smooth, memorised one every time a follow-up question probes it.

**Use sections 16–19 the week before an interview**, not the first time through — they're compression tools for material you already understand, not a shortcut past understanding it.

**Do section 21 out loud, ideally to another person or recorded**, in the final days before an interview. Reading a mock interview silently and being able to actually speak the answers under mild pressure are different skills, and the second one is what the real interview tests.

---

## A note on the project domain

Every example, story, and code snippet in this repository is set on **"a global energy technology company's" marketing site** — a deliberately generic stand-in for a real industrial energy client's public site, chosen because its real, observable features (multi-country sites, product listings, FAQ accordions, press releases) map cleanly onto nearly every AEM concept without needing invented detail. The technical shape of every story is accurate to how these systems actually work; treat the domain itself as a placeholder for **your own actual project**, and swap in your own product, your own component names, your own incidents wherever a story says "In my project we…"

---

## The 30 / 60 / 90-day plan

This assumes roughly 1.5–2 hours a day, adjusted around whatever your actual runway to interviews looks like. Compress or stretch it, but don't skip the order — each phase deliberately builds on the one before it.

### Days 1–30 — Foundation: architecture, components, and the Java underneath them

- **Week 1:** Files 01 (v2), 30 (Java Fundamentals). Get the architecture mental model solid before anything else — every later file assumes it. Read 30 alongside 01 so the Java concepts have an AEM anchor from day one, not in isolation.
- **Week 2:** Files 02, 03, 04. Component development, templates, clientlibs — the day-to-day authoring surface of the job.
- **Week 3:** Files 05, 06. Sling Models and OSGi — the two topics that separate "I can copy a component" from "I can write one," and where most interviews spend real time.
- **Week 4:** Files 07, 08. Servlets and HTL. By the end of week 4, you should be able to describe the full request lifecycle from URL to rendered HTML without notes.

**Milestone at day 30:** you can explain AEM's architecture, write and explain a Sling Model, and describe how a request actually resolves — all without reading from this repository.

### Days 31–60 — Breadth: the platform features and the skills that support them

- **Week 5:** Files 09, 10, 11. Workflows, schedulers/jobs, dialog validation — the platform mechanisms beyond basic rendering.
- **Week 6:** Files 12, 13, 15, 16. MSM, permissions, content and experience fragments — multi-site and content-modelling concerns.
- **Week 7:** Files 27, 28. Testing and code quality — start writing real tests for the components you built in weeks 1–6, not just reading about testing.
- **Week 8:** Files 14, 17, 18. Cloud Service, the Sling Model Exporter, replication — how content actually gets to a live, cloud-hosted publish tier.

**Milestone at day 60:** you can write a unit test for a Sling Model from scratch, explain the difference between 6.5 and Cloud Service without hesitation, and describe how content moves from an author's click to a visitor's browser.

### Days 61–90 — Depth and interview readiness: infrastructure, security, and rehearsal

- **Week 9:** Files 19, 20, 21. Dispatcher/CDN, JCR/Oak, querying — the infrastructure layer that turns "I've used AEM" into "I understand what's underneath it."
- **Week 10:** Files 22, 23, 24, 25. Core Components, resource resolution, headless/GraphQL, Maven/packaging — rounding out the technical breadth.
- **Week 11:** Files 26, 29, 31. Cloud Manager/CI-CD, security, and system design — the senior-leaning topics that show up more as you interview higher, and that differentiate a 3-year candidate from a 4-year one.
- **Week 12:** Full rehearsal. Redo every file's section 21 (Mock Interview) out loud. Redo section 4's cross-questions from memory, not from the page. Write out your own real project stories for every file's section 7, in full, before you walk into a real interview.

**Milestone at day 90:** you can take a cold, unscripted "walk me through your project's architecture" and answer for five minutes without notes, handle at least three levels of follow-up on any topic in this repository, and tell at least six real, specific stories from your own work — not the templates.

---

## If your timeline is shorter

If you have four to six weeks rather than three months, prioritise in this order: **01, 05, 06, 07, 08** (the load-bearing core), then **02, 03, 04, 27** (the day-to-day authoring and testing surface), then **13, 14, 18, 19** (the infrastructure questions that come up in nearly every interview regardless of seniority), then as much of the rest as time allows, weighted toward **28, 29, 30** if your Java is genuinely still developing. System design (31) and Cloud Manager depth (26) are the safest topics to compress if you're short on time — they matter more as you interview for more senior or platform-adjacent roles.

---

## Final note

Four years of support work means you already have the instinct this whole repository is trying to teach: **the question "why did this actually break" is more valuable than "what's the syntax."** Every file here is built around that instinct on purpose. Trust it, bring your own real incidents into every story template, and treat the mock interviews as rehearsal, not reading material — by the time you're through all 31 files properly, the gap between "I've supported AEM for four years" and "I can develop on AEM" will be a lot smaller than it feels today.

---

*The AEM Interview Preparation repository. 31 files. Teaching style, energy-sector project domain, written for a real transition from AEM support to AEM development.*
