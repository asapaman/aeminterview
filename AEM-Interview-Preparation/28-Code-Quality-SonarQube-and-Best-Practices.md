# 28 – Code Quality, SonarQube and Best Practices

> **Target:** 3–4 years experienced AEM Developer
> **Covers from your additional list:** the Cloud Manager code quality gate in depth, SonarQube and OakPAL rules that matter in practice, and coding standards / review habits.
> **Project domain:** a global energy technology company's marketing site.

---

## Before we start — the gap between "it works" and "it passes the gate"

Files 26 and 27 both ended by pointing here, and for the same reason: a pipeline that builds successfully and a pipeline that clears the code quality gate are two different achievements. You can write a Sling Model that does exactly what the ticket asked, test it thoroughly, and still watch a Cloud Manager pipeline stop dead at Code Quality because of something the ticket never mentioned — an unclosed `ResourceResolver`, a cognitive-complexity score on a method nobody thought was complicated, or a security hotspot on a line that's actually fine but was never explicitly marked reviewed.

**The honest framing for an interview:** SonarQube and OakPAL aren't obstacles bolted onto AEM development — they're automating a review a senior developer would have done by hand anyway, at a speed and consistency no human review cadence can match. Knowing *what* they actually check, and *why* those specific things, is what turns "the pipeline failed" from a mystery into a five-minute fix.

---

## 1. Introduction

### 1.1 Where this sits relative to file 26

File 26 established the shape: Code Quality is the second gate in the pipeline, it runs SonarQube plus OakPAL, and it can block a deployment before anything reaches Stage. This file is what's actually inside that gate — the categories of finding that matter for AEM/Java code specifically, and the habits that keep you from meeting them for the first time in a failed pipeline run.

### 1.2 Two tools, two different questions

- **SonarQube asks:** "Is this code well-written?" — bugs, vulnerabilities, code smells, test coverage, duplication.
- **OakPAL asks:** "Will this package do the right thing to the repository?" — filter correctness, forbidden paths, package structure.

Both show up as "Code Quality gate failed," and confusing which one flagged a problem wastes real debugging time — a theme file 26 already introduced and this file makes concrete with actual rule categories.

### 1.3 A real project example

**Requirement.** A new servlet needed to query products by category for an internal tool.

**What made it a code-quality story, not just a code story.** The first version worked correctly in every manual test. The pipeline blocked it anyway — a **security hotspot** on a line building a JCR-SQL2 query by concatenating a request parameter directly into the query string, and a **code smell** on the servlet's `doGet` method, which had grown to a cognitive complexity score well past the threshold after several conditional branches were added over two sprints.

**The fix.** The query was rewritten to bind the parameter safely rather than concatenate it (file 21's territory, but a Sonar rule catches it independently of whether it happens to be exploitable in this specific case — the rule doesn't know that, and shouldn't have to). The method was split into three smaller ones, each doing one part of the validation.

**The lesson.** Neither finding was wrong to raise, even though neither was actively causing a production bug that day. That's the point of the gate — catching a pattern before it becomes an incident, not after.

---

## 2. Core Concepts

### 2.1 What SonarQube actually measures

Five categories, and knowing the names cold matters because interviewers ask for them directly:

- **Bugs** — code that's likely to behave incorrectly (a null pointer risk, a resource that's opened but not always closed on every path).
- **Vulnerabilities** — a demonstrated security weakness (e.g., a query built by string concatenation from user input).
- **Security Hotspots** — code that *needs a human to look at it* to decide if it's actually a vulnerability in context — not an automatic fail, but a required, explicit review.
- **Code Smells** — maintainability problems that aren't bugs yet: high cognitive complexity, duplicated logic, an oversized class, a method with too many parameters.
- **Coverage & Duplication** — percentage of new code exercised by tests, and percentage of code that's a near-duplicate of code elsewhere.

### 2.2 "New Code," not "all code" — the single most important concept in this file

Adobe's Cloud Manager quality gate is built around **Clean as You Code**: thresholds apply to **new or changed code in this pull request**, not a retroactive score for the entire codebase. This is why a ten-year-old AEM 6.5-to-Cloud-Service migration with plenty of historical debt can still ship through Cloud Manager cleanly — the gate isn't asking "is this whole codebase perfect," it's asking "did you make it worse."

**Why this matters practically:** it means you cannot blame a blocked pipeline on "legacy code that was already like that." If the gate is failing, the finding is almost always on a line your diff touched. It also means refactoring a large old method you didn't otherwise need to touch can backfire — touching it pulls its pre-existing debt into the "new code" window and can surface old smells as if they were new.

### 2.3 Quality Profile vs. Quality Gate — two different Sonar concepts people conflate

- A **Quality Profile** is the *set of rules* being applied — Adobe ships an AEM-specific profile with rules tuned for Sling, OSGi, and JCR patterns, on top of the general Java profile.
- A **Quality Gate** is the *pass/fail threshold* applied to a scan's results — e.g., zero new blocker bugs, all new security hotspots reviewed, coverage on new code above a set percentage.

You can have a rule fire (profile) without it failing the build (gate), if it's below the severity the gate cares about. Interviewers who ask "what's the difference between a profile and a gate" are checking whether you've actually read a Sonar report or just seen the word "SonarQube" in a pipeline log.

### 2.4 The AEM-specific findings that come up again and again

Building on the pattern file 14 already named ("deprecated API use, admin sessions, package structure"), the recurring, AEM-specific findings worth recognising on sight:

- **Unclosed `ResourceResolver`** — acquired via `resourceResolverFactory.getServiceResourceResolver(...)` and never closed on every code path, including exception paths. This is the JCR session leak from file 20, caught statically before it ever exhausts a session pool in production.
- **Use of `getAdministrativeResourceResolver()`** or equivalent admin-session shortcuts — deprecated and flagged, because it bypasses the service-user permission model file 13 covers, and because it doesn't work at all in some Cloud Service contexts.
- **Deprecated Sling/AEM API usage** — a method or class marked `@Deprecated` still compiles and runs, but Sonar flags the call so it doesn't quietly survive into a version where it's removed entirely.
- **`System.out.println` or raw exception printing** instead of a proper SLF4J logger call — a code smell, because it bypasses log level control and doesn't show up in the log aggregation Cloud Manager relies on.
- **High cognitive complexity** on `doGet`/`doPost` methods and Sling Model `@PostConstruct` methods specifically, because those are exactly the methods that accumulate one more `if` every sprint until nobody can trace the logic.
- **Hardcoded configuration values** (a URL, a path, a credential-shaped string) instead of an OSGi `@ObjectClassDefinition` property (file 06) — flagged as both a smell and, for anything credential-shaped, a security hotspot.

### 2.5 What OakPAL adds on top, restated with more rule detail

File 26 introduced OakPAL as "structural package validation." The categories worth naming specifically:

- **Filter validity** — every path a package actually writes to must be covered by a declared filter root; OakPAL can catch content that would install outside the declared scope.
- **Forbidden paths** — writes to paths a project has explicitly disallowed (a common project-level rule: nothing should ever be packaged under `/home`, echoing file 25's data-protection point).
- **Import mode correctness** — flags a `ui.content` filter without `mode="merge"` where the project's own OakPAL configuration requires it, catching file 25's "deployment that deleted a week of content" story *before* the package is ever installed anywhere.
- **Node type sanity** — content using node types the project doesn't expect, often a sign of copy-pasted content from a different environment or a botched export/import.

### 2.6 Review habits beyond the automated gate

Tooling catches patterns; it doesn't catch judgment. A senior reviewer still asks questions no rule engine asks: *does this Sling Model handle a half-filled multifield the way file 05 warned about? does this new service user actually need write access, or was `jcr:all` granted out of convenience?* The gate is a floor, not a substitute for a human reviewing the change with the same production-mindedness this whole repository has been building toward.

---

## 3. Internal Working

### 3.1 How the "new code" delta is actually computed

Sonar compares the branch being analysed against a **baseline** — typically the last analysis of the branch it will merge into. Lines that differ from that baseline are "new code"; everything else is "overall code," measured but not gate-enforced. This is why the gate result can change *without you changing your code* — if the baseline branch moves (someone else merges), your diff's boundary against it can shift too.

### 3.2 Local analysis versus the pipeline's analysis

A `sonar-maven-plugin` (or a standalone `sonar-scanner`) run locally, pointed at the same Sonar server and using the same quality profile, produces the same findings the pipeline would — which is exactly why file 26 recommended running it before opening a pull request. The pipeline's run is authoritative for the gate decision; a local run is a rehearsal, not a substitute.

### 3.3 Marking a finding reviewed versus fixing it

A **bug** or **code smell** is resolved by changing the code — there's no "acknowledge and move on" option that clears the gate. A **security hotspot** is different by design: because it needs human judgment about context, Sonar requires it to be explicitly marked **Reviewed** (safe, with a reason) or **Fixed**, in the tool itself, before the gate treats it as resolved. Silently ignoring a hotspot leaves the gate blocked; there's no bypass at the pipeline level (consistent with file 26 — no gate has a bypass).

### 3.4 Where coverage numbers actually come from

The coverage percentage reported to Sonar comes from a test-coverage tool (typically JaCoCo) run during the Maven build — the same unit tests file 27 covers. Coverage is computed only for **new code**, meaning a change that adds 40 untested lines to an existing well-tested class can still fail the gate, even though the class's overall coverage number looks fine.

---

## 4. Important Interview Questions

### 4.1 Basic

**Q1. What does SonarQube check?**
Bugs, vulnerabilities, security hotspots, code smells, and coverage/duplication on new code.

*Cross:* What's the difference between a bug and a vulnerability? (**a bug is likely-incorrect behaviour; a vulnerability is a demonstrated security weakness**) · What's a hotspot? (needs human review, not an automatic fail) · What's a code smell? (a maintainability risk, not a bug)

**Q2. What's the difference between SonarQube and OakPAL?**
SonarQube checks code quality; OakPAL checks the structural correctness of the built content packages.

*Cross:* Which one would catch a missing `mode="merge"`? (**OakPAL, if configured for it**) · Which would catch high cognitive complexity? (SonarQube) · Do they run in the same gate? (yes — both under "Code Quality")

**Q3. What does "Clean as You Code" mean?**
The quality gate enforces thresholds on new or changed code in the current change, not the whole codebase's historical debt.

*Cross:* Why does that matter for a migrated legacy project? (**old debt doesn't block a new pull request**) · What's the risk of refactoring an old method you didn't need to touch? (pulls its pre-existing debt into the "new code" window) · Is overall code measured at all? (yes, just not gate-enforced)

**Q4. What's a common AEM-specific finding you'd expect Sonar to flag?**
An unclosed `ResourceResolver` on some code path, including exceptions.

*Cross:* Why is that dangerous at runtime? (**session/connection exhaustion — file 20**) · What's the fix pattern? (try-with-resources, or a finally block that always closes) · What else gets flagged similarly? (admin session shortcuts)

**Q5. What's the difference between a Quality Profile and a Quality Gate?**
A profile is the rule set being applied; a gate is the pass/fail threshold on the results.

*Cross:* Can a rule fire without failing the build? (**yes — if it's below the gate's severity threshold**) · Who defines the AEM profile? (Adobe, on top of the general Java rules) · Can a gate be different per project? (yes, on some Cloud Manager tiers)

### 4.2 Intermediate

**Q6. A pipeline fails on a security hotspot you believe is a false positive. What do you do?**
Mark it reviewed in SonarQube itself, with a documented reason — you can't bypass the gate, but you can resolve the hotspot once a human has actually judged it safe.

*Cross:* Is that the same as fixing a bug finding? (**no — bugs and smells require an actual code change**) · What if you're wrong and it's exploitable? (the documented reason is exactly what a later reviewer checks) · Can this be done outside the tool? (no)

**Q7. Your coverage on new code is below threshold even though the class overall has good coverage. Why?**
Coverage is measured on new code specifically — adding untested lines to an otherwise well-tested class still fails if those new lines aren't covered.

*Cross:* What's the fix? (write tests for the new lines, per file 27) · Does refactoring an untested old method count against you? (**it can, since touching it makes it "new"**) · Where does the coverage number come from? (JaCoCo, during the Maven build)

**Q8. Why does refactoring an old, untouched-in-years method sometimes make your pull request fail the gate?**
Because touching it pulls its lines into the "new code" comparison window, surfacing pre-existing debt as if you'd just introduced it.

*Cross:* Is this a reason not to refactor? (**no — it's a reason to expect and budget for it, sometimes splitting the refactor from feature work**) · What's the alternative? (a separate, dedicated refactor change, reviewed on its own terms) · Does this apply to OakPAL too? (less so — it's package-level, not line-level)

**Q9. What's the practical difference between running Sonar locally and letting the pipeline run it?**
A local run against the same server and profile produces the same findings, ahead of time — the pipeline's run is what actually decides the gate, but a local run avoids discovering findings only after a full pipeline execution.

*Cross:* Why not skip local checks and just rely on the pipeline? (**every round trip costs a full pipeline run's time — file 26**) · What tool runs it locally? (`sonar-maven-plugin` / `sonar-scanner`) · Does it need the same profile? (yes, or the results won't match)

**Q10. Name an OakPAL check beyond "filter validity."**
Forbidden paths (e.g., nothing under `/home`), import mode correctness (catching a missing `mode="merge"` on mutable content), and node type sanity.

*Cross:* Which of those maps directly to file 25's content-deletion story? (**import mode correctness**) · Is OakPAL configurable per project? (yes) · Does it run against source or built packages? (built packages)

### 4.3 Advanced

**Q11. Design a team review process that uses both automated gates and human review effectively.**
*(The 6.1-style answer: automated gates catch consistent, mechanical patterns — leaks, complexity, hotspots — freeing human review to focus on judgment: does this handle the half-filled multifield, is this permission actually needed, does this fit the architecture. Neither replaces the other.)*

*Cross:* What happens if a team treats a green pipeline as "reviewed"? (**judgment-level issues ship anyway — the gate isn't a substitute for review**) · What should a human reviewer specifically look for that Sonar can't? (architectural fit, business-logic correctness, the empty/edge cases file 05 and 27 emphasise) · Should review happen before or after the pipeline runs? (both have value — review before merge, gate before deploy)

**Q12. Why does Adobe enforce an AEM-specific Sonar profile rather than just the generic Java rules?**
Because generic Java rules don't know about Sling/OSGi/JCR-specific risk patterns — an admin session shortcut or an unclosed `ResourceResolver` isn't a general Java anti-pattern, it's an AEM-specific one that only a profile aware of the platform would catch.

*Cross:* Give another AEM-specific pattern a generic profile would miss. (a HTL context-escaping mismatch, or a service user granted more privilege than it uses) · Does the AEM profile replace the general Java rules, or add to them? (**adds to them**) · Would you expect the same profile on a Cloud Service and a 6.5 project? (broadly yes, though Cloud Service adds OakPAL emphasis)

---

## 5. Cross Questions — how this topic gets drilled

The most common chain starts from a blocked pipeline: **"Your pipeline failed at Code Quality — what do you check first?"** → *Is it a Sonar finding or an OakPAL finding?* → *If Sonar, is it new code or old?* → *Bug, smell, or hotspot?* → *If a hotspot, what do you actually do about it?* (**mark it reviewed with a reason, in the tool**)

A second chain tests whether "Clean as You Code" is actually understood: **"Does the quality gate expect a perfect codebase?"** → *So why does an old, messy method sometimes still cause a failure?* → *(touching it in this diff pulled it into the new-code window)* → *Is that a flaw in the gate?* (**no — it's the gate correctly treating anything you touched as your responsibility now**)

A third, more senior chain: **"If the pipeline is green, is the code good?"** → *What does the gate not check?* (business logic correctness, architectural fit, whether an edge case is actually handled) → *So what's the role of human code review, if the gate already runs?* → *(mechanical patterns vs. judgment — different tools for different problems)*

---

## 6. Best Interview Answers

**"What does the Cloud Manager code quality gate actually check?"** — *about 70 seconds*

> "Two tools, two different questions. SonarQube asks whether the code itself is well-written — bugs, vulnerabilities, security hotspots that need a human judgment call, code smells like high cognitive complexity or duplication, and test coverage. OakPAL asks a completely different question — whether the built content package will do the right thing to the repository: does it write only where its filter says it will, does it avoid forbidden paths, is the import mode correct for mutable content.
>
> The concept that matters most in practice is 'Clean as You Code' — the gate enforces thresholds on new or changed code in your pull request, not a retroactive score for the whole codebase. That's what lets a codebase with real legacy debt still ship cleanly through the pipeline, as long as you're not making it worse. It also means refactoring an old, untouched method can unexpectedly surface old debt as if it were new, because touching it pulls it into that comparison window."

**"You've never used Cloud Manager, but you've used SonarQube before. What would carry over?"** — *about 55 seconds*

> "Most of it, honestly. The core Sonar concepts — bugs versus vulnerabilities versus smells, new-code-based gates, marking a hotspot reviewed rather than trying to make it disappear — are the same regardless of platform. What's specific to AEM is the rule set: an unclosed `ResourceResolver`, an admin session shortcut, a hardcoded config value that should be an OSGi property. Those are patterns generic Java rules wouldn't know to flag, which is why Adobe ships its own quality profile layered on top of the standard one. And OakPAL is the genuinely new piece — there's no equivalent in a typical Java project, because most projects don't deploy content packages that can structurally delete production data if their filter is wrong."

---

## 7. Real Project Examples

### Story 1 — The coverage number that was technically true and practically useless

**What happened.** A pull request added a new Sling Model with full unit test coverage — 100% on the new class. The pipeline still failed the coverage check.

**The cause.** The new model called an existing utility method that had never been covered, and that method's uncovered lines happened to sit inside the diff's line range because a minor unrelated formatting change touched the same file. That pulled the old method's lines into "new code," and they dragged the new-code coverage percentage down.

**What we changed.** Formatting-only changes to files with pre-existing coverage gaps are now kept in separate, dedicated commits rather than bundled with feature work — so a feature's coverage number reflects the feature, not an incidental touch to unrelated lines.

**The lesson to state:** *"A 100% covered new class can still fail the coverage gate if it shares a diff with lines that weren't yours to begin with. Keep unrelated changes in separate commits."*

### Story 2 — The security hotspot that really was fine, and the one that wasn't

**What happened.** Two pull requests in the same sprint both got flagged with a security hotspot on a URL being built from a request parameter.

**The first one.** The parameter was a fixed, validated enum value used to pick between three known internal paths — genuinely safe, and marked Reviewed with that reasoning.

**The second one.** The parameter was passed straight through into an outbound HTTP call with no validation at all — an actual vulnerability, not a false positive, caught before it ever reached Stage.

**Why this story matters.** Treating every hotspot as "probably a false positive, mark it and move on" would have let the second one through. The tool doesn't distinguish; a human has to, every time.

**The lesson to state:** *"A security hotspot isn't a false alarm by default — it's a flag that says 'a human needs to decide this one,' and the decision has to actually happen, not be rubber-stamped."*

### Story 3 — The OakPAL failure that caught a repeat of file 25's incident before it happened

**What happened.** A pull request added sample content under `/content/energy/campaigns` without `mode="merge"` on the filter — exactly the pattern that caused file 25's week-of-content deletion, except this time it never reached a real environment.

**The cause.** A developer copied an existing filter entry as a starting point and didn't notice the original didn't have `mode="merge"` either, because it happened to cover a path nothing else had ever touched.

**Why OakPAL caught it.** The project's OakPAL configuration specifically checks that filters under `/content` declare `mode="merge"`, precisely because of the earlier incident — a rule added *in response to* a production problem, which is exactly how a mature quality gate configuration should evolve.

**The lesson to state:** *"The best OakPAL rules in a real project are the ones written after something actually went wrong once. If your project has had a content-deletion incident and doesn't have a rule preventing a repeat, that's a gap worth closing."*

---

## 8. Coding Examples — common findings and their fixes

### 8.1 Unclosed ResourceResolver → try-with-resources

```java
// FLAGGED: resolver is never closed if getProducts() throws
public List<Product> loadProducts() throws LoginException {
    ResourceResolver resolver = resolverFactory.getServiceResourceResolver(AUTH_INFO);
    return getProducts(resolver); // if this throws, resolver leaks forever
}

// FIXED: try-with-resources guarantees close() on every exit path,
// including an exception — this is the file 20 leak, closed at the source.
public List<Product> loadProducts() throws LoginException {
    try (ResourceResolver resolver = resolverFactory.getServiceResourceResolver(AUTH_INFO)) {
        return getProducts(resolver);
    }
}
```

### 8.2 Admin session shortcut → service user

```java
// FLAGGED: bypasses the service-user permission model entirely (file 13),
// and doesn't work the same way in every Cloud Service context.
ResourceResolver resolver = resolverFactory.getAdministrativeResourceResolver(null);

// FIXED: a named service user with exactly the permissions this code needs.
Map<String, Object> authInfo = Collections.singletonMap(
    ResourceResolverFactory.SUBSERVICE, "product-catalog-service");
ResourceResolver resolver = resolverFactory.getServiceResourceResolver(authInfo);
```

### 8.3 High cognitive complexity → extracted methods

```java
// FLAGGED: one method doing validation, lookup, and formatting,
// with nested conditionals that accumulated over several sprints.
public String renderPrice(Resource resource) {
    if (resource != null) {
        ValueMap vm = resource.getValueMap();
        if (vm.get("price", Double.class) != null) {
            double price = vm.get("price", Double.class);
            if (price > 0) {
                if (vm.get("currency", String.class) != null) {
                    // ... more nesting to format currency-specific output
                }
            }
        }
    }
    return "";
}

// FIXED: each responsibility split into its own small, testable method.
// Cognitive complexity drops because each method reads as one clear idea,
// and each one can be unit tested in isolation (file 27's territory).
public String renderPrice(Resource resource) {
    if (resource == null) return "";
    Double price = resource.getValueMap().get("price", Double.class);
    if (price == null || price <= 0) return "";
    String currency = resource.getValueMap().get("currency", String.class);
    return formatCurrency(price, currency);
}

private String formatCurrency(double price, String currency) {
    // ... formatting logic alone, easy to reason about and test
    return String.format("%.2f %s", price, currency != null ? currency : "USD");
}
```

### 8.4 Hardcoded configuration → OSGi property

```java
// FLAGGED as both a smell and a hotspot if it looks credential-shaped.
private static final String API_ENDPOINT = "https://internal-api.example.com/v2/products";

// FIXED: an OSGi configuration property (file 06), so the value
// is environment-specific and never hardcoded into compiled code.
@ObjectClassDefinition(name = "Product Catalog Service Config")
@interface Config {
    @AttributeDefinition(name = "API Endpoint")
    String apiEndpoint() default "";
}
```

---

## 9. Common Mistakes

| Mistake | Why it happens | The actual cost |
|---|---|---|
| Treating a security hotspot as a false positive by default | It doesn't fail the build automatically, so it feels optional | An actual vulnerability shipped because nobody genuinely reviewed the flag |
| Refactoring an old, untouched method inside a feature pull request | Seemed convenient while already in the file | Unrelated pre-existing debt surfaces as "new code" and fails the gate |
| Assuming 100% coverage on a new class guarantees the coverage gate passes | Doesn't account for shared-diff lines from other files | A coverage failure that looks inexplicable until the diff is checked line by line |
| Confusing an OakPAL failure for a SonarQube failure | Both appear under "Code Quality" | Time spent reviewing code style when the real issue is a package filter |
| Relying only on the pipeline to catch findings | No local Sonar setup | Every fix costs a full pipeline run instead of a local one |
| Copy-pasting an existing filter entry without checking its `mode` attribute | Assumed it was already correct | Repeats file 25's content-deletion pattern, sometimes caught only by luck |
| Using `getAdministrativeResourceResolver()` for convenience during a quick fix | Faster to write than setting up a service user | Flagged, and in some Cloud Service contexts doesn't behave as expected anyway |
| Writing one large method instead of several small ones under deadline pressure | Feels faster in the moment | Cognitive complexity findings later, and a method nobody wants to touch |

---

## 10. Best Practices

- **Run Sonar locally before opening a pull request**, using the same profile the pipeline enforces — catching a finding on your own machine costs minutes; catching it in the pipeline costs a full run.
- **Treat every security hotspot as requiring an actual decision**, documented with a reason when marked reviewed — never a reflexive dismissal.
- **Keep refactoring separate from feature work** where possible, so old debt surfacing as "new code" doesn't block an unrelated feature.
- **Always close a `ResourceResolver` (or JCR `Session`) with try-with-resources**, on every code path, without exception.
- **Never use an admin-session shortcut** — use a named service user scoped to exactly what the code needs (file 13).
- **Push configuration, not hardcoded values, into OSGi properties** — anything environment-specific or credential-shaped belongs there, not in compiled code.
- **Write OakPAL rules in response to real incidents**, the way the `mode="merge"` check in Story 3 was — a quality gate configuration should get stricter exactly where the project has actually been burned before.
- **Don't treat a green pipeline as equivalent to "reviewed."** The gate catches mechanical patterns; a human still needs to judge architectural fit and business-logic correctness.

---

## 11. Debugging Tips

| Symptom | Where to look | What it usually means |
|---|---|---|
| "Code Quality gate failed" with no obvious code problem | The OakPAL section of the report, not just Sonar | A package filter/structure issue, not a code style issue |
| Coverage failure on a class that looks well-tested | The diff's exact line range, not just the class overall | Uncovered lines from another part of the same file got pulled into "new code" |
| A finding on a line you didn't write | Whether the file was touched by an unrelated formatting or refactor change | The "Clean as You Code" new-code window pulling in old debt |
| A security hotspot that seems clearly safe | Whether it's actually been marked Reviewed in Sonar, not just judged safe by eye | The gate only clears once the tool itself records the review |
| Repeated findings of the same type across a team | The team's shared coding habits, not individual mistakes | Worth a five-minute team conversation rather than five individual fixes |

---

## 12. Performance Notes

- Running Sonar analysis locally adds build time, but it's minutes against the alternative of a full pipeline round trip that can take much longer end to end (file 26).
- A large, uninterrupted refactor pull request analyses slower and risks pulling more old debt into the new-code window than several smaller, focused ones.
- Coverage instrumentation (JaCoCo) adds modest overhead to the test run itself — negligible next to the cost of discovering a coverage gap only in the pipeline.

---

## 13. Real Production Scenarios

1. A pipeline blocks on a bug finding for a null pointer risk that "would never actually happen" given how the method is called today — fix it anyway, because the rule doesn't know about today's callers, only tomorrow's.
2. A security hotspot is raised on a query built partly from a hardcoded string and partly from a parameter — check the parameter's actual source before assuming it's safe.
3. A team disagrees about whether to refactor a large legacy class while adding one new method to it — separate the two changes into different pull requests to avoid pulling the whole class into "new code."
4. Coverage fails on a pull request that added no new logic, only configuration — check whether a formatting change on an existing file dragged in uncovered lines.
5. An OakPAL rule blocks a package because a new sample-content filter under `/content` is missing `mode="merge"` — this is the gate doing exactly its job; add the attribute.
6. A developer wants to suppress a whole category of Sonar rule project-wide because it's "too noisy" — investigate why it's firing so often before suppressing it; noise is often a sign of a real, repeated pattern.
7. A security hotspot sits unreviewed for weeks because nobody owns the decision — assign hotspot review explicitly as part of the pull request review process, not as an afterthought.
8. A new servlet duplicates logic that already exists in a service class — a duplication finding catches this before it becomes two copies to maintain and fix separately later.
9. A pull request author marks their own security hotspot as reviewed without a second person looking — for anything genuinely sensitive, get a second reviewer regardless of what the tool allows.
10. A cognitive-complexity finding appears on a method that's actually simple but has many short conditional branches — extracting even simple branches into named methods often reads better and reduces the score, worth doing rather than arguing with the number.
11. An admin-session call survives review because it's in a rarely-touched migration script — flag it anyway; scripts get copied as templates for new code more often than anyone expects.
12. Two pull requests from different developers both flag the same finding type in the same sprint — worth a short team note on the pattern rather than two separate fixes with no shared learning.

---

## 14. Follow-up Questions

- Why does Adobe enforce quality gates rather than leaving code review as the only check? (consistency and speed — a rule engine never skips a check because of a deadline)
- What's the risk of a team routinely marking hotspots "reviewed" without real scrutiny? (the gate becomes theatre — a real vulnerability eventually gets waved through the same way)
- Why measure coverage on new code instead of overall code? (so a legacy codebase with historical gaps can still ship, as long as new work is tested)
- What should happen when a Sonar rule and a team's own judgment disagree? (mark it reviewed with a documented reason, rather than silently ignoring or blindly obeying)

---

## 15. Comparison Tables

| | **Bug** | **Vulnerability** | **Security Hotspot** | **Code Smell** |
|---|---|---|---|---|
| What it means | Likely-incorrect behaviour | Demonstrated security weakness | Needs human judgment to classify | Maintainability risk, not incorrect |
| Blocks the gate automatically? | Yes, at blocker/critical severity | Yes | Only if left unreviewed | Yes, at higher severities |
| Fixed by | Changing the code | Changing the code | Marking Reviewed or Fixed | Changing the code |

| | **Quality Profile** | **Quality Gate** |
|---|---|---|
| What it is | The rule set applied | The pass/fail threshold |
| Who sets it | Adobe (AEM-specific + general Java) | Adobe defaults, configurable on some tiers |
| Can it vary per project? | Rarely | Sometimes |

| | **SonarQube** | **OakPAL** |
|---|---|---|
| Checks | Code quality | Package structure |
| Runs against | Source and compiled code | Built content packages |
| Catches | Leaks, complexity, hotspots, duplication | Filter errors, forbidden paths, node types |

| | **New Code** | **Overall Code** |
|---|---|---|
| Gate-enforced? | Yes | No (measured, not enforced) |
| Comparison baseline | The branch being merged into | N/A |
| Why it exists | Lets legacy debt ship without blocking new work | Historical visibility only |

---

## 16. Memory Tricks

- **"Sonar asks if the code is good; OakPAL asks if the package is safe."**
- **"New code, not old code."** The gate is about what you touched, not the whole codebase's history.
- **"A hotspot needs a decision, not a dismissal."** Reviewed-with-a-reason, never a reflexive click.
- **Profile = rules. Gate = threshold.** Easy to say out loud, easy to lose under pressure without the rhyme.

---

## 17. Revision Notes

The Cloud Manager Code Quality gate runs two tools: SonarQube, checking code (bugs, vulnerabilities, security hotspots, code smells, coverage, duplication), and OakPAL, checking the structural correctness of built content packages (filter validity, forbidden paths, import mode, node types). SonarQube's gate is built on "Clean as You Code" — thresholds apply to new or changed code compared against a baseline branch, not the whole codebase's history, which is why legacy debt doesn't block new work but touching an old method can unexpectedly pull its debt into scope. A Quality Profile is the rule set; a Quality Gate is the pass/fail threshold on the results. AEM-specific findings worth recognising on sight: unclosed `ResourceResolver`s, admin-session shortcuts, deprecated API usage, hardcoded configuration that should be an OSGi property, and high cognitive complexity on servlet and Sling Model methods. Security hotspots require explicit human review recorded in the tool — there's no automatic pass and no bypass. None of this replaces human code review, which still has to judge architectural fit and business-logic correctness the gate structurally cannot check.

---

## 18. Cheat Sheet

```text
SONARQUBE CATEGORIES
  Bug              — likely incorrect behaviour
  Vulnerability    — demonstrated security weakness
  Security Hotspot — needs human review, not auto-fail
  Code Smell       — maintainability risk

GATE SCOPE
  New code only (Clean as You Code) — not the whole codebase

AEM-SPECIFIC FINDINGS TO KNOW
  Unclosed ResourceResolver / Session
  getAdministrativeResourceResolver() usage
  Deprecated API calls
  Hardcoded config instead of an OSGi property
  High cognitive complexity in doGet/doPost/@PostConstruct

OAKPAL CATEGORIES
  Filter validity · Forbidden paths · Import mode · Node type sanity

RESOLVING A FINDING
  Bug/Smell/Vulnerability → fix the code
  Security Hotspot        → mark Reviewed (with a reason) or Fixed, in the tool

NO BYPASS — same rule as the pipeline itself (file 26)
```

---

## 19. Frequently Forgotten Things

1. The gate enforces **new code**, not the whole codebase — legacy debt alone doesn't block a pull request.
2. Touching an old, untested method pulls its lines into the "new code" window and can surface old debt as if it were new.
3. A security hotspot needs an explicit, recorded review — not a default assumption of safety.
4. OakPAL and SonarQube are different tools catching different problems, both under the same "Code Quality" label.
5. Coverage is measured on new code specifically — a well-covered class can still fail if new, untested lines were added.
6. There's no bypass for a blocked gate, same as the pipeline itself has none (file 26).
7. `getAdministrativeResourceResolver()` is a flagged pattern, not a convenient shortcut, and it doesn't behave identically everywhere on Cloud Service.
8. A green pipeline is not the same as "properly reviewed" — the gate can't judge architectural fit or business logic.

---

## 20. Final Interview Summary

The Cloud Manager Code Quality gate is two tools doing two different jobs: SonarQube judging the code itself, OakPAL judging what the built package would actually do to the repository. The single concept that unlocks most of the rest is "Clean as You Code" — the gate cares about what your change touched, not your project's entire history, which is why legacy debt survives but touching old code can unexpectedly pull its debt into scope. The AEM-specific findings worth recognising on sight — unclosed `ResourceResolver`s, admin-session shortcuts, hardcoded config, high cognitive complexity — are the same patterns a careful senior reviewer would flag by hand; the tooling just does it faster and every single time. None of it replaces human review, and saying that plainly in an interview is more convincing than pretending a green pipeline means the code is finished being reviewed.

---

## 21. Mock Interview

**Q1. What's the difference between SonarQube and OakPAL in the Cloud Manager pipeline?**
> "SonarQube looks at the code itself — bugs, vulnerabilities, hotspots that need a human decision, code smells, coverage. OakPAL looks at the built content package structurally — does it write only where its filter says, does it avoid forbidden paths, is the import mode right for mutable content. Both run under the same 'Code Quality' gate, but they're catching completely different classes of problem, and telling them apart quickly saves real debugging time when a pipeline blocks."

**Q2. Explain 'Clean as You Code.'**
> "The gate applies its thresholds to new or changed code in the current pull request, compared against a baseline branch — not a retroactive score for the whole codebase. That's what lets a project with real historical debt still ship cleanly, as long as you're not adding to it. The part that catches people out is that if you touch an old method for an unrelated reason, its pre-existing issues get pulled into that new-code comparison and can fail your pull request even though you didn't write that code."

**Q3. Name two AEM-specific things you'd expect a Sonar scan to flag that a generic Java scan wouldn't.**
> "An unclosed `ResourceResolver` on some exit path, and use of an admin-session shortcut like `getAdministrativeResourceResolver()`. Neither is a generic Java anti-pattern — they're specific to how Sling manages resource access and the service-user permission model, which is exactly why Adobe layers an AEM-specific quality profile on top of the standard Java rules rather than relying on the generic ones alone."

**Q4. A pipeline blocks on a security hotspot you're confident is safe. What do you actually do?**
> "Mark it Reviewed in SonarQube with a documented reason — I don't get to just decide it's fine in my head and move on, because the gate specifically requires that judgment to be recorded in the tool. And I'd actually think it through rather than treat it as a formality, because the next hotspot that looks similar might not be safe, and a habit of reflexively dismissing them is exactly how a real vulnerability gets waved through."

**Q5. Does a green Cloud Manager pipeline mean the code is good?**
> "It means the code meets a specific, mechanical bar — no blocking bugs, hotspots reviewed, coverage on new code, package structure sound. It doesn't mean the architecture is right, or that an edge case like a half-filled multifield is actually handled, or that a service user has exactly the permissions it needs and no more. Those are judgment calls a human reviewer still has to make. I'd treat the gate as a floor, not a finish line."

---

## Next topic

**Security best practices for AEM developers** — the security-specific patterns and mistakes this file touched on structurally (unclosed sessions, admin shortcuts, query injection) covered in depth, alongside AEM-specific concerns like XSS through HTL, CSRF protection, and dispatcher-level security already introduced in file 19.

---

*Topic 28 of the AEM Interview Preparation repository. Teaching style, energy-sector project domain.*
