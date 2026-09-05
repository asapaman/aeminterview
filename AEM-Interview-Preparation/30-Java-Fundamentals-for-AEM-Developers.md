# 30 – Java Fundamentals for AEM Developers

> **Target:** 3–4 years experienced AEM Developer
> **Covers from your additional list:** Java fundamentals — the language features that show up constantly in AEM code, built up properly for a developer whose Java is still a work in progress.
> **Project domain:** a global energy technology company's marketing site.

---

## Before we start — why this file exists, and what it deliberately isn't

File 27 already built JUnit and Mockito up from first principles, because "how do you test this" is a constant AEM interview question and it needed its own foundation. This file does the same thing for a different gap: the Java language features that show up *inside* the code being tested — collections, generics, exceptions, `equals`/`hashCode`, streams, and the concurrency rules that make an OSGi service safe or dangerous — without which a Sling Model or a service class is something you can copy-paste but not confidently modify or defend under a follow-up question.

**This is not a general Java course.** It's the specific slice of Java that keeps appearing across files 02 through 27 of this repository, explained once, properly, with the AEM context that makes it matter rather than abstract syntax rules. If a concept here feels familiar from an earlier file, that's intentional — this is where it gets the depth those files didn't have room for.

**Why this is worth taking seriously for your specific transition.** Support work rarely requires writing new Java — it requires reading logs, restarting things, and occasionally patching a config. Development work requires writing Java that another developer, and an interviewer, will read and question. The gap between "I can follow this code" and "I can defend a design decision in this code" is almost entirely the gap this file is trying to close.

---

## 1. Introduction

### 1.1 The shape of Java in a typical AEM class

Nearly every piece of AEM Java you'll write fits one of a small number of shapes: a Sling Model interface plus implementation, an OSGi service with a `@Reference` or two, a servlet handling a request, or a small utility class. All four shapes lean on the same underlying Java features repeatedly — collections to hold multifield values, generics to make an adapter or a service reusable, exceptions to signal what went wrong, and (for OSGi services specifically) an understanding of thread safety, because a service is typically a **singleton shared across every concurrent request**.

### 1.2 A real project example

**Requirement.** A Sling Model needed to expose a list of related products for a product detail page, deduplicated by product code, sorted by relevance score, with a sensible default when the multifield was empty.

**What made it a genuine Java exercise, not just an AEM one.** The naive version used a `List<Product>` and manually looped to deduplicate — nested loops, an `ArrayList.contains()` check inside the outer loop, and a bug where two `Product` objects with the same code but built by different code paths weren't recognised as equal because `equals()` had never been overridden.

**The fix.** Overriding `equals()` and `hashCode()` consistently based on product code, switching the intermediate collection to a `LinkedHashSet<Product>` for order-preserving deduplication, and expressing the sort and null-handling with a stream pipeline instead of manual loops.

**Why this is worth remembering as a story, not just a technique.** The bug wasn't in any AEM API — it was a textbook Java mistake (missing `equals()`/`hashCode()`) that happened to surface through an AEM component. That's the pattern this whole file exists to prepare you for: an interviewer asking "why doesn't this work" and the honest answer being pure Java, not Sling.

---

## 2. Core Concepts

### 2.1 Collections — which one, and why it matters in a Sling Model

- **`List`** — ordered, allows duplicates. The right choice when order matters and duplicates are meaningful — a multifield's raw contents, in authoring order.
- **`Set`** — no duplicates, and `LinkedHashSet` specifically keeps insertion order while still deduplicating, which is exactly what the product-list story above needed.
- **`Map`** — key-value lookup. AEM's `ValueMap` and `ResourceResolver`'s adaptables both lean on map-like structures, and a `Map<String, Object>` is the shape you'll build constantly for passing structured data (auth info to `getServiceResourceResolver`, for instance — file 13).

**Why the choice matters beyond style:** picking `List` when you actually need deduplication means writing manual dedup logic (and the bug the story above hit); picking `HashSet` when you need order means a page's product list silently re-orders itself between renders, because `HashSet` makes no order guarantee at all.

### 2.2 Generics — what they buy you, concretely

A method like `resource.adaptTo(ProductModel.class)` only compiles the way it does because `adaptTo` is generic — `<T> T adaptTo(Class<T> type)` — letting the same method return a `ProductModel`, a `Resource`, or any other type based purely on the `Class` argument, with the compiler enforcing the return type at the call site instead of you casting by hand. Without generics, every adaptation would return `Object` and need an explicit, unchecked cast — exactly the kind of thing that fails at runtime instead of compile time.

**The concept worth being able to state plainly:** generics move a class of error from runtime (a `ClassCastException` discovered when a page renders) to compile time (a type mismatch the IDE catches before you even save the file).

### 2.3 Exceptions — checked vs. unchecked, and why AEM APIs are full of both

- **Checked exceptions** (`LoginException`, `RepositoryException`) must be declared or caught — the compiler forces you to acknowledge them. AEM uses these for failures that are expected to happen sometimes under normal operation (a service user's configuration is wrong, a repository operation genuinely fails) and that calling code should be forced to think about.
- **Unchecked exceptions** (`RuntimeException` and its subclasses, like `NullPointerException`) don't need to be declared. They typically represent a programming error rather than an expected failure mode.

**The AEM-specific habit this explains:** `resourceResolverFactory.getServiceResourceResolver(...)` throws a checked `LoginException` precisely because a service user misconfiguration is a real, expected-to-sometimes-happen failure — not a bug — and the API design forces every caller to decide how to handle it rather than let it propagate as a surprise.

### 2.4 Try-with-resources — the mechanism behind file 20 and file 28's leak warnings

Both file 20 (JCR sessions) and file 28 (Sonar findings) treat an unclosed `ResourceResolver` as a serious, recurring bug. The Java mechanism that fixes it: any class implementing `AutoCloseable` (which `ResourceResolver` does) can be opened in a `try (...)` statement, and Java guarantees `close()` runs when the block exits — **on every path, including an exception** — without a `finally` block written by hand.

```java
// The exception-safe pattern used throughout this repository from file 05 onward.
try (ResourceResolver resolver = resolverFactory.getServiceResourceResolver(authInfo)) {
    return process(resolver);
} // close() is guaranteed here, whether process() returned normally or threw
```

### 2.5 `equals()` and `hashCode()` — the contract, and why breaking it is silent

Java's contract: if two objects are `equals()`, they **must** return the same `hashCode()`. Breaking this doesn't throw an error — it silently corrupts anything backed by a hash structure (`HashSet`, `HashMap`), because an object can be "equal" to another by your own logic while landing in a different hash bucket, meaning a `Set` never recognises them as duplicates and a `Map` lookup never finds an existing key.

**Why this is the exact bug in this file's opening story:** two `Product` instances representing the same product, built by different code paths, were logically the same product but were never recognised as such — because Java's default `equals()` (inherited from `Object`) compares object identity, not the fields you actually care about, unless you override it.

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Product)) return false;
    return Objects.equals(productCode, ((Product) o).productCode);
}

@Override
public int hashCode() {
    return Objects.hash(productCode);
}
```

### 2.6 Streams and lambdas — expressing "what," not "how"

A stream pipeline describes the *result* you want, letting the JVM handle the *mechanics* of the loop:

```java
// The opening story's fix, expressed as a pipeline: dedupe by product code,
// sort by relevance, and fall back to an empty list rather than null.
List<Product> related = Optional.ofNullable(rawRelatedProducts)
    .orElse(Collections.emptyList())
    .stream()
    .collect(Collectors.toMap(Product::getCode, p -> p, (first, second) -> first, LinkedHashMap::new))
    .values()
    .stream()
    .sorted(Comparator.comparingDouble(Product::getRelevanceScore).reversed())
    .collect(Collectors.toList());
```

**The habit worth internalising, not just the syntax:** a stream pipeline that reads like a sentence ("take these, keep the first by code, sort by relevance") is doing exactly what the nested-loop version did, but the intent is visible in the code itself rather than buried in loop-index bookkeeping — which is also why it's easier for a reviewer (or an interviewer reading your code live) to verify it's correct.

### 2.7 `Optional` — for return values, not for every variable

`Optional<T>` exists to make "this might not have a value" visible in a method's signature, forcing a caller to handle the missing case explicitly rather than risk a `NullPointerException` three calls later. The AEM-specific discipline: use it for a method's **return type** when absence is a normal outcome (`Optional<String> findConfiguredEndpoint()`), but don't scatter `Optional` fields or method parameters through a Sling Model — that's a well-known Java anti-pattern, and AEM's `@ValueMapValue` injection already has its own, simpler way to express "this property might be absent" (a default value, or `Optional<String>` specifically as an injectable field type, which the Sling Models framework supports directly).

### 2.8 Static vs. instance state — the concept that makes or breaks a thread-safe OSGi service

An OSGi component (file 06) is typically instantiated **once** and shared across every concurrent request the instance handles. That single fact changes how you're allowed to write it:

- An **instance field** that's mutated per-request (`private List<String> results;` set inside a method and read later) is shared, mutable state across every thread calling that service concurrently — a race condition waiting to happen, and one of the most common real bugs in AEM services written by developers used to request-scoped web frameworks where "one instance per request" is often the default assumption.
- A **local variable** inside a method, by contrast, is stack-allocated per call and inherently thread-safe — nothing to synchronise, because nothing is shared.

**The rule worth stating outright:** an OSGi service should be effectively **stateless** — instance fields should hold only immutable configuration (set once via `@Activate`, never mutated afterward), and any data specific to one request should live in local variables or be passed as parameters, never stored on the service instance.

### 2.9 A minimal, honest concurrency vocabulary

You don't need to be a concurrency expert for a 3-4 year AEM interview, but three terms come up and are worth being precise about:

- **`synchronized`** — a block or method that only one thread can execute at a time on a given object. A last resort for genuinely shared mutable state, and a performance cost if overused.
- **`volatile`** — guarantees a field's writes are visible to other threads immediately, without providing mutual exclusion. Used for simple flags, not compound operations.
- **`ConcurrentHashMap`** — a thread-safe map without needing to `synchronized` every access yourself, useful for the rare legitimate case of a service caching something across requests.

**The honest framing for an interview:** the best answer to "how do you make this OSGi service thread-safe" is usually "avoid mutable shared state entirely" — reaching for `synchronized` is what you do when statelessness genuinely isn't possible, not a first resort.

### 2.10 Interfaces vs. abstract classes — why Sling Models use interfaces the way they do

File 05 and file 23 already established the pattern: a Sling Model interface with an `Impl` implementation, or a Sling Model exported via `ComponentExporter`. The Java reasoning underneath: an **interface** defines a contract with no shared implementation, letting the HTL template (or a headless JSON exporter) depend only on the interface's method signatures — never on how the data is actually fetched — which is the same dependency-inversion idea behind testing a Sling Model against `AemContext` rather than a real repository (file 27). An **abstract class** is the right tool instead when several related classes genuinely share common implementation, not just a common contract — less common in typical AEM component code, more common in a shared base class for several similar OSGi services.

---

## 3. Internal Working

### 3.1 Why string concatenation in a loop is a real, measurable problem

`String` is immutable — every `+` concatenation creates a **new** `String` object rather than modifying one in place. Inside a loop, that means allocating and discarding a new string on every iteration:

```java
// Quietly O(n²): each += allocates a new String and copies everything so far.
String html = "";
for (Product p : products) {
    html += "<li>" + p.getName() + "</li>";
}

// StringBuilder mutates an internal buffer — genuinely O(n).
StringBuilder html = new StringBuilder();
for (Product p : products) {
    html.append("<li>").append(p.getName()).append("</li>");
}
```

This rarely matters for three items in a dropdown; it matters for the kind of loop that renders every product on a large listing page — exactly file 02's Load More component territory — where the naive version's cost grows quietly worse as the page grows.

### 3.2 Why a checked exception on a factory method forces a design decision

`getServiceResourceResolver(...)` throwing `LoginException` as a checked exception means the compiler won't let a caller ignore the possibility. That forces one of a small number of honest choices at every call site: handle it and degrade gracefully (return an empty result, log and move on), or declare it and let a caller further up decide — but never silently swallow it without a decision being made, because the compiler won't compile code that just ignores a checked exception.

### 3.3 How autoboxing quietly causes a subtle bug

`Integer` and `int` aren't quite interchangeable — comparing two boxed `Integer` objects with `==` compares references, not values, and Java's `Integer` cache only guarantees identity equality for small values (-128 to 127) as an implementation detail, not a guarantee to rely on:

```java
Integer a = 200;
Integer b = 200;
a == b;          // false — not guaranteed to be the same cached object
a.equals(b);     // true — always correct for comparing values
```

**The rule:** always use `.equals()` (or unbox to a primitive `int` first) to compare boxed numeric types — never `==`.

---

## 4. Important Interview Questions

### 4.1 Basic

**Q1. What's the difference between `List`, `Set`, and `Map`?**
`List` is ordered and allows duplicates. `Set` has no duplicates (with `LinkedHashSet` also preserving insertion order). `Map` is key-value lookup.

*Cross:* Which would you use for a multifield's raw values? (**`List` — order and duplicates both matter**) · Which for deduplicating by a business key while keeping order? (`LinkedHashSet` or a `LinkedHashMap`) · Does `HashSet` preserve order? (no guarantee at all)

**Q2. What's the difference between a checked and an unchecked exception?**
Checked exceptions must be declared or caught — the compiler enforces it. Unchecked exceptions don't need to be, and typically represent programming errors rather than expected failure conditions.

*Cross:* Give an AEM example of each. (**checked: `LoginException`; unchecked: `NullPointerException`**) · Why does `getServiceResourceResolver` throw a checked exception? (a misconfigured service user is an expected, not exceptional, failure mode) · Can you convert a checked exception to unchecked? (wrap it in a `RuntimeException`, though that hides the original contract)

**Q3. What does try-with-resources actually guarantee?**
That `close()` is called on every exit path from the block — normal completion or an exception — without writing a `finally` block by hand.

*Cross:* What must a class implement to be used this way? (**`AutoCloseable`**) · Is `ResourceResolver` one? (yes) · What happens if you don't use it and an exception is thrown mid-method? (the resource leaks — file 20's exact bug)

**Q4. What's the `equals()`/`hashCode()` contract?**
If two objects are `equals()`, they must return the same `hashCode()`.

*Cross:* What breaks if you violate it? (**`HashSet`/`HashMap` silently fail to recognise duplicates or find existing keys**) · Is this enforced by the compiler? (no — it's a contract, not a compiler check) · What's the default `equals()` behaviour if you don't override it? (identity comparison — two different objects are never equal even with identical field values)

**Q5. Why is `String` immutable, and what's the practical consequence?**
Every modification creates a new `String` rather than changing the existing one. In a loop, repeated concatenation becomes quietly quadratic; `StringBuilder` avoids that by mutating an internal buffer.

*Cross:* When does this actually matter in practice? (**loops over many items — a large product listing, not a three-item dropdown**) · Is `String` immutability ever a benefit? (yes — safe to share across threads with no synchronisation needed)

### 4.2 Intermediate

**Q6. Why is generic type safety valuable in `resource.adaptTo(SomeModel.class)`?**
It moves a class of error from a runtime `ClassCastException` (an unsafe cast to `Object`) to a compile-time type check, because `adaptTo` is declared generically as `<T> T adaptTo(Class<T> type)`.

*Cross:* What would `adaptTo` look like without generics? (**returning raw `Object`, needing a manual cast at every call site**) · Does this eliminate all runtime type errors? (no — a null return if adaptation fails is still possible and must be checked) · Is this specific to AEM? (no — it's how any well-designed generic factory method works)

**Q7. Why should an OSGi service avoid mutable instance fields?**
Because a component is typically a singleton shared across every concurrent request — a mutable instance field is shared, unsynchronised state, and a race condition under real traffic.

*Cross:* What's safe to store as an instance field? (**immutable configuration set once at `@Activate`**) · Where should per-request data live instead? (local variables, or parameters — never the instance) · What's the fix if you genuinely need shared mutable state? (`synchronized`, `volatile`, or a concurrent collection — as a last resort, not a default)

**Q8. Explain the difference between `synchronized`, `volatile`, and a `ConcurrentHashMap`.**
`synchronized` gives mutual exclusion — one thread at a time. `volatile` guarantees visibility of a single field's writes across threads, without exclusion. `ConcurrentHashMap` is a thread-safe map that handles its own internal synchronisation.

*Cross:* When would `volatile` alone be wrong? (**for a compound operation like increment, which isn't atomic even with `volatile`**) · Is `synchronized` free? (no — a real cost under contention) · What's the best answer for an OSGi service needing shared state? (usually: redesign to avoid needing it at all)

**Q9. Why does a Sling Model typically use an interface plus an implementation, rather than one concrete class?**
So consuming code — HTL, or a JSON exporter — depends only on the contract, not on how the data is actually produced, which is the same dependency-inversion principle that lets the model be unit tested against a fake context instead of a real repository.

*Cross:* When would an abstract class be the better tool instead? (**when several classes share real implementation, not just a contract**) · Does this cost anything at runtime? (negligible — an interface call has no meaningful overhead) · Is this pattern specific to AEM? (no — it's ordinary dependency inversion, applied to AEM's specific case)

**Q10. What's wrong with comparing two `Integer` objects with `==`?**
It compares object identity, not value — and only works "by accident" for small cached values (-128 to 127), which is an implementation detail, not a guarantee.

*Cross:* What's the correct comparison? (**`.equals()`, or unbox to primitive `int` first**) · Does this apply to `String` too? (yes — same identity-vs-value trap, string literals are pooled but constructed strings aren't guaranteed to be) · Why does this bug often go unnoticed in testing? (small test values happen to be cached, hiding the bug until production data uses larger numbers)

### 4.3 Advanced

**Q11. Walk through why the opening story's bug happened, using only Java concepts, no AEM-specific ones.**
*(The 6.1-style answer: two logically-equal `Product` objects built by different code paths, relying on `Object`'s default identity-based `equals()`, so a `Set`/`Map`-based deduplication silently failed to recognise them as duplicates — fixed by overriding `equals()`/`hashCode()` consistently based on the business key.)*

*Cross:* Would switching to a `List` and manual `.contains()` checking have avoided the bug? (**only if `.contains()` also relied on a correctly overridden `equals()` — same root cause either way**) · What's the general lesson? (a data class used as a key or in a `Set` needs `equals()`/`hashCode()` overridden deliberately, not left to default identity) · Would a record type (Java 16+) have avoided this class of bug entirely? (yes — records generate `equals()`/`hashCode()` based on their fields automatically)

**Q12. Design a thread-safety review checklist for an OSGi service before it ships.**
*(Check: does it hold any mutable instance field? If so, is it written only once, at `@Activate`, and never after? Is any per-request data ever stored on the instance instead of a local variable? If shared mutable state is truly required, is it protected with `synchronized`, `volatile`, or a concurrent collection appropriately, and is that the simplest option available rather than the first one reached for?)*

*Cross:* What's the single most common violation in real code? (**a mutable `List`/`Map` field populated inside a request-handling method**) · Why is this bug often invisible in local testing? (a single developer testing alone rarely triggers real concurrent access) · How would this bug actually manifest in production? (intermittent, hard-to-reproduce data corruption or cross-request data leakage under real concurrent load)

---

## 5. Cross Questions — how this topic gets drilled

The standard chain tests whether "I know Java" is backed by specifics: **"What Java version features do you actually use day to day?"** → *give a concrete example, not a list* → *(a stream pipeline replacing a manual loop, from a real Sling Model)* → *why is that better than the loop version?* → *(readability and intent, not raw performance — say so explicitly rather than overclaiming a performance win that isn't the real reason)*

A second chain goes after the identity-vs-equality trap directly: **"Two objects that look identical aren't recognised as equal in a `HashSet` — why?"** → *what's Java's default `equals()` behaviour?* (identity) → *what fixes it?* (override `equals()`/`hashCode()` consistently) → *what's the contract you have to maintain?* (equal objects must have equal hash codes)

A third, senior-leaning chain targets OSGi-specific thread safety directly, because it's where "I know Java" and "I know AEM" have to meet: **"Is this OSGi service thread-safe?"** (shown a snippet with a mutable instance field) → *what's actually wrong with it* → *why does it matter that a component is a singleton* → *what would make this safe instead* → *(stateless design, or if truly unavoidable, explicit synchronisation, as a last resort not a first one)*

---

## 6. Best Interview Answers

**"How comfortable are you with core Java, given your background is mostly support?"** — *about 70 seconds*

> "I'd describe it as solid in the areas that come up constantly in AEM development, and still building depth in areas that come up less often day to day. I'm comfortable with collections and picking the right one deliberately — `List` versus a `LinkedHashSet` when I need to deduplicate but keep order, for example — with the `equals()`/`hashCode()` contract and why breaking it causes a `Set` to silently stop recognising duplicates, with try-with-resources and why it matters for anything that opens a `ResourceResolver` or a `Session`, and with stream pipelines for expressing a filter-sort-collect operation without a manual loop.
>
> The area I've had to be most deliberate about is concurrency, specifically because an OSGi service is a singleton shared across every request — which means a habit that's completely safe in a request-scoped framework, storing something on an instance field, becomes a genuine race condition here. That's been less about learning new syntax and more about learning to think about state differently, and I'd rather say that honestly than claim expertise I'm still building."

---

## 7. Real Project Examples

### Story 1 — The product-list `equals()` bug (told in full)

Already introduced in the opening. Worth restating the full arc here as an interview-ready story: **requirement** — deduplicated related products; **what looked right** — a nested loop with `.contains()` checks; **the actual bug** — two `Product` instances built from different code paths (one from a direct JCR read, one from a cache) were logically the same product but never recognised as duplicates, because `Object`'s default `equals()` compares identity; **the fix** — overriding `equals()`/`hashCode()` based on product code and switching to a `LinkedHashSet`; **the lesson** — *"the bug had nothing to do with AEM — it was a plain Java mistake that happened to show up through a Sling Model, which is exactly the kind of thing a 'my Java is a work in progress' developer needs to be able to spot and explain."*

### Story 2 — The OSGi service that leaked data between two authors' sessions

**What happened.** A service used to build a preview summary stored the current request's context in a private instance field, read back a few lines later in the same method. It worked in every manual test.

**The cause.** Under real concurrent load — two authors previewing different pages within milliseconds of each other — the field was overwritten by the second request before the first request finished reading it back, producing a preview built from the wrong page's data for one of the two authors.

**Why it wasn't caught in testing.** A single developer testing alone essentially never triggers genuinely concurrent access to the same service instance — the bug is invisible until real traffic patterns exist.

**The fix.** The value was passed as a method parameter and held in a local variable instead of an instance field — removing the shared state entirely rather than trying to synchronise access to it.

**The lesson to state:** *"This is the OSGi-singleton trap in its purest form — a habit that's completely safe in a request-scoped framework becomes a live bug the moment two requests hit the same shared instance at once, and it's often invisible until real concurrent traffic exists."*

### Story 3 — The stream pipeline that was correct but unreadable, and the rewrite that fixed both problems

**What happened.** A code review flagged a working stream pipeline for being nearly impossible to read — five chained operations on one line, mixing filtering, grouping, and side-effecting logging inside a `.peek()` call.

**Why "it works" wasn't the end of the conversation.** A future developer reading it under time pressure — exactly the situation a support-to-development transition is training for — would likely misread what it did, or be afraid to touch it at all.

**The fix.** Splitting the pipeline into named intermediate steps, each assigned to a clearly-named local variable, and removing the logging side effect from inside the stream entirely.

**The lesson to state:** *"A stream pipeline is supposed to make intent more readable than a loop, not less. If it needs a comment to explain what it's doing, it's usually a sign to split it into named steps rather than write the comment."*

---

## 8. Coding Examples

### 8.1 Deduplicating while preserving order — the opening story's actual fix

```java
public List<Product> getRelatedProducts() {
    if (rawRelatedProducts == null) {
        return Collections.emptyList();
    }
    // LinkedHashMap keyed by product code: keeps the FIRST occurrence
    // of each code, in the order encountered — exactly "dedupe, keep order."
    Map<String, Product> deduped = new LinkedHashMap<>();
    for (Product product : rawRelatedProducts) {
        deduped.putIfAbsent(product.getCode(), product);
    }
    List<Product> result = new ArrayList<>(deduped.values());
    result.sort(Comparator.comparingDouble(Product::getRelevanceScore).reversed());
    return result;
}
```

### 8.2 A stateless OSGi service versus the leaking version from Story 2

```java
// WRONG: currentContext is shared, mutable state on a singleton component —
// a race condition the moment two threads call generatePreview() concurrently.
@Component(service = PreviewService.class)
public class PreviewServiceImpl implements PreviewService {
    private PageContext currentContext; // <-- the bug

    @Override
    public String generatePreview(Resource pageResource) {
        currentContext = buildContext(pageResource);
        return render(currentContext);
    }
}

// FIXED: no shared state at all — currentContext is a local variable,
// so each concurrent call gets its own, safely.
@Component(service = PreviewService.class)
public class PreviewServiceImpl implements PreviewService {
    @Override
    public String generatePreview(Resource pageResource) {
        PageContext currentContext = buildContext(pageResource);
        return render(currentContext);
    }
}
```

### 8.3 A readable stream pipeline, split from Story 3's unreadable version

```java
// Before: correct, but everything happens in one unreadable chain.
List<String> result = products.stream()
    .filter(p -> p.isActive() && p.getStock() > 0)
    .peek(p -> log.debug("Considering {}", p.getCode()))
    .collect(Collectors.groupingBy(Product::getCategory))
    .values().stream().flatMap(List::stream)
    .map(Product::getName).collect(Collectors.toList());

// After: named intermediate steps, no side effects hidden inside the stream.
List<Product> availableProducts = products.stream()
    .filter(p -> p.isActive() && p.getStock() > 0)
    .collect(Collectors.toList());

log.debug("Considering {} available products", availableProducts.size());

Map<String, List<Product>> byCategory = availableProducts.stream()
    .collect(Collectors.groupingBy(Product::getCategory));

List<String> result = byCategory.values().stream()
    .flatMap(List::stream)
    .map(Product::getName)
    .collect(Collectors.toList());
```

---

## 9. Common Mistakes

| Mistake | Why it happens | The actual cost |
|---|---|---|
| Not overriding `equals()`/`hashCode()` on a class used as a `Set`/`Map` key | Default identity comparison "usually" seems to work in small tests | Silent deduplication failures with real data from multiple sources |
| Storing per-request data in an OSGi service's instance field | Habit from request-scoped frameworks | A race condition invisible until real concurrent traffic |
| String concatenation in a loop over many items | Reads simply, works fine at small scale | Quietly quadratic cost on a large listing |
| Comparing boxed `Integer`/`Long` with `==` | Small test values happen to be cached and compare "correctly" by accident | A bug that only appears with larger real values |
| Reaching for `synchronized` as a first resort | Feels like the "safe" answer to a thread-safety question | Unnecessary contention where a stateless redesign would have been simpler and faster |
| Scattering `Optional` through fields and parameters | Read about it as a "modern Java" pattern without the caveat | Verbose, unidiomatic code — `Optional` is for return values, not everywhere |
| An unreadable one-line stream pipeline | "It's more concise" without checking it's still clear | A future reader (including you, under pressure) misreads or fears touching it |
| Swallowing a checked exception with an empty catch block | Made the compiler stop complaining, fastest path to a green build | A real failure disappears silently instead of being handled or logged |

---

## 10. Best Practices

- **Override `equals()` and `hashCode()` together, consistently, on any class used as a `Set`/`Map` key or compared for logical equality** — never leave it to default identity comparison.
- **Treat an OSGi service as stateless by default.** Instance fields hold only immutable configuration set once; per-request data lives in local variables or parameters.
- **Use `StringBuilder` for concatenation inside a loop**, and plain `+` for a handful of one-off concatenations where readability wins and the cost is irrelevant.
- **Compare boxed numeric types with `.equals()`**, never `==`.
- **Use `Optional` as a return type for genuinely absent values — not as a field or parameter type scattered through a class.**
- **Name intermediate steps in a stream pipeline once it stops being obviously readable in one chain** — a pipeline should be easier to read than the loop it replaced, not harder.
- **Never swallow a checked exception silently** — handle it with an explicit, logged decision, or declare it and let a caller decide.
- **Reach for `synchronized`/`volatile`/concurrent collections only after confirming statelessness genuinely isn't possible** — not as a first response to a thread-safety question.

---

## 11. Debugging Tips

| Symptom | Where to look | What it usually means |
|---|---|---|
| A `Set` or `Map` "loses" entries that look identical | Whether `equals()`/`hashCode()` are overridden on the key/element class | Default identity comparison silently failing to recognise duplicates |
| Data from one request appears to leak into another | Any mutable instance field on an OSGi service | Shared singleton state under concurrent access |
| A listing page gets noticeably slower as content grows | String concatenation inside the render loop | Quadratic cost from repeated `String` allocation |
| A numeric comparison works in tests but fails with real data | Whether boxed types are compared with `==` | The `Integer` cache masking the bug for small values |
| A stream pipeline "does something wrong" but the logic looks right at a glance | Whether operations are ordered/chained in a way that's easy to misread | Split it into named steps to verify each stage independently |

---

## 12. Performance Notes

- `StringBuilder` versus repeated `+=` concatenation matters proportionally to loop size — negligible for a handful of items, real for a large listing page (file 02's territory).
- Stream pipelines are not inherently faster than an equivalent loop, and sometimes slightly slower due to overhead — the reason to prefer them is readability and correctness of intent, not raw speed. Don't claim a performance win in an interview that isn't the actual reason you'd choose one.
- Overusing `synchronized` on a hot path (a servlet or Sling Model method called on every request) can become a real bottleneck under load — which is exactly why statelessness is the preferred fix, avoiding the need for synchronisation entirely rather than making synchronisation fast.

---

## 13. Real Production Scenarios

1. A related-products widget occasionally shows duplicate entries in production but never in testing — check whether the model class overrides `equals()`/`hashCode()` and whether the data sources feeding it actually produce distinct object instances for the same logical product.
2. A preview feature occasionally shows the wrong page's content to an author — check every OSGi service in the render path for a mutable instance field holding per-request context.
3. A large product listing page gets progressively slower as more products are added over time — check for string concatenation inside the render loop.
4. A discount calculation is subtly wrong only for larger order totals — check for a boxed numeric `==` comparison.
5. A new developer submits a stream pipeline in a pull request that a reviewer can't verify by reading — request it be split into named intermediate steps before approval.
6. A checked exception from a repository call is caught with an empty `catch` block "to keep the build green" — this needs a real decision (log, degrade gracefully, or propagate), not silence.
7. A service that's supposed to cache a value across requests re-computes it every time — check whether it's storing the cache in a way (or scope) that's actually visible across calls, and whether that's done thread-safely if so.
8. Two developers argue about whether a new data class needs `equals()`/`hashCode()` overridden — the deciding question is whether the class will ever be compared for logical equality, put in a `Set`, or used as a `Map` key.
9. A component's Sling Model implementation is hard to unit test because it depends directly on another concrete implementation class rather than an interface — refactor toward the interface-plus-implementation pattern file 05 and 27 both rely on for testability.
10. A method signature returns `null` to mean "not found," and a caller three levels up gets a `NullPointerException` with no clear origin — consider `Optional<T>` as the return type instead, making the possibility of absence visible in the signature.

---

## 14. Follow-up Questions

- Why does Java's default `equals()` compare identity rather than field values? (a sensible, safe default when a class has no defined notion of "logical equality" — the class author has to opt in)
- What's the actual risk of overusing `synchronized`? (contention and reduced throughput under load, not just "it's slower")
- Why is `Optional` considered an anti-pattern as a field type but fine as a return type? (a field/parameter of type `Optional` adds indirection without the caller-facing benefit a return type provides, and doesn't serialize or compare cleanly)
- What's the actual difference between a compile-time and a runtime type error, and why does that matter practically? (a compile-time error is caught before the code ships; a runtime error is caught by a user, a test, or nobody)

---

## 15. Comparison Tables

| | **`List`** | **`Set`** | **`Map`** |
|---|---|---|---|
| Duplicates | Allowed | Not allowed | Keys unique, values can repeat |
| Order | Insertion order (implementation-dependent for some types) | No guarantee, except `LinkedHashSet` | No guarantee, except `LinkedHashMap` |
| Typical AEM use | A multifield's raw values | Deduplicating by identity/business key | Structured data, auth info maps |

| | **Checked exception** | **Unchecked exception** |
|---|---|---|
| Must be declared/caught | Yes | No |
| Represents | An expected, sometimes-happens failure | Usually a programming error |
| AEM example | `LoginException`, `RepositoryException` | `NullPointerException`, `IllegalArgumentException` |

| | **Instance field** | **Local variable** |
|---|---|---|
| Shared across concurrent calls on a singleton service? | Yes | No |
| Safe for per-request data on an OSGi service? | **No** | Yes |
| Appropriate use | Immutable config set once at `@Activate` | Anything specific to one method call |

| | **`synchronized`** | **`volatile`** | **Stateless design** |
|---|---|---|---|
| Solves | Mutual exclusion for compound operations | Visibility of a single field's writes | Removes the need for either |
| Cost | Contention under load | None, but limited guarantee | None — the preferred default |

---

## 16. Memory Tricks

- **"Equal objects must hash equal — break that, and a `Set` silently stops working."**
- **"An OSGi service is a singleton — treat every instance field as shared, mutable, and dangerous unless it's immutable config."**
- **"`String` is immutable, so `+=` in a loop rebuilds the world every time — `StringBuilder` doesn't."**
- **"Compare boxed numbers with `.equals()`, never `==` — the cache lies to you for small values."**
- **"`Optional` is for what a method returns, not what a class stores."**

---

## 17. Revision Notes

The Java fundamentals that show up constantly in AEM development: choose `List`/`Set`/`Map` deliberately based on whether order and duplicates matter, not by habit. Generics move type errors from runtime to compile time, which is exactly what makes `adaptTo` safe to use without manual casting. Checked exceptions force a caller to make an explicit decision about an expected failure mode; try-with-resources guarantees a `ResourceResolver` or `Session` closes on every exit path, fixing the leak files 20 and 28 both warn about. `equals()`/`hashCode()` must be overridden together and consistently on any class compared for logical equality or used as a `Set`/`Map` key — breaking the contract fails silently. `String`'s immutability makes `StringBuilder` the right tool for loop-based concatenation. `Optional` belongs on return types signalling genuine absence, not scattered through fields and parameters. And the concurrency point that matters most for AEM specifically: an OSGi service is typically a singleton shared across every concurrent request, so instance fields should hold only immutable configuration — any per-request data belongs in a local variable, and reaching for `synchronized`/`volatile` should be a last resort after confirming statelessness genuinely isn't possible.

---

## 18. Cheat Sheet

```text
COLLECTIONS
  List  — order matters, duplicates OK
  Set   — no duplicates (LinkedHashSet keeps order too)
  Map   — key/value lookup

EXCEPTIONS
  Checked   — must declare/catch (LoginException, RepositoryException)
  Unchecked — programming errors (NullPointerException)
  try-with-resources — guarantees close() on every exit path

EQUALS/HASHCODE
  Equal objects → equal hashCode, always
  Override BOTH together, or neither

STRINGS
  Immutable → StringBuilder for loop concatenation

OSGi THREAD SAFETY
  Service = singleton across concurrent requests
  Instance field = shared, mutable, dangerous (unless immutable config)
  Per-request data → local variable, never instance field
  synchronized / volatile = last resort, not first

OPTIONAL
  Return type for genuine absence — NOT a field, NOT a parameter

STREAMS
  Express "what," not "how" — but split into named steps once unreadable
```

---

## 19. Frequently Forgotten Things

1. `equals()` and `hashCode()` must be overridden **together** — one without the other breaks the contract just as badly as neither.
2. An OSGi service's instance fields are shared across every concurrent request — this is the single most consequential Java fact for AEM backend code.
3. `Integer`/`Long` comparison with `==` can accidentally "work" for small values due to caching, hiding a real bug until production data is larger.
4. `Optional` is idiomatic as a return type, not as a field or parameter type.
5. A stream pipeline that needs a comment to explain itself should usually be split into named steps instead.
6. `String` immutability is why `StringBuilder` exists — and why it only matters at real loop scale, not for a handful of concatenations.
7. A checked exception being thrown is Java telling you a failure is expected sometimes — not something to swallow silently to keep a build green.
8. Generics aren't just less-typing syntax — they move a class of bug from runtime to compile time.

---

## 20. Final Interview Summary

The Java that actually matters for AEM development is a specific, learnable slice, not the whole language: collections chosen deliberately, generics understood as a compile-time safety mechanism, checked exceptions treated as forced decisions rather than obstacles, try-with-resources as the fix for the leaks files 20 and 28 both warn about, `equals()`/`hashCode()` overridden together whenever logical equality matters, `String`'s immutability explaining when `StringBuilder` earns its place, `Optional` reserved for return values, and — the one with the highest practical stakes specifically for AEM — an OSGi service treated as a singleton whose instance fields are shared across every concurrent request, with statelessness as the default answer to any thread-safety question. None of this requires a computer-science-heavy vocabulary to explain well; it requires being able to connect each concept to a bug it prevents, which is exactly what an interviewer testing "is your Java solid enough for this role" is actually listening for.

---

## 21. Mock Interview

**Q1. Why does an OSGi service need to be careful about instance fields?**
> "Because a component is typically instantiated once and shared across every concurrent request the instance handles — it's a singleton. An instance field that gets written and read inside a request-handling method is shared, mutable state across every thread calling that method at the same time, which is a race condition. The default I design toward is statelessness: instance fields hold only immutable configuration set once at activation, and anything specific to a single request lives in a local variable instead."

**Q2. What's the `equals()`/`hashCode()` contract, and what happens if you break it?**
> "If two objects are equal by `equals()`, they must return the same `hashCode()`. If you override one without the other, or don't override either on a class that needs logical equality, you get a very specific and quiet kind of bug — a `HashSet` or `HashMap` uses `hashCode()` to decide which bucket to look in, so two objects that are logically the same but hash differently just never get recognised as duplicates or as an existing key. I've hit this directly — two `Product` objects built by different code paths, same product, never deduplicated, because I hadn't overridden either method and Java's default `equals()` compares identity, not fields."

**Q3. When would you reach for `synchronized`, and when wouldn't you?**
> "Only after I've confirmed I actually need shared mutable state and can't redesign around it — which, for most OSGi services, is rare, because the better fix is almost always making the service stateless in the first place. `synchronized` has a real cost under contention, and reaching for it as a first response to a thread-safety question usually means the actual problem — shared state that didn't need to be shared — hasn't been addressed."

**Q4. Explain why `String` immutability matters for a loop that builds HTML.**
> "Every concatenation with `+` creates a brand-new `String` rather than modifying one in place, because `String` is immutable. Inside a loop, that means allocating and copying a growing string on every iteration, which is quietly quadratic cost as the loop gets longer. `StringBuilder` fixes it by mutating an internal buffer instead. It's not a meaningful difference for a handful of items, but it's a real one on something like a large product listing rendering every item on the page."

**Q5. Why is generics important for something like `resource.adaptTo(Model.class)`?**
> "Because `adaptTo` is declared generically, the compiler knows the return type matches the `Class` argument you passed in, and it enforces that at the call site. Without generics, that method would have to return raw `Object`, and every caller would need an unchecked cast — which compiles fine and then fails at runtime with a `ClassCastException` the moment the assumption is wrong. Generics move that failure from a runtime surprise to a compile-time check, which is a meaningfully safer place for it to live."

---

## Next topic

**System design basics for AEM developers** — how to approach an open-ended "design a system" question when the system is a multi-site, headless-capable AEM platform: scalability, caching layers, content modelling for reuse, and the trade-offs an AEM-specific system design answer is expected to name.

---

*Topic 30 of the AEM Interview Preparation repository. Teaching style, energy-sector project domain.*
