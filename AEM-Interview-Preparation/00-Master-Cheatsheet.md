# Master AEM Cheat Sheet — All 27 Syllabus Points in One File

> **Target:** 3–4 years experienced AEM Developer
> **What this is:** every "Cheat Sheet" section from files 01–18, pulled into one place, in syllabus order.
> **What this is not:** a way to learn these topics for the first time. If a block below doesn't immediately make sense, that's the signal to go read the full file it came from — the number next to each heading tells you which one.
> **Project domain:** a global energy technology company's marketing site.

---

## How to use this file

This is the **day-before-the-interview** document, not the **week-one** document. Every block here is lifted directly from the corresponding full file's own Cheat Sheet section, so it's already been through the same accuracy pass as the teaching content — nothing here is a new, unverified summary. Read down the list once a week during your prep to see what's gone stale in your memory, and do a full top-to-bottom pass the morning of an interview.

If a code snippet, path, or console URL doesn't ring a bell at all, that's more useful information than the snippet itself — it's telling you exactly which file to reopen.

---

## Syllabus map — all 27 points, at a glance

| Point(s) | Topic | File |
|---|---|---|
| 1 | AEM Architecture | 01 |
| 2 | Component Development | 02 |
| 3 | Editable Templates and Policies | 03 |
| 4, 5 | Clientlibs | 04 |
| 6, 8, 9, 10, 12 | Sling Models | 05 |
| 7, 11, 13 | OSGi and Services | 06 |
| 14, 15, 16 | Servlets | 07 |
| 17, 18 | HTL (Sightly) | 08 |
| 19 (first half) | Workflows | 09 |
| 19 (second half) | Schedulers, Sling Jobs and Events | 10 |
| 20 | Dialog Validation | 11 |
| 21 | MSM and Translation | 12 |
| 22 | Users, Groups and Permissions | 13 |
| 23 | AEM as a Cloud Service | 14 |
| 24, 25 | Content Fragments | 15 |
| 24 (completing) | Experience Fragments | 16 |
| 26 | Sling Model Exporter | 17 |
| 27 | Replication and Distribution | 18 |

---

## 01 — AEM Architecture *(Syllabus point 1)*

**Console URLs**
```
/system/console/bundles           Bundle list and states
/system/console/components        DS components — active or unsatisfied
/system/console/configMgr         OSGi configuration in effect
/system/console/services          The service registry
/system/console/servletresolver   Which servlet handles a given URL
/system/console/status-adapters   Registered adapter factories
/system/console/slinglog          Logger configuration
/system/console/tracer            Sling Log Tracer
/system/console/depfinder         Which bundle exports a package
/system/console/jmx               MBeans — Oak, queues, sessions
/system/console/healthcheck       Health checks
/system/console/slingevent        Sling job queues
/system/console/status-Threads    Thread dump
/crx/de                           CRXDE Lite
/crx/packmgr                      Package Manager
/etc/replication/agents.author    Replication agents (6.5)
/libs/cq/search/content/querydebug.html
/libs/granite/operations/content/diagnosistools/queryPerformance.html
```

**Properties you must recognise instantly**
```
sling:resourceType         which component renders this node
sling:resourceSuperType    which component this one inherits from
cq:template                which template the page was created from
jcr:primaryType            the node's type
jcr:title                  title
cq:allowedTemplates        which templates may be used under a path
cq:isContainer             this node can hold child components
sling:configRef            links a content branch to its /conf config
allowProxy                 exposes a clientlib under /etc.clientlibs
categories                 the clientlib's name for inclusion
embed                      pull another clientlib's code into this one
dependencies               require another clientlib to load first
```

**Log locations**
```
crx-quickstart/logs/error.log      exceptions
crx-quickstart/logs/request.log    response times
crx-quickstart/logs/access.log     who requested what
crx-quickstart/logs/stdout.log     startup output
<apache>/logs/dispatcher.log       cache hit/miss, filter denials
Cloud Service: Cloud Manager → Download Logs, or `aio aem:rde:logs`
```

**Maven commands**
```
mvn clean install -PautoInstallSinglePackage         everything → author 4502
mvn clean install -PautoInstallSinglePackagePublish  everything → publish 4503
mvn clean install -PautoInstallBundle -pl core       bundle only, fast
mvn clean install -PautoInstallPackage -pl ui.apps   ui.apps only
```

**Repoinit syntax**
```
create service user my-service with path system/cq:services/myproject

set ACL for my-service
    allow jcr:read on /content
    allow jcr:read,jcr:write on /var/myproject
end

create path (sling:Folder) /var/myproject

create group myproject-authors
add myproject-authors to group contributor
```

---

## 02 — Component Development *(Syllabus point 2)*

**Component folder**
```
/apps/<project>/components/<name>/
    .content.xml          cq:Component + jcr:title + componentGroup [+ sling:resourceSuperType]
    <name>.html           HTL — must match the folder name
    _cq_dialog/.content.xml
    _cq_editConfig.xml
    _cq_template/.content.xml
    clientlibs/
```

**`.content.xml` properties**
```
jcr:primaryType="cq:Component"      makes it a component
jcr:title                           name shown to authors
jcr:description                     tooltip
componentGroup                      browser group; ".hidden" hides it
sling:resourceSuperType             inherit from another component
cq:isContainer="{Boolean}true"      can hold child components
cq:noDecoration="{Boolean}true"     no wrapper div
```

**Dialog skeleton**
```
cq:dialog (sling:resourceType="cq/gui/components/authoring/dialog")
  └ content   → granite/ui/components/coral/foundation/container
     └ items
        └ tabs   → .../foundation/tabs
           └ items
              └ <tabname> (jcr:title) → .../foundation/container
                 └ items
                    └ columns → .../foundation/fixedcolumns
                       └ items
                          └ column → .../foundation/container
                             └ items
                                └ <your fields>
```

**Field resource types** (prefix `granite/ui/components/coral/foundation/form/`)
```
textfield · textarea · pathfield · select · checkbox · switch
numberfield · datepicker · radiogroup · hidden · fileupload
multifield · colorfield

cq/gui/components/authoring/dialog/richtext      rich text
cq/gui/components/coral/common/form/tagfield     tag picker
```

**Field properties**
```
name="./property"         ALWAYS the ./ prefix
fieldLabel                the label
fieldDescription          help text
required="{Boolean}true"  mandatory
emptyText                 placeholder
value / uncheckedValue    checkboxes — set BOTH
rootPath                  restrict a pathfield
composite="{Boolean}true" composite multifield
selected="{Boolean}true"  default option in a select
```

**Resource Merger**
```
sling:orderBefore="fieldName"        position a merged field
sling:hideResource="{Boolean}true"   remove an inherited field
sling:hideProperties="[prop1,prop2]" hide inherited properties
```

**`cq:editConfig`**
```
cq:actions="[text:Label,-,edit,copymove,delete,insert]"
cq:dialogMode="floating|inline|auto"
cq:listeners → afteredit / afterinsert = "REFRESH_PAGE" | "REFRESH_SELF"
cq:dropTargets → accept, groups, propertyName
cq:inplaceEditing → editorType="text|title|plaintext"
```

**HTL essentials**
```html
data-sly-use.model="com.x.Model"      bind a Sling Model
data-sly-test="${model.ready}"         conditional render
data-sly-list.item="${model.items}"    loop
data-sly-element="${model.headingLevel}"  dynamic tag name
data-sly-resource="${path @ resourceType='...', decoration=false}"
${value @ context='html'}              rich text
${value @ context='uri'}               URLs
${value @ context='unsafe'}            ONLY for serialiser-produced JSON-LD
```

**Accessibility contract for an accordion**
```
<button aria-expanded="false" aria-controls="panelId" id="buttonId">
<panel id="panelId" role="region" aria-labelledby="buttonId" hidden>
decorative icons → aria-hidden="true"
dynamic updates  → <div role="status" aria-live="polite">
```

---

## 03 — Editable Templates and Policies *(Syllabus point 3)*

**Paths**
```
/conf/<project>/settings/wcm/templates/<name>/       the template
        ├── jcr:content        status, allowedPaths, jcr:title
        ├── structure/         every page, LIVE
        ├── initial/           new pages only, copied once
        └── policies/          cq:policy mapping (mirrors structure)

/conf/<project>/settings/wcm/policies/               policy DEFINITIONS
/conf/<project>/settings/wcm/template-types/         template blueprints
/apps/<project>/templates/                           static templates (legacy)
/etc/designs/                                        legacy design configs
```

**Template properties (`jcr:content`)**
```
jcr:title           name shown to authors
status              draft | enabled | disabled
allowedPaths        regex array, e.g. [/content/energy(/.*)?]
ranking             order in the Create Page list
```

**Structure properties**
```
sling:resourceType  the page component
cq:template         self-reference to the template
editable="{Boolean}true"    UNLOCK a structure component
cq:responsive       responsive grid breakpoints
```

**Policy properties**
```
cq:policy           on a mapping node → points at a definition
components          allowed list: ["group:My Group", "proj/components/x"]
cq:styleGroups      Style System class definitions
clientlibs          on a PAGE policy → categories to load
jcr:title           name it properly, not policy_1584032
```

**Content-side properties**
```
cq:template         on a page's jcr:content → its template
cq:allowedTemplates on a folder's jcr:content → permitted templates below
sling:configRef     which /conf folder this branch resolves config from
```

**Package filter (ui.content)**
```xml
<filter root="/conf/energy" mode="merge"/>
<filter root="/content/energy" mode="merge"/>
```

**Diagnostic checklist — template not appearing**
```
1. status = enabled?
2. allowedPaths regex matches the creation path?
3. cq:allowedTemplates on the content folder?
4. author has read on /conf?
```

**Diagnostic checklist — can't add a component**
```
1. In the container policy's components list (directly or by group)?
2. componentGroup empty or .hidden?
3. Nested container with NO cq:policy mapped?
4. Author has modify permission on the path?
```

---

## 04 — Clientlibs *(Syllabus points 4, 5)*

**Folder structure**
```
/apps/<project>/clientlibs/clientlib-site/
    .content.xml      cq:ClientLibraryFolder + config
    css.txt           which CSS files, in order
    js.txt            which JS files, in order
    css/              LESS/CSS source
    js/               JS source
    resources/        served AS-IS: fonts, images
```

**`.content.xml` properties**
```xml
jcr:primaryType="cq:ClientLibraryFolder"
categories="[energy.product]"           the logical name(s)
allowProxy="{Boolean}true"              servable via /etc.clientlibs
dependencies="[energy.base,jquery]"     load first, SEPARATE files
embed="[energy.component.cta]"          pull INSIDE, ONE file
```

**`css.txt` / `js.txt`**
```
#base=css          set the source folder
# comment

variables.less     one file per line
base.less          IN LOAD ORDER
components.less
```

**Proxy path translation**
```
/apps/energy/clientlibs/clientlib-site
        ↓  strip /apps
/etc.clientlibs/energy/clientlibs/clientlib-site.css
/etc.clientlibs/energy/clientlibs/clientlib-site/resources/fonts/x.woff2
```

**Including in HTL**
```html
<sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html"/>

<sly data-sly-call="${clientlib.css @ categories='energy.site'}"/>       in <head>
<sly data-sly-call="${clientlib.js  @ categories='energy.site'}"/>       end of <body>
<sly data-sly-call="${clientlib.all @ categories='energy.site'}"/>       both

@ async=true       don't block, order not guaranteed
@ defer=true       run after parsing
@ media='print'    non-blocking print styles
```

**Granite alternative**
```html
<sly data-sly-use.clientlib="/libs/granite/sightly/templates/clientlib.html"/>
```

**Legacy JSP**
```jsp
<cq:includeClientLib categories="energy.site"/>
```

**Debug URLs**
```
?debugClientLibs=true                                     unminified, individual files
/libs/granite/ui/content/dumplibs.html                    all clientlibs
/libs/granite/ui/content/dumplibs.test.html?categories=X  what X resolves to
/libs/granite/ui/content/dumplibs.validate.html           duplicate categories
/libs/granite/ui/content/dumplibs.rebuild.html            force rebuild
```

**Dispatcher rule**
```
/0100 { /type "allow" /path "/etc.clientlibs/*"
        /extension '(css|js|png|jpg|svg|woff|woff2)' }
```

**OSGi config** — HTML Library Manager
```
com.adobe.granite.ui.clientlibs.impl.HtmlLibraryManagerImpl
    debug     · minify · gzip · timing
```

---

## 05 — Sling Models *(Syllabus points 6, 8, 9, 10, 12)*

**The `@Model` annotation**
```java
@Model(
    adaptables = Resource.class,                    // or SlingHttpServletRequest.class, or both
    adapters = Cta.class,                           // register as an interface
    resourceType = "energy/components/cta",         // bind to a resource type
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL,
    cache = true                                    // reuse the instance per adaptable
)
```

**Injector-specific annotations**
```java
@ValueMapValue          property on THIS node
@ChildResource          child node -- Resource, model, or List<Model>
@ResourcePath           resolve a path property into a Resource
@OSGiService            an OSGi service  (NOT @Reference)
@ScriptVariable         HTL binding -- REQUIRES request adaptable
@RequestAttribute       set upstream by a filter
@SlingObject            resourceResolver, resource, request, response
@Self                   the adaptable itself
```

**Modifiers**
```java
@Named("jcr:title")                     property name != field name
@Default(values = "arrow")              fallback value
@Optional / @Required                   per-field injection strategy
@Via("resource")                        change what it resolves against
@OSGiService(filter = "(...)")          pick one implementation
```

**Lifecycle**
```java
@PostConstruct
protected void init() { }     // void, NO arguments, after injection
```

**`@ScriptVariable` bindings (request-adaptable only)**
```java
currentPage      the page being rendered
currentStyle     the RESOLVED POLICY (file 03)
pageManager      look up pages by path
wcmmode          edit / preview / disabled
currentDesign    legacy design
resourceResolver
```

**Using a model**
```html
<sly data-sly-use.cta="com.energy.core.models.Cta"/>
${cta.linkText}          → calls getLinkText()
${cta.ready}             → calls isReady()
```
```java
CtaModel m = resource.adaptTo(CtaModel.class);
if (m != null) { ... }        // ALWAYS
```

**Bundle header**
```
Sling-Model-Packages: com.energy.core.models
```

**Debugging**
```
/system/console/status-adapters     is the model registered?
/system/console/tracer              trace one request
error.log                           @PostConstruct exceptions
${model} in HTL                     did adaptation succeed?
```

**Test setup**
```java
context.load().json("/faq/content.json", "/content");
context.addModelsForClasses(FaqModel.class, FaqItemModel.class);   // BOTH
context.registerService(MyService.class, Mockito.mock(MyService.class));
```

---

## 06 — OSGi and Services *(Syllabus points 7, 11, 13)*

**Declaring**
```java
@Component                                    // component, NOT a service
@Component(service = MyService.class)         // component AND service
@Component(service = {A.class, B.class})      // several interfaces
@Component(immediate = true)                  // activate without a consumer
@Component(configurationPolicy = ConfigurationPolicy.REQUIRE)
@Component(property = {"service.ranking:Integer=100"})
@Component(scope = ServiceScope.SINGLETON)    // default
```

**Lifecycle**
```java
@Activate   protected void activate(MyConfig config) { }
@Modified   // usually the SAME method as @Activate
@Deactivate protected void deactivate() { }   // RELEASE RESOURCES
```

**Injection**
```java
@Reference
private MyService service;                    // MANDATORY by default

@Reference(cardinality = ReferenceCardinality.OPTIONAL,
           policy = ReferencePolicy.DYNAMIC)
private volatile MyService optional;          // volatile REQUIRED

@Reference(cardinality = ReferenceCardinality.MULTIPLE,
           policy = ReferencePolicy.DYNAMIC)
private volatile List<Handler> handlers;

@Reference(target = "(component.name=com.energy.CachedImpl)")
private MyService specific;
```

**Configuration**
```java
@ObjectClassDefinition(name = "My Service")
public @interface MyConfig {
    @AttributeDefinition(name = "Endpoint")
    String endpoint() default "https://api/v1";

    @AttributeDefinition(name = "Timeout (ms)")
    int timeout() default 3000;
}

@Component(service = MyService.class)
@Designate(ocd = MyConfig.class)              // add factory = true for many instances
public class MyServiceImpl implements MyService { }
```

**Config file**
```
ui.config/.../apps/energy/osgiconfig/config.publish.prod/
    com.energy.core.services.impl.MyServiceImpl.cfg.json     ← PID = class name

    factory instance:
    com.energy...MyServiceImpl~products.cfg.json
```

**Sling registration**
```java
@Component(service = Servlet.class)
@SlingServletResourceTypes(resourceTypes = "...", selectors = "...",
                           extensions = "html", methods = "GET")

@Component(service = Servlet.class)
@SlingServletPaths("/bin/energy/export")

@Component(service = Filter.class)
@SlingServletFilter(scope = SlingServletFilterScope.REQUEST)
```

**Consoles**
```
/system/console/bundles      bundle state, unsatisfied imports
/system/console/components   component state + WHICH REFERENCE IS MISSING
/system/console/configMgr    effective configuration values
/system/console/services     what's registered, and ranking
/system/console/slinglog     package-scoped DEBUG logger
```

**Testing**
```java
service = context.registerInjectActivateService(new MyServiceImpl(), configMap);
```

---

## 07 — Servlets *(Syllabus points 14, 15, 16)*

**Registration**
```java
@Component(service = Servlet.class)
@SlingServletResourceTypes(
    resourceTypes = "energy/components/listing",
    selectors     = "cards",
    extensions    = "html",
    methods       = HttpConstants.METHOD_GET
)

@Component(service = Servlet.class)
@SlingServletPaths("/bin/energy/quote")     // + authorisation + dispatcher rule
```

**Old property style**
```
sling.servlet.resourceTypes · sling.servlet.selectors
sling.servlet.extensions    · sling.servlet.methods
sling.servlet.paths         · sling.servlet.prefix
```

**Base classes**
```
SlingSafeMethodsServlet   GET HEAD OPTIONS TRACE      (read-only)
SlingAllMethodsServlet    + POST PUT DELETE           (writes)
```

**Methods**
```java
protected void doGet   (SlingHttpServletRequest req, SlingHttpServletResponse res)
protected void doPost  (...)
protected void doPut   (...)
protected void doDelete(...)
```

**Reading the request**
```java
request.getResource()                          the resolved resource
request.getResourceResolver()                  the USER's resolver — do NOT close
request.getRequestPathInfo().getSelectors()    ["cards"]
request.getRequestPathInfo().getSuffix()       "/2"  — NULL if absent
request.getRequestPathInfo().getExtension()    "html"
request.getParameter("q")                      query/form parameter
```

**Writing the response**
```java
response.setContentType("application/json");
response.setCharacterEncoding("UTF-8");
response.setStatus(SlingHttpServletResponse.SC_CREATED);
new ObjectMapper().writeValue(response.getWriter(), payload);
```

**Status codes**
```
200 OK          201 Created      202 Accepted    204 No Content
400 Bad Request 403 Forbidden    404 Not Found   405 Method Not Allowed
500 Internal Server Error
```

**Filter**
```java
@Component(service = Filter.class)
@SlingServletFilter(scope = SlingServletFilterScope.REQUEST)
@ServiceRanking(-700)
```
Scopes: `REQUEST` · `INCLUDE` · `COMPONENT` · `FORWARD` · `ERROR`

**Dispatcher rule for a path servlet**
```
/0200 { /type "allow" /path "/bin/energy/quote" /method "POST" }
```

**Debugging**
```
/system/console/servletresolver    which servlet handles this URL
/system/console/components         Active or Unsatisfied
404 = not matched  ·  405 = matched, wrong method
```

---

## 08 — HTL (Sightly) *(Syllabus points 17, 18)*

**Calling a model**
```html
<sly data-sly-use.cta="com.energy.core.models.CtaModel"/>
${cta.linkText}          → getLinkText()
${cta.ready}             → isReady()

<!-- with parameters -->
<sly data-sly-use.m="${'com.x.Model' @ rootPath='/content/x', max=12}"/>
```

**All block elements**
```html
data-sly-use.name="..."          instantiate
data-sly-set.name="${...}"       define a variable
data-sly-test="${...}"           conditional
data-sly-test.name="${...}"      conditional + store
data-sly-list.item="${...}"      repeat CHILDREN
data-sly-repeat.item="${...}"    repeat the ELEMENT
data-sly-unwrap                  drop the element, keep content
data-sly-resource="${...}"       include a RESOURCE
data-sly-include="file.html"     include a SCRIPT
data-sly-template.name="${@ a}"  define reusable markup
data-sly-call="${name @ a=x}"    call it
data-sly-element="${...}"        set the tag name
data-sly-attribute.href="${...}" set an attribute
data-sly-text="${...}"           replace content
<sly>                            invisible element
```

**Loop variables** (for `data-sly-list.item`)
```
itemList.index    0-based
itemList.count    1-based
itemList.first    itemList.last    itemList.middle
itemList.odd      itemList.even
```

**`data-sly-resource` options**
```html
@ resourceType='energy/components/cta'
@ decoration=false
@ decorationTagName='li'
@ addSelectors='teaser'
```

**Expression options**
```html
${v @ context='html'}                       rich text
${v @ context='uri'}                        URLs
${v @ context='unsafe'}                     NO escaping -- justify it
${'{0} of {1}' @ format=[a, b]}             build a string
${arr @ join=', '}                          join an array
${'Label' @ i18n, hint='where it appears'}  translate
${date @ format='dd MMM yyyy'}              format a date
```

**Contexts**
```
text · html · attribute · uri · scriptString
styleString · elementName · number · unsafe
```

**Globals**
```
properties · pageProperties · inheritedPageProperties
currentPage · currentStyle (the POLICY) · resource
resourceResolver · wcmmode · component · request
```

**Patterns**
```html
<!-- if / else -->
<sly data-sly-test.hasX="${m.x}">A</sly>
<sly data-sly-test="${!hasX}">B</sly>

<!-- default -->
<sly data-sly-set.t="${m.title || 'Fallback'}"/>

<!-- authoring placeholder -->
<sly data-sly-test="${!m.ready && wcmmode.edit}"
     data-sly-resource="${'' @ resourceType='wcm/core/components/placeholder'}"/>

<!-- colon property -->
${properties['jcr:title']}

<!-- comments -->
<!--/* stripped */-->      <!-- sent to the browser -->
```

---

## 09 — Workflows *(Syllabus point 19, first half)*

**Paths**
```
/conf/global/settings/workflow/models/           model DESIGN
/var/workflow/models/                            model RUNTIME (sync!)
/conf/global/settings/workflow/launcher/config/  launchers
/var/workflow/instances/                         running + completed instances
```

**Custom process step**
```java
@Component(service = WorkflowProcess.class,
           property = {"process.label=Energy - My Step"})
public class MyProcess implements WorkflowProcess {
    @Override
    public void execute(WorkItem workItem,
                        WorkflowSession session,
                        MetaDataMap metaData) throws WorkflowException { }
}
```

**Inside execute**
```java
String path  = workItem.getWorkflowData().getPayload().toString();
String type  = workItem.getWorkflowData().getPayloadType();   // JCR_PATH | JCR_UUID
String args  = metaData.get("PROCESS_ARGS", String.class);
ResourceResolver r = session.adaptTo(ResourceResolver.class); // do NOT close

// metadata shared across steps
workItem.getWorkflow().getWorkflowData().getMetaDataMap().put(k, v);
```

**Dynamic participant**
```java
@Component(service = ParticipantStepChooser.class,
           property = {"chooser.label=Energy - Route by Product Line"})
public class MyChooser implements ParticipantStepChooser {
    public String getParticipant(...) { return "a-group-name"; }
}
```

**Launcher properties**
```
glob        = "/content/energy/.../products/(.*)"   SCOPE IT
nodetype    = "cq:PageContent"                      not cq:Page
eventType   = Created | Modified | Removed
runModes    = "[author]"                            RESTRICT IT
condition   = optional expression
workflow    = /var/workflow/models/...
enabled     = true
```

**Consoles**
```
Tools → Workflow → Models       definitions, and SYNC
Tools → Workflow → Instances    what's running, where it's stuck
Tools → Workflow → Failures     steps that threw
Tools → Workflow → Launchers    why it did/didn't start
/system/console/components      is the process step even active
```

**Tool choice**
```
Time-based, no human            → Scheduler
Bulk async, guaranteed          → Sling Job
Human step or audit trail       → Workflow
```

---

## 10 — Schedulers, Sling Jobs and Events *(Syllabus point 19, second half)*

**Scheduler**
```java
@Component(service = Runnable.class, immediate = true)
@Designate(ocd = MyConfig.class)
public class MyTask implements Runnable {
    public void run() { }
}

// properties
scheduler.expression = "0 0 2 * * ?"
scheduler.concurrent = false        // almost always
scheduler.runOn      = "SINGLE"     // SINGLE | LEADER | ALL
scheduler.period     = 3600         // alternative to cron, in seconds
```

**Cron (Quartz — starts with SECONDS)**
```
sec min hour day-of-month month day-of-week [year]

0 0 2 * * ?        2am daily
0 */15 * * * ?     every 15 minutes
0 0 */4 * * ?      every 4 hours
0 0 3 ? * MON      3am Mondays
0 0 0 1 * ?        midnight, 1st of the month
0 30 6 ? * MON-FRI 6:30am weekdays

ONE day field must be ?  (not both *)
```

**Sling Job — produce**
```java
@Reference private JobManager jobManager;

Map<String, Object> props = new HashMap<>();
props.put("productId", "TX-4000");
jobManager.addJob("energy/product/sync", props);
```

**Sling Job — consume**
```java
@Component(service = JobConsumer.class,
    property = {JobConsumer.PROPERTY_TOPICS + "=energy/product/sync"})
public class MyConsumer implements JobConsumer {
    public JobResult process(Job job) {
        String id = job.getProperty("productId", String.class);
        return JobResult.OK;    // FAILED = retry | CANCEL = don't
    }
}
```

**ResourceChangeListener**
```java
@Component(service = ResourceChangeListener.class,
    property = {
        ResourceChangeListener.PATHS   + "=/content/energy/products",
        ResourceChangeListener.CHANGES + "=ADDED",
        ResourceChangeListener.CHANGES + "=CHANGED"
    })
public class MyListener implements ResourceChangeListener {
    public void onChange(List<ResourceChange> changes) {
        // CHEAP CHECK ONLY, then dispatch a job
    }
}
```

**EventHandler**
```java
@Component(service = EventHandler.class,
    property = {EventConstants.EVENT_TOPIC + "=" + ReplicationAction.EVENT_TOPIC})
public class MyHandler implements EventHandler {
    public void handleEvent(Event event) {
        ReplicationAction a = ReplicationAction.fromEvent(event);
    }
}
```

**Storage**
```
/var/eventing/jobs           Sling Jobs
/var/workflow/instances      Workflow instances (file 09)
schedulers                   IN MEMORY -- nothing persisted
```

**Consoles**
```
/system/console/scheduler    registered tasks + next fire time
/system/console/slingevent   job queues, topics, failures
/system/console/components   Active or Unsatisfied
```

**The choice**
```
Clock                  → Scheduler
Repository change      → Event handler (then dispatch a job)
Code decides, must not be lost → Sling Job
A human must act       → Workflow
```

---

## 11 — Dialog Validation *(Syllabus point 20)*

**Register a validator**
```javascript
(function ($, $document) {
    "use strict";
    $.validator.register({
        selector: "[data-validation='energy.productcode']",
        validate: function (el) {
            var v = el.val();
            if (!v) { return; }                     // empty = required's job
            if (!/^[A-Z]{2}-\d{4}$/.test(v)) {
                return "Must be like TX-4000";      // STRING = invalid
            }
            // nothing returned = valid
        }
    });
})(jQuery, jQuery(document));
```

**Clientlib**
```xml
jcr:primaryType="cq:ClientLibraryFolder"
categories="[cq.authoring.dialog]"
```

**Dialog field**
```xml
validation="energy.productcode"      → renders data-validation="..."
required="{Boolean}true"
fieldDescription="Format: TX-4000"   → prevents, don't just catch

<granite:data jcr:primaryType="nt:unstructured" maxLength="60"/>
    → renders data-max-length, read as $(el).data("maxLength")
```

**Cross-field revalidation**
```javascript
$document.on("change", "[name='./startDate']", function () {
    $(this).closest("form").find("[name='./endDate']").trigger("change");
});
```

**Show/hide (built in)**
```xml
select:  granite:class="cq-dialog-dropdown-showhide"
         <granite:data cq-dialog-dropdown-showhide-target=".my-target"/>
group:   granite:class="hide my-target"
         <granite:data showhidetargetvalue="optionValue"/>

checkbox equivalent: cq-dialog-checkbox-showhide
```

**Server-side counterpart**
```java
@PostConstruct
protected void init() {
    this.valid = PATTERN.matcher(value).matches();
    if (value != null && !valid) {
        LOG.warn("Invalid value '{}' at {} — dialog validation bypassed",
                 value, resource.getPath());
    }
}
public boolean isReady() { return valid; }
```

**Debug**
```
network tab (dialog open)                did the clientlib load
inspect the field                        is data-validation rendered
console, ABOVE where you're looking      earlier JS error
jQuery("[data-validation='x']").length   does the selector match
```

---

## 12 — MSM and Translation *(Syllabus point 21)*

**Structure**
```
/content/energy/
├── language-masters/
│   ├── en          authored SOURCE
│   ├── de          language copy of en (translated)
│   └── fr          language copy of en (translated)
├── us/en           live copy of language-masters/en
├── de/de           live copy of language-masters/de
└── ch/
    ├── de          live copy of language-masters/de
    └── fr          live copy of language-masters/fr
```

**Live copy relationship**
```
<page>/jcr:content/cq:LiveSyncConfig
    cq:master         = "/content/energy/language-masters/de"
    cq:isDeep         = true
    cq:rolloutConfigs = ["/libs/msm/wcm/rolloutconfigs/default"]
```

**Cancellation**
```
cq:propertyInheritanceCancelled = ["contactPhone","contactEmail"]
                                   ← PREFER THIS SCOPE

page level: Suspend (resumable) | Detach (permanent)
```

**Rollout config**
```
cq:trigger = "rollout" | "onModify" | "onActivate" | "onDeactivate"

actions:
    versionCopy        rollback point
    contentCopy        new pages
    contentUpdate      changed content
    contentDelete      removals
    referencesUpdate   REWRITE INTERNAL LINKS  ← don't omit
    orderChildren      page order
    pageMove           moved pages

/libs/msm/wcm/rolloutconfigs/    out of the box
/apps/msm/wcm/rolloutconfigs/    custom
```

**Translation**
```
TIF config: /conf/<site>/settings/cloudconfigs/translation
Language root: page named en | de | pt_br, plus jcr:language
Create Language Copy   → structure + translation project
Update Language Copy   → only what CHANGED (cost)
Machine: news, blogs · Human: specs, legal, regulatory
```

**The three steps**
```
1. TRANSLATE   → into the language master
2. ROLL OUT    → to country live copies (AUTHOR only)
3. ACTIVATE    → to publish
```

**Java API**
```java
@Reference LiveRelationshipManager liveRelationshipManager;

liveRelationshipManager.hasLiveRelationship(resource);
liveRelationshipManager.getLiveRelationship(resource, false);
    → relationship.getSourcePath()
    → relationship.getStatus().isCancelled()
```

**Audit query**
```
path=/content/energy
property=cq:propertyInheritanceCancelled
property.operation=exists
```

**Debug order for "the rollout didn't work"**
```
1. Inheritance cancelled?   (most common, and NOT an error)
2. Was it ACTIVATED?        (second most common)
3. Right sync action?
4. cq:isDeep true?
5. Dispatcher cache
```

---

## 13 — Users, Groups and Permissions *(Syllabus point 22)*

**Where things live**
```
/home/users/<bucket>/<userid>       rep:User
/home/groups/<bucket>/<groupid>     rep:Group
/home/users/system/...              service users
<node>/rep:policy                   the ACL (rep:GrantACE / rep:DenyACE)
```

**Privileges**
```
jcr:read
jcr:modifyProperties · jcr:addChildNodes
jcr:removeNode · jcr:removeChildNodes
jcr:readAccessControl · jcr:modifyAccessControl
jcr:versionManagement · jcr:lockManagement
crx:replicate          ← AEM: activate / deactivate
rep:write              ← aggregate of the 4 write privileges
jcr:all                ← everything
```

**Evaluation**
```
1. DENY BY DEFAULT
2. CLOSEST ACL WINS       (deeper overrides ancestor)
3. DENY BEATS ALLOW       (at the same level)

→ You CANNOT grant around a deny by adding another group.
```

**`rep:glob`**
```
(absent)         node + everything below
""               THE NODE ONLY
*                everything below
*/jcr:content*   page content nodes
```

**Repoinit**
```
create service user energy-content-reader with path system/cq:services/energy
create group energy-de-authors
add energy-de-authors to group energy-authors

set ACL for energy-de-authors
    allow jcr:read,rep:write on /content/energy/de
    allow jcr:read on /content/energy/language-masters
    allow jcr:read on /content/energy/shared restriction(rep:glob,"")
    deny  crx:replicate on /content/energy/de
end

create path (sling:Folder) /var/energy/reports
```

**Service user mapping**
```json
{ "user.mapping": [
    "com.energy.core:content-reader=[energy-content-reader]"
]}
```
Format: `bundle-symbolic-name:subservice=[system-user]` — **all three must match.**

**Getting a resolver**
```java
Map<String,Object> p = Collections.singletonMap(
        ResourceResolverFactory.SUBSERVICE, "content-reader");

try (ResourceResolver r = factory.getServiceResourceResolver(p)) {
    // runs as the SERVICE USER
}   // CLOSE what you opened

request.getResourceResolver();   // current user -- do NOT close
```

**Standard groups**
```
administrators · contributors · dam-users
workflow-users · user-administrators
everyone   ← EVERY user implicitly, including anonymous
```

**Debug**
```
Tools → Security → Users → IMPERSONATE     ← the best tool
CRXDE → Access Control tab                 effective policy, incl. inherited
/home/users/system                         does the service user exist
startup logs                               Repoinit failures
private window → publish directly          anonymous, no dispatcher
```

---

## 14 — AEM as a Cloud Service *(Syllabus point 23)*

**The frame**
```
6.5   = a SERVER you own      → you can change it, and you maintain it
AEMaaCS = a SERVICE you use   → immutable, disposable, Adobe maintains it
```

**Benefits (with the reason)**
```
No version upgrades       recurring cost that produces no features
Publish auto-scales       stop provisioning for peak
No repo maintenance       compaction, GC, indexes — invisible until a disk fills
Asset Compute             ingestion stops competing with authors
Pipeline discipline       production can't drift from Git
Adobe CDN included        one less contract and configuration
```

**Downsides — say these**
```
NO emergency hotfix path
No CRXDE on stage / prod
No custom run modes, no admin session, no local disk
Adobe's release cadence
Migration is real work
Cost is different, not automatically lower
```

**Developer changes**
```
/apps + /libs        IMMUTABLE at runtime
Service users, ACLs  REPOINIT only
Packages             ui.apps (immutable) vs ui.content + ui.config (mutable)
Run modes            author|publish × dev|stage|prod  — FIXED
Local disk           ephemeral
Long-running work    discouraged
@Deactivate          matters more — pods recycle constantly
Schedulers           pod count VARIES on publish
```

**Node stores**
```
AUTHOR   → DocumentNodeStore (MongoDB)   clustered, shares a repository
PUBLISH  → SegmentNodeStore              own copy per pod, faster
```

**Pipelines**
```
full-stack   everything            slowest
front-end    FE build output
web-tier     DISPATCHER config     fast
config       certain settings      fast — the closest thing to a quick fix
```

**Tooling**
```
Cloud Manager       pipelines, environments, logs
AEM SDK             local quickstart + dispatcher tools
RDE                 deploy in SECONDS, dev iteration only
Developer Console   status, bundles, OSGi configs
aio CLI             LIVE LOG TAILING, RDE deploys
```

**Migration tools, in order**
```
Best Practices Analyzer → Cloud Acceleration Manager
→ Repository Modernizer → Dispatcher Converter
→ Asset Workflow Migration → Content Transfer Tool
```

---

## 15 — Content Fragments *(Syllabus points 24, 25)*

**Paths**
```
/conf/<project>/settings/dam/cfm/models/<model>    the MODEL
/content/dam/<...>/fragments/<fragment>            the FRAGMENT (an asset)
    jcr:content/data/
        cq:model = <path to the model>
        master/       ← default variation
        <variation>/  ← others
```

**Reading in a model**
```java
Resource r = resourceResolver.getResource(fragmentPath);   // null-check
ContentFragment fragment = r.adaptTo(ContentFragment.class);  // null-check
                                    // ↑ the ASSET node, not jcr:content

ContentElement element = fragment.getElement("productName");
String value = element.getContent();

FragmentData data = element.getValue();
String contentType = data.getContentType();     // text/html | text/plain
String typed = data.getValue(String.class);

ContentVariation v = element.getVariation("social");   // null → use master

Iterator<ContentElement> all = fragment.getElements();
fragment.getName() · getTitle() · getDescription()
```

**Do it in `@PostConstruct`, not a getter.**

**Content types**
```
text/plain        → default HTL escaping
text/html         → ${value @ context='html'}
text/x-markdown   → render as markdown
```

**GraphQL**
```
Ad-hoc:     POST to the endpoint          NOT cacheable
Persisted:  GET /graphql/execute.json/<config>/<queryName>;var=value
                                          CACHED as a file

Persisted queries stored under /conf/<project>/settings/graphql
```

**Model changes**
```
ADD    field  → safe
RENAME field  → BREAKS existing fragments
REMOVE field  → data stays, stops surfacing
CHANGE type   → risky
```

**Debug order — "blank on publish"**
```
1. Was the FRAGMENT activated?   ← publishing the page does NOT
2. Can anonymous read the DAM path?
3. Is the path the same on both environments?
```

---

## 16 — Experience Fragments *(Syllabus point 24, completing it)*

**Structure**
```
/content/experience-fragments/energy/de/de/site/header/
    master        ← a VARIATION (a cq:Page) -- reference THIS
    social        ← another variation, possibly a different template
```

**Placement in a template structure**
```xml
<header sling:resourceType="energy/components/experiencefragment"
        fragmentVariationPath=".../site/header/master"/>
        <!-- no editable=true → LOCKED -->
```

**Plain HTML export**
```
/content/experience-fragments/.../master.plain.html
    → just the markup, no page chrome
    → a normal cacheable GET
    → a PUBLIC URL
```

**CF vs XF**
```
CF: dam:Asset   · /content/dam                  · from a MODEL    · JSON  · CHANNELS
XF: cq:Page     · /content/experience-fragments · from a TEMPLATE · HTML  · PAGES

"Content without presentation"  vs  "Presentation with content"
```

**Localisation**
```
/content/experience-fragments/energy/
    language-masters/en|de/site/header/master   ← authored + translated
    de/de/site/header/master                    ← LIVE COPY
    ch/de/site/header/master                    ← LIVE COPY
```

**Debug**
```
Missing on publish       → the FRAGMENT wasn't activated
Old version showing      → rendered inline; the PAGE cache holds it
Unstyled in the editor   → XF template's page policy lacks the clientlibs
Won't resolve localised  → folder structure doesn't match the locale
Who uses it?             → the References panel
```

---

## 17 — Sling Model Exporter *(Syllabus point 26)*

**Making a model exportable**
```java
@Model(
    adaptables = SlingHttpServletRequest.class,
    adapters = { MyModel.class, ComponentExporter.class },
    resourceType = "energy/components/cta",       // ← REQUIRED
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
@Exporter(name = ExporterConstants.SLING_MODEL_EXPORTER_NAME,   // "jackson"
          extensions = ExporterConstants.SLING_MODEL_EXTENSION) // "json"
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CtaImpl implements Cta, ComponentExporter { }
```

**The URL**
```
/content/.../cta.model.json          a component
/content/.../page.model.json         a whole page (SPA)

selector = model · extension = json  → PATH-BASED → CACHEABLE
```

**Controlling the output**
```java
@JsonProperty("url")     name the field EXPLICITLY (contract safety)
@JsonIgnore              exclude — and skip the getter call
@JsonInclude(NON_NULL)   omit nulls
```

**SPA interfaces**
```java
ComponentExporter  → getExportedType()       → ":type"
ContainerExporter  → getExportedItems()      → ":items"
                   → getExportedItemsOrder() → ":itemsOrder"
```

**SPA binding**
```javascript
MapTo('energy/components/cta')(CtaComponent);
```

**Dispatcher**
```
/0110 { /type "allow" /selectors "model" /extension "json" /path "/content/*" }
```

**Debug**
```
JSON has jcr:primaryType?  → the DefaultGetServlet answered
                             → missing resourceType on @Model
404 on publish only        → dispatcher selector not allowed
Field missing              → @JsonIgnore, or null + NON_NULL
Field appeared             → someone added a public getter
```

**The choice**
```
Consumer mirrors our page      → Model Exporter (page-shaped)
Consumer has its own structure → Content Fragments + GraphQL
Aggregation / HTML / bespoke   → custom servlet
```

---

## 18 — Replication and Distribution *(Syllabus point 27)*

**Actions**
```
ACTIVATE    → publish
DEACTIVATE  → remove from publish, KEEP on author
DELETE      → remove from BOTH
TEST        → connectivity only
```

**Agents**
```
/etc/replication/agents.author/
    publish   author → publish        (content)
    flush     author → dispatcher     (CACHE INVALIDATION)
    reverse   publish → author        (polled by author)

Settings tab   → enabled, AGENT USER (reads on author), retry, log level
Transport tab  → URI /bin/receive, TRANSPORT USER (writes on publish)
Triggers tab   → On Modification (leave OFF), On Off Time
```

**The two users**
```
Agent user      reads on AUTHOR    → under-privileged = SILENT skipping
Transport user  writes on PUBLISH  → wrong = 401, QUEUE BLOCKS
```

**From code**
```java
@Reference private Replicator replicator;
Session session = resolver.adaptTo(Session.class);
replicator.replicate(session, ReplicationActionType.ACTIVATE, path);
// user needs crx:replicate
// NEVER in a loop → batched Sling Jobs, out of hours, REFERENCES FIRST
```

**Events**
```java
ReplicationAction.EVENT_TOPIC
ReplicationAction.fromEvent(event).getType() == ACTIVATE
// runs SYNCHRONOUSLY — decide here, dispatch a job
```

**Cloud Service**
```
Sling Content Distribution — PUB/SUB
Author publishes to a pipeline; pods SUBSCRIBE and PULL.
A new pod catches up BY ITSELF.

Why: agents push to a CONFIGURED URI; pods are created and
destroyed, so you can't configure an agent for one that
doesn't exist yet — and a new pod has no content.
```

**THE SIX-STEP WALK**
```
1. Was it ACTIVATED?          page properties → replication status
2. Is the QUEUE blocked?      one stuck item blocks the rest
3. Node on PUBLISH?           private window, publish DIRECTLY
4. REFERENCES published?      fragments, assets, XFs  ← the silent one
5. DISPATCHER cached?         flush didn't happen / didn't arrive
6. CDN cached?                one layer further out

Most common: 1 and 5.
```

---

## Cross-topic threads worth remembering

These recur across multiple files above, and interviewers notice when a candidate connects them instead of treating each file as isolated.

**"Works on author, blank on publish."** One root cause, over and over: **author is authenticated, publish is anonymous.** If code relies on a session privilege author has and publish doesn't — or on content that was never activated (files 15, 16, 18) — this is the symptom. The debug order is always: was it activated? → can anonymous actually read it? → is the path the same on both environments?

**"A dot is cached, a question mark is not."** Selectors and extensions (`.model.json`, `.cards.html`) are part of the **path**, so the dispatcher can cache them. Query parameters (`?page=2`) are not part of the cache key by default, so they bypass the cache — this shows up in files 04, 07, 15, and 17 wherever a URL is being designed for cacheability.

**Derived content needs its own invalidation.** A page that renders a Content Fragment, an Experience Fragment, or another page's data (files 02, 15, 16, 17, 18) is only as fresh as the **last time the thing driving it was activated and its cache invalidated** — activating the source doesn't automatically flush every page that happens to reference it.

**Deny wins, closest ACL wins, and you cannot grant your way around a deny** (file 13) — this single evaluation rule explains almost every "why can't this user see that" ticket.

**On Cloud Service, there is no emergency hotfix path** (file 14) — every change, including a genuine production emergency, goes through the same pipeline. The honest mitigation is feature flags and the fast config/web-tier pipelines, not a workaround.

---

*Master Cheat Sheet — AEM Interview Preparation repository. Companion to files 01–18. Teaching style, energy-sector project domain.*
