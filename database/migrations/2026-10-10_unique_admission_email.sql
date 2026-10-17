-- Enforce one admission application per email address at the database level.
-- This closes the race between the API's friendly duplicate check and concurrent submits.
-- Preflight the query below first if migrating an existing database; all returned rows
-- must be reviewed and consolidated before applying the UNIQUE key.
SELECT LOWER(TRIM(`email`)) AS normalized_email, COUNT(*) AS row_count
FROM `admissions`
GROUP BY LOWER(TRIM(`email`))
HAVING COUNT(*) > 1;

ALTER TABLE `admissions`
  ADD UNIQUE KEY `uq_admissions_email` (`email`);
