# PICT DBMS ERP report package — 2026–2027

**Editable, source-grounded academic drafts; not signed institutional certificates and not live-system test certification.**

Prepared from the three supplied PICT templates and the tracked contents of:

- Repository: https://github.com/harshtakalkar037-boop/DBMS-PROJECT
- Pinned commit: `b3b56e06cfa8df6ef3765380d0a14ba75b05dc22`
- Review/preparation date: **19 October 2026**. This is not an approval, submission or business-test execution date.

## 1. Open these deliverables

| File | Purpose |
|---|---|
| [00_Master_ERP_Project_Report.docx](00_Master_ERP_Project_Report.docx) | Enterprise architecture, complete schema/dictionary and normalization analysis, seven modules, all programmable SQL definitions, cross-cutting adjuncts, integration/testing, limitations and references. |
| [01_Module_Report_Student_and_Admission_Management.docx](01_Module_Report_Student_and_Admission_Management.docx) | Student and Admission Management. |
| [02_Module_Report_Academic_and_Course_Management.docx](02_Module_Report_Academic_and_Course_Management.docx) | Academic and Course Management. |
| [03_Module_Report_Attendance_Management.docx](03_Module_Report_Attendance_Management.docx) | Attendance Management. |
| [04_Module_Report_Examination_and_Results.docx](04_Module_Report_Examination_and_Results.docx) | Examination and Results, with practice-examination adjunct coverage. |
| [05_Module_Report_Fees_and_Payments.docx](05_Module_Report_Fees_and_Payments.docx) | Fees and Payments. |
| [06_Module_Report_Hostel_Management.docx](06_Module_Report_Hostel_Management.docx) | Hostel Management. |
| [07_Module_Report_Faculty_HR_and_Payroll.docx](07_Module_Report_Faculty_HR_and_Payroll.docx) | Faculty, HR and Payroll. |
| [08_Missing_Information_Checklist.docx](08_Missing_Information_Checklist.docx) | 19 unresolved items, with reason, exact owner/team input, suggested source and priority. |
| [09_Consolidated_Inventory_and_Evidence.xlsx](09_Consolidated_Inventory_and_Evidence.xlsx) | 24 filterable sheets: tables/columns/FKs/constraints/SQL objects, normalization, API/source maps, queries, tests, per-object proof slots, missing information, diagrams/screenshots, findings, template compliance and tracked-file review. |
| [10_Final_Template_Compliance_Checklist.docx](10_Final_Template_Compliance_Checklist.docx) | 37 criteria mapped to the three supplied templates and user requirements. Pending inputs are not marked approved. |

The seven boundaries come from relational ownership and routes/services/repositories, **not seven navigation menus**. Shared masters and AI/mock/risk adjuncts are separately identified; they are not a fictitious eighth core module.

The master is deliberately large: it includes every actual table/column and all 78 exact SQL definitions, not just selected snippets. The seven module reports can be used separately for their module's review and viva. External-parent key contracts distinguish dependencies from owned tables.

## 2. Coverage and evidence boundary

| Source-backed inventory | Count |
|---|---:|
| Tracked repository files inventoried / hash-reconciled | 260 |
| Relational tables / columns | 61 / 677 |
| Foreign keys / UNIQUE constraints / CHECK constraints | 138 / 61 / 57 |
| Stored procedures / triggers / functions / views | 17 / 28 / 13 / 20 |
| Analytical SQL examples / API routes | 45 / 231 |
| Formal test cases | 64: 59 pending + 5 executed command cases |
| Additional programmable-object evidence slots | 78, all pending live execution |
| Static findings | 33, observations rather than invented executed failures |
| Master figures | 45, including 28 readable ER sheets |
| Required new screenshot slots | 21, all pending genuine sanitized captures |
| Missing-information items / template compliance criteria | 19 / 37 |

### Actually executed here

- Backend `npm run typecheck`: **PASS**, exit 0.
- Backend `npm run build`: **PASS**, exit 0.
- Frontend `npm run typecheck`: **PASS**, exit 0.
- Frontend `npm run build`: **PASS**, exit 0.
- Backend `npm test`: **exit 1; No test files found**. This is not a passing unit-test suite.
- Seven command logs also include the two dependency-install logs. See `evidence/` and the workbook.
- Final automated static/document/package preflight: **264 checks, 0 failures**. It verifies the inventories, tracked-source hashes, exact editable SQL text, dictionary columns/types, numbering, caption/section settings, rendered fonts/layout and selected privacy signatures. This does **not** certify database behavior, access control or production security.

### Not executed or approved here

No live database installation/query/procedure/trigger test, API business test, UI end-to-end test, load/concurrency test, restore test or deployment health check was performed. Repository scripts and historical reports are not treated as fresh results. Existing Group2 screenshots use intercepted fixture APIs; they are not proof of a connected working database. No newly captured live screenshots are represented as evidence.

Student identities/rolls/exam numbers, guide/HOD confirmation, official approval date and signatures, institutional policies and live test results remain team-owned inputs. The HOD wording in the certificate is retained from the supplied template, not independently verified as current. The unsigned draft banner should remain until the responsible institution approves the final document.

## 3. Supporting folders

### `inventories/`

CSV counterparts and safe structural JSON, including:

- `table_inventory.csv` and `relationship_inventory.csv`
- `required_diagrams_and_screenshots.csv`: 45 diagram entries, 21 pending capture entries and one existing-screenshot provenance entry
- `test_evidence_checklist.csv`: all 64 formal cases
- `sql_object_evidence_checklist.csv`: one proof slot per actual SQL object
- `missing_information_checklist.csv`
- `final_template_compliance_checklist.csv`
- `tracked_file_review_register.csv`
- `structural_inventory.json`: schema definitions and static metadata, **not row data**

Where a workbook DEFAULT cell is blank, no explicit DEFAULT was recorded; use the separate nullability column and full exact declaration rather than interpreting the blank as a fabricated default. Nullable UNIQUE tuples are not automatically candidate keys.

### `diagrams/`

- `00_complete_enterprise_ER.mmd`: full logical enterprise ER source, including attributes.
- `03_er_panel_MM_part_PP.{svg,png,dot,mmd}`: 28 A4-friendly sheets. Every table appears as a child relation once; all 138 outgoing FK IDs reconcile exactly once.
- Common architecture, enterprise overview, Level 0 context DFD, seven Level 1 module DFDs and seven procedure-workflow supplements.

**SVG is the primary editable print-layout source.** PNGs are the embedded report illustrations. DOT/Mermaid are editable logical sources; regenerating them with a different tool may produce a different layout. Full enterprise Mermaid is intended for zoom/edit rather than fitting 61 full entities onto one portrait page.

ER arrows point **child FK → parent key**. `[P; C]` labels show parents per child and children per parent, inferred from actual nullability/uniqueness. DFD actor repetition does not mean duplicated actors or confirmed row-level authorization. Workflows are expressly **not** mislabeled as canonical Level 2 DFDs. If the guide requires a separate Level 2 DFD for a selected process, obtain that scope/drawing approval before submission.

For edits: keep entity/column names, FK IDs, process/store names and source references aligned with the inventories; re-export the SVG/PNG, replace the image in Word and update its numbered caption and list entry.

### `sql_reference/`

Exact source definitions for all tables and deferred schema clauses, 17 procedures, 28 triggers, 13 functions, 20 views and Q01–Q45 analytical examples.

**These are unexecuted reference extracts, not installation scripts or a validated migration bundle.** Use the original repository's installation tooling only after reviewing its runtime/configuration/order differences and resolving the listed issues. Definitions preserve source comments even where those comments are stale; accompanying narratives/notes distinguish actual definitions from comments and historical claims.

Do not use a production database as the fixture environment. Several procedures issue internal COMMIT; an outer ROLLBACK does not reliably undo such calls. The current repository DB harness also needs signature/assertion-output fixes before a pass claim is justified.

### `evidence/`

Actual command logs, command-result summary, generation coverage, layout/font review and the final static preflight ledger. No credentials, real student records or synthetic screenshots presented as live evidence are included.

### `templates/`

Unmodified copies of the three supplied PDFs, referenced as T01/T02/T03 in the compliance register. The supplied cover logo is used in the editable reports.

## 4. Before final submission

1. Work through `08_Missing_Information_Checklist.docx`, starting with High-priority items. Search all reports for `[[TO BE PROVIDED:`; preserve the exact marker until the actual owner supplies and verifies the missing information. Do not substitute guessed identities, dates or fabricated results.
2. Confirm the official project/module titles and author slots, current guide/HOD, rolls/exam numbers and institutional settings/year. The report year is 2026–2027; repository defaults do not establish matching live runtime settings.
3. Resolve or explicitly document the 33 static findings and approved policy decisions. Implementation, partial/gap, planned enhancement and unverified execution are distinct states.
4. Install/run on an authorized disposable environment with consistent synthetic parent keys and fixtures. Repair the existing test harness, then record actual results/status/evidence for every applicable formal case and each SQL-object proof slot. Pending actual/status cells deliberately use `[[TO BE PROVIDED: run this test and record the actual result]]`.
5. Capture the 21 genuine screenshot slots with route/screen, synthetic fixture identifier, timestamp and matching test/network/DB evidence. Mask tokens, credentials and personal details.
6. Open the final edited `.docx` files in **Microsoft Word with Times New Roman installed**. Update all fields and choose **Update entire table** for the contents/list fields. Review headers/footers and print preview after edits; layout can vary between Word versions/renderers.
7. Verify A4 portrait, one column; top/bottom/left margins 1 inch and right margin 0.75 inch; TNR12 body/1.5 spacing; chapter headings 14pt bold; hierarchical headings 12pt with 6pt before/after; centered TNR10 captions (tables above, figures below). Cover/certificate/acknowledgement are unnumbered, the abstract starts Roman i and Chapter 1 restarts Arabic 1.
8. Check caption/heading numbers and references after adding/removing content. Editable TOC/list fields were refreshed during preparation; generated caption numbers must also be maintained if you insert additional items.
9. Obtain the actual guide/institutional review and signatures. This package does not create or imply official approval.

The final revised static render used **Microsoft core Times New Roman** fonts, with no non-TNR text spans in the eight main report PDFs reviewed. Font binaries are not redistributed in this ZIP. QA PDFs are preparation artifacts; editable DOCX files are the supplied report deliverables.

## 5. Integrity and privacy

`SHA256SUMS.txt` lists all package files except itself. `evidence/package_preflight.json` records the actual static checks and their limits. The ZIP was CRC-tested after assembly.

No seed records, demo-login files, environment secret values, API keys, password hashes, secret connection strings or private keys are intentionally exported. Column/parameter names such as `password_hash` are structural identifiers, not credential values. A static signature scan is an additional precaution, not a comprehensive confidentiality/security guarantee; review all newly entered evidence before sharing.
