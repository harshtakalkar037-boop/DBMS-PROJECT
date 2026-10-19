-- Exact CREATE definitions from pinned repository b3b56e06cfa8df6ef3765380d0a14ba75b05dc22.
-- Reference only. NOT executed in this audit. Use only an authorized disposable schema.
DELIMITER $$

-- database/07_functions.sql:42-63
CREATE FUNCTION `fn_calculate_attendance_percentage`(
  p_student_id  INT UNSIGNED,
  p_offering_id INT UNSIGNED
) RETURNS decimal(5,2)
    READS SQL DATA
BEGIN
  DECLARE v_total   INT DEFAULT 0;
  DECLARE v_present INT DEFAULT 0;

  SELECT COUNT(*),
         SUM(CASE WHEN a.`status` IN ('PRESENT','LATE') THEN 1 ELSE 0 END)
  INTO   v_total, v_present
  FROM `attendance` a
  WHERE a.`student_id`  = p_student_id
    AND a.`offering_id` = p_offering_id
    AND a.`status`     <> 'EXCUSED';

  IF v_total = 0 THEN
    RETURN 100.00;
  END IF;
  RETURN ROUND((v_present / v_total) * 100, 2);
END$$

-- database/07_functions.sql:72-91
CREATE FUNCTION `fn_calculate_semester_attendance`(
  p_student_id  INT UNSIGNED,
  p_semester_id SMALLINT UNSIGNED
) RETURNS decimal(5,2)
    READS SQL DATA
BEGIN
  DECLARE v_total   INT DEFAULT 0;
  DECLARE v_present INT DEFAULT 0;

  SELECT COUNT(*),
         SUM(CASE WHEN a.`status` IN ('PRESENT','LATE') THEN 1 ELSE 0 END)
  INTO   v_total, v_present
  FROM `attendance` a
  WHERE a.`student_id`  = p_student_id
    AND a.`semester_id` = p_semester_id
    AND a.`status`     <> 'EXCUSED';

  IF v_total = 0 THEN RETURN 100.00; END IF;
  RETURN ROUND((v_present / v_total) * 100, 2);
END$$

-- database/07_functions.sql:99-109
CREATE FUNCTION `fn_grade_points`(p_percentage DECIMAL(5,2))
RETURNS decimal(4,2)
    READS SQL DATA
BEGIN
  DECLARE v_points DECIMAL(4,2) DEFAULT 0.00;
  SELECT g.`grade_points` INTO v_points
  FROM `grades` g
  WHERE p_percentage BETWEEN g.`min_percentage` AND g.`max_percentage`
  ORDER BY g.`min_percentage` DESC LIMIT 1;
  RETURN IFNULL(v_points, 0.00);
END$$

-- database/07_functions.sql:117-127
CREATE FUNCTION `fn_grade_code`(p_percentage DECIMAL(5,2))
RETURNS varchar(4)
    READS SQL DATA
BEGIN
  DECLARE v_code VARCHAR(4) DEFAULT 'FF';
  SELECT g.`grade_code` INTO v_code
  FROM `grades` g
  WHERE p_percentage BETWEEN g.`min_percentage` AND g.`max_percentage`
  ORDER BY g.`min_percentage` DESC LIMIT 1;
  RETURN IFNULL(v_code, 'FF');
END$$

-- database/07_functions.sql:137-157
CREATE FUNCTION `fn_calculate_sgpa`(
  p_student_id  INT UNSIGNED,
  p_semester_id SMALLINT UNSIGNED
) RETURNS decimal(4,2)
    READS SQL DATA
BEGIN
  DECLARE v_sgpa DECIMAL(4,2) DEFAULT 0.00;

  SELECT ROUND(SUM(s.`credits` * m.`grade_points`) / NULLIF(SUM(s.`credits`),0), 2)
  INTO v_sgpa
  FROM `marks` m
  JOIN `exam_registrations` er ON er.`registration_id` = m.`registration_id`
  JOIN `exams`      e  ON e.`exam_id`  = er.`exam_id`
  JOIN `course_offerings` co ON co.`offering_id` = er.`offering_id`
  JOIN `subjects`   s  ON s.`subject_id` = co.`subject_id`
  WHERE er.`student_id` = p_student_id
    AND e.`semester_id` = p_semester_id
    AND m.`grade_points` IS NOT NULL;

  RETURN IFNULL(v_sgpa, 0.00);
END$$

-- database/07_functions.sql:167-180
CREATE FUNCTION `fn_calculate_student_cgpa`(p_student_id INT UNSIGNED)
RETURNS decimal(4,2)
    READS SQL DATA
BEGIN
  DECLARE v_cgpa DECIMAL(4,2) DEFAULT 0.00;

  SELECT ROUND(SUM(r.`sgpa` * r.`total_credits`) / NULLIF(SUM(r.`total_credits`),0), 2)
  INTO v_cgpa
  FROM `results` r
  WHERE r.`student_id` = p_student_id
    AND r.`total_credits` > 0;

  RETURN IFNULL(v_cgpa, 0.00);
END$$

-- database/07_functions.sql:191-216
CREATE FUNCTION `fn_calculate_late_fee`(p_student_fee_id INT UNSIGNED)
RETURNS decimal(10,2)
    READS SQL DATA
BEGIN
  DECLARE v_due_date   DATE;
  DECLARE v_grace_days INT DEFAULT 0;
  DECLARE v_per_day    DECIMAL(8,2) DEFAULT 0.00;
  DECLARE v_days_late  INT DEFAULT 0;
  DECLARE v_status     VARCHAR(20);

  SELECT sf.`due_date`, fs.`grace_days`, fs.`late_fee_per_day`, sf.`status`
  INTO   v_due_date, v_grace_days, v_per_day, v_status
  FROM `student_fees` sf
  JOIN `fee_structures` fs ON fs.`fee_structure_id` = sf.`fee_structure_id`
  WHERE sf.`student_fee_id` = p_student_fee_id;

  IF v_due_date IS NULL OR v_status IN ('PAID','REFUNDED') THEN
    RETURN 0.00;
  END IF;

  SET v_days_late = DATEDIFF(CURDATE(), DATE_ADD(v_due_date, INTERVAL v_grace_days DAY));
  IF v_days_late <= 0 THEN
    RETURN 0.00;
  END IF;
  RETURN ROUND(v_days_late * v_per_day, 2);
END$$

-- database/07_functions.sql:226-253
CREATE FUNCTION `fn_calculate_faculty_leave_balance`(
  p_faculty_id       INT UNSIGNED,
  p_leave_type       VARCHAR(20),
  p_academic_year_id SMALLINT UNSIGNED
) RETURNS decimal(5,2)
    READS SQL DATA
BEGIN
  DECLARE v_allotted DECIMAL(5,2) DEFAULT 0.00;
  DECLARE v_used     DECIMAL(5,2) DEFAULT 0.00;

  SELECT IFNULL(`allotted`,0) - IFNULL(`used`,0)
  INTO v_allotted
  FROM `leave_balances`
  WHERE `faculty_id` = p_faculty_id
    AND `leave_type` = p_leave_type
    AND `academic_year_id` = p_academic_year_id
  LIMIT 1;

  -- Reserve pending applications so the balance cannot be double-spent.
  SELECT IFNULL(SUM(`days`),0)
  INTO v_used
  FROM `faculty_leaves`
  WHERE `faculty_id` = p_faculty_id
    AND `leave_type` = p_leave_type
    AND `status`     = 'PENDING';

  RETURN v_allotted - v_used;
END$$

-- database/07_functions.sql:261-271
CREATE FUNCTION `fn_student_outstanding_dues`(p_student_id INT UNSIGNED)
RETURNS decimal(12,2)
    READS SQL DATA
BEGIN
  DECLARE v_dues DECIMAL(12,2) DEFAULT 0.00;
  SELECT IFNULL(SUM(`due_amount`),0) INTO v_dues
  FROM `student_fees`
  WHERE `student_id` = p_student_id
    AND `status` IN ('PENDING','PARTIAL','OVERDUE');
  RETURN v_dues;
END$$

-- database/07_functions.sql:279-290
CREATE FUNCTION `fn_hostel_available_beds`(p_hostel_id SMALLINT UNSIGNED)
RETURNS int
    READS SQL DATA
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
  FROM `beds` b
  JOIN `rooms` r ON r.`room_id` = b.`room_id`
  WHERE r.`hostel_id` = p_hostel_id
    AND b.`status` = 'AVAILABLE';
  RETURN v_count;
END$$

-- database/07_functions.sql:301-342
CREATE FUNCTION `fn_calculate_net_salary`(
  p_faculty_id INT UNSIGNED,
  p_month      TINYINT UNSIGNED,
  p_year       SMALLINT UNSIGNED
) RETURNS decimal(12,2)
    READS SQL DATA
BEGIN
  DECLARE v_basic, v_hra, v_da, v_ta, v_sa DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_gross, v_pf, v_pt, v_it, v_lop, v_other, v_net DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_pf_pct   DECIMAL(5,2) DEFAULT 12.00;
  DECLARE v_lop_days TINYINT DEFAULT 0;
  DECLARE v_per_day  DECIMAL(12,2) DEFAULT 0.00;

  SELECT f.`basic_salary`, f.`hra`, f.`da`, f.`ta`, f.`special_allowance`, f.`pf_percent`
  INTO   v_basic, v_hra, v_da, v_ta, v_sa, v_pf_pct
  FROM `faculty` f WHERE f.`faculty_id` = p_faculty_id;

  IF v_basic IS NULL THEN RETURN 0.00; END IF;

  -- Loss of pay: approved UNPAID leaves that overlap the payroll month.
  SELECT IFNULL(SUM(fl.`days`),0) INTO v_lop_days
  FROM `faculty_leaves` fl
  WHERE fl.`faculty_id` = p_faculty_id
    AND fl.`status` = 'APPROVED'
    AND fl.`leave_type` IN ('UNPAID')
    AND MONTH(fl.`start_date`) = p_month
    AND YEAR(fl.`start_date`)  = p_year;

  SELECT IFNULL(`setting_value`, '200') INTO v_pt
  FROM `system_settings` WHERE `setting_key` = 'PROFESSIONAL_TAX';

  SET v_gross  = v_basic + v_hra + v_da + v_ta + v_sa;
  SET v_pf     = ROUND(v_basic * (v_pf_pct / 100), 2);
  SET v_it     = ROUND(GREATEST(0, (v_gross * 12 - 250000) * 0.05 / 12.0), 2);
  SET v_per_day= ROUND(v_gross / 30, 2);
  SET v_lop    = ROUND(v_per_day * v_lop_days, 2);
  SET v_other  = 0.00;
  SET v_net    = v_gross - v_pf - v_pt - v_it - v_lop - v_other;

  IF v_net < 0 THEN SET v_net = 0.00; END IF;
  RETURN ROUND(v_net, 2);
END$$

-- database/07_functions.sql:350-366
CREATE FUNCTION `fn_student_backlog_count`(p_student_id INT UNSIGNED)
RETURNS int
    READS SQL DATA
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT er.`offering_id`,
           MAX(m.`grade_points`) AS best_points
    FROM `marks` m
    JOIN `exam_registrations` er ON er.`registration_id` = m.`registration_id`
    WHERE er.`student_id` = p_student_id
    GROUP BY er.`offering_id`
    HAVING best_points = 0
  ) x;
  RETURN v_count;
END$$

-- database/07_functions.sql:374-391
CREATE FUNCTION `fn_student_earned_credits`(p_student_id INT UNSIGNED)
RETURNS int
    READS SQL DATA
BEGIN
  DECLARE v_credits INT DEFAULT 0;
  SELECT IFNULL(SUM(s.`credits`),0) INTO v_credits
  FROM (
    SELECT er.`offering_id`, MAX(m.`grade_points`) AS best_points
    FROM `marks` m
    JOIN `exam_registrations` er ON er.`registration_id` = m.`registration_id`
    WHERE er.`student_id` = p_student_id
    GROUP BY er.`offering_id`
    HAVING best_points > 0
  ) x
  JOIN `course_offerings` co ON co.`offering_id` = x.`offering_id`
  JOIN `subjects` s ON s.`subject_id` = co.`subject_id`;
  RETURN v_credits;
END$$
DELIMITER ;
