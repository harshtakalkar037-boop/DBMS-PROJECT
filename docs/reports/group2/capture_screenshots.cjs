// Capture real React UI pages using synthetic API fixtures only.
// The DB/API are not running in the report-building sandbox; captions disclose that.
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/home/user/.npm/_npx/e41f203b7505f1fb/node_modules/playwright')); }
const out = __dirname + '/screenshots';
const encode = x => Buffer.from(JSON.stringify(x)).toString('base64url');
const token = `${encode({alg:'none',typ:'JWT'})}.${encode({sub:'1',role:'ADMIN',email:'admin@pict.edu',name:'Administrator',mustChangePassword:false})}.mock`;
const departments = [
  ['CE','Computer Engineering','CE'],
  ['ETC','Electronics and Telecommunication Engineering','E&TC'],
  ['IT','Information Technology','IT'],
  ['AIDS','Artificial Intelligence and Data Science','AI&DS'],
  ['ECE','Electronics and Computer Engineering','E&CE'],
  ['BSH','Basic Sciences and Humanities (F.Y. B.Tech)','BS&H'],
].map(([department_code,name,short_name],i)=>({department_id:i+1,department_code,name,short_name,established_year:null,status:'ACTIVE',email:`demo-${department_code.toLowerCase()}@example.com`}));
const programs = [
  ['BTECH-CE','B.Tech. Computer Engineering','UG',1,4,8,160,60],
  ['BTECH-ETC','B.Tech. Electronics and Telecommunication Engineering','UG',2,4,8,160,60],
  ['BTECH-IT','B.Tech. Information Technology','UG',3,4,8,160,60],
  ['BTECH-AIDS','B.Tech. Artificial Intelligence and Data Science','UG',4,4,8,160,60],
  ['BTECH-ECE','B.Tech. Electronics and Computer Engineering','UG',5,4,8,160,60],
  ['MTECH-CE','M.Tech. Computer Engineering','PG',1,2,4,80,30],
  ['MTECH-DS','M.Tech. Data Science','PG',4,2,4,80,30],
  ['MTECH-WCT','M.Tech. Electronics and Communication (Wireless Communication Technology)','PG',2,2,4,80,30],
].map(([program_code,name,level,department_id,duration_years,total_semesters,total_credits,intake],i)=>({program_id:i+1,program_code,name,program_name:name,programCode:program_code,level,department_id,duration_years,total_semesters,total_credits,intake,status:'ACTIVE'}));
const batches = [
  [1,'BTECH-CE-2026','BTECH-CE',1,56],
  [2,'BTECH-ETC-2026','BTECH-ETC',2,58],
  [3,'BTECH-IT-2026','BTECH-IT',3,53],
  [4,'BTECH-AIDS-2026','BTECH-AIDS',4,55],
].map(([batch_id,batch_code,programCode,department_id,studentCount])=>({batch_id,batch_code,programCode,start_year:2026,end_year:2030,current_semester_no:1,strength:60,studentCount,status:'ACTIVE',yearLabel:'2026-27'}));
const sections = [
  {section_id:1,section_code:'A',programCode:'BTECH-CE',batchCode:'BTECH-CE-2026',capacity:60,room_number:'R101',classTeacherFirst:'Demo',classTeacherLast:'Faculty 01',studentCount:56,status:'ACTIVE'},
  {section_id:2,section_code:'A',programCode:'BTECH-ETC',batchCode:'BTECH-ETC-2026',capacity:60,room_number:'R102',classTeacherFirst:'Demo',classTeacherLast:'Faculty 02',studentCount:58,status:'ACTIVE'},
  {section_id:3,section_code:'A',programCode:'BTECH-IT',batchCode:'BTECH-IT-2026',capacity:60,room_number:'R103',classTeacherFirst:null,classTeacherLast:null,studentCount:53,status:'ACTIVE'},
];
const years = [
  {academic_year_id:1,year_label:'2024-25',start_date:'2024-07-01',end_date:'2025-04-30',is_current:false,semesterCount:2,status:'CLOSED'},
  {academic_year_id:2,year_label:'2025-26',start_date:'2025-07-01',end_date:'2026-04-30',is_current:false,semesterCount:4,status:'CLOSED'},
  {academic_year_id:3,year_label:'2026-27',start_date:'2026-07-01',end_date:'2027-04-30',is_current:true,semesterCount:3,status:'ACTIVE'},
];
const semesters = [
  {semester_id:7,semester_no:3,name:'Semester 3',start_date:'2026-07-01',end_date:'2026-11-30',is_current:false,result_published:false,yearLabel:'2026-27'},
  {semester_id:8,semester_no:4,name:'Semester 4',start_date:'2026-07-01',end_date:'2026-11-30',is_current:false,result_published:false,yearLabel:'2026-27'},
  {semester_id:9,semester_no:5,name:'Semester 5',start_date:'2026-07-01',end_date:'2026-11-30',is_current:true,result_published:false,yearLabel:'2026-27'},
];
const subjects = [
  ['CE101','Data Structures & Algorithms',4,'THEORY',1,3,1,0,false],
  ['CE102','Database Management Systems',4,'THEORY',1,3,1,0,false],
  ['CE103','Operating Systems',4,'THEORY',1,3,1,0,false],
  ['CE104','Computer Networks',4,'THEORY',1,3,1,0,false],
  ['ETC109','Signals & Systems',4,'THEORY',2,3,1,0,false],
  ['ETC110','Digital Communication',4,'THEORY',2,3,1,0,false],
  ['ETC111','Microprocessors & Microcontrollers',4,'THEORY',2,3,1,0,false],
  ['ETC112','VLSI Design',3,'THEORY',2,3,1,0,true],
].map(([subject_code,name,credits,subject_type,department_id,lecture_hours,tutorial_hours,practical_hours,is_elective],i)=>({subject_id:i+1,subject_code,name,short_name:name,credits,subject_type,department_id,department_code:departments[department_id-1].department_code,lecture_hours,tutorial_hours,practical_hours,is_elective,status:'ACTIVE',offering_count:6+i}));
const offerings = [
  [341,'CE101','Data Structures & Algorithms','BTECH-CE',1,'Demo Faculty 01',54],
  [342,'CE102','Database Management Systems','BTECH-CE',2,'Demo Faculty 02',56],
  [343,'CE103','Operating Systems','BTECH-CE',3,'Demo Faculty 03',55],
  [344,'ETC109','Signals & Systems','BTECH-ETC',4,'Demo Faculty 04',58],
  [345,'ETC110','Digital Communication','BTECH-ETC',5,'Demo Faculty 05',57],
].map(([offering_id,subjectCode,subjectName,programCode,faculty_id,facultyName,enrolled])=>({offering_id,subjectCode,subjectName,credits:4,programCode,semesterNo:5,yearLabel:'2026-27',sectionCode:'A',facultyName,faculty_id,capacity:60,enrolled,offering_type:'REGULAR',status:'OPEN'}));
const faculty = Array.from({length:7},(_,i)=>({faculty_id:i+1,first_name:'Demo',last_name:`Faculty ${String(i+1).padStart(2,'0')}`}));
const slots = [
  [1,342,1,2,'MONDAY','09:00:00','10:00:00','R101','CE102','Database Management Systems','Demo Faculty 02'],
  [2,343,1,3,'MONDAY','10:15:00','11:15:00','R101','CE103','Operating Systems','Demo Faculty 03'],
  [3,341,1,1,'TUESDAY','09:00:00','10:00:00','R101','CE101','Data Structures & Algorithms','Demo Faculty 01'],
  [4,344,2,4,'WEDNESDAY','11:15:00','12:15:00','R104','ETC109','Signals & Systems','Demo Faculty 04'],
  [5,345,2,5,'THURSDAY','14:00:00','15:00:00','R105','ETC110','Digital Communication','Demo Faculty 05'],
  [6,342,1,2,'FRIDAY','12:15:00','13:15:00','R101','CE102','Database Management Systems','Demo Faculty 02'],
].map(([timetable_id,offering_id,section_id,faculty_id,day_of_week,start_time,end_time,room_number,subjectCode,subjectName,facultyName])=>({timetable_id,offering_id,section_id,faculty_id,day_of_week,start_time,end_time,room_number,slot_label:`${start_time.slice(0,5)}-${end_time.slice(0,5)}`,subjectCode,subjectName,facultyName}));
const dashboard = {
  counts:{activeStudents:141,activeFaculty:24,departments:6,programs:8,hostelResidents:120,pendingHostelApps:7,exams:12,pendingAdmissions:3,pendingLeaves:4},
  departments:[
    {department_code:'CE',student_count:31,average_attendance:86.3},
    {department_code:'ETC',student_count:28,average_attendance:84.1},
    {department_code:'IT',student_count:27,average_attendance:87.8},
    {department_code:'AIDS',student_count:24,average_attendance:88.4},
    {department_code:'ECE',student_count:17,average_attendance:82.6},
    {department_code:'BSH',student_count:14,average_attendance:80.2},
  ],
  attendance:{safe:105,warning:26,critical:10,average:84.7},fees:{outstanding:2850000,collected:18700000},
  risk:{critical:5,high:18,medium:38,low:80},
  recentActivity:[
    {description:'Demo course offering created',action:'CREATE',entity:'course_offerings',createdAt:'2026-10-16T10:12:00'},
    {description:'Academic calendar event updated',action:'UPDATE',entity:'academic_calendar',createdAt:'2026-10-16T09:40:00'},
    {description:'Demo enrollment batch processed',action:'CREATE',entity:'enrollments',createdAt:'2026-10-15T15:10:00'},
    {description:'Timetable slot reviewed',action:'UPDATE',entity:'timetable',createdAt:'2026-10-15T13:25:00'},
  ],
};
const calendarEvents = [
  {event_id:1,academic_year_id:3,semester_id:9,title:'Diwali Vacation',description:'Institute holiday',event_type:'HOLIDAY',event_date:'2026-10-19',end_date:'2026-10-28',is_holiday:true,yearLabel:'2026-27',semesterNo:5},
  {event_id:2,academic_year_id:3,semester_id:9,title:'Annual Technical Festival - Praxis',description:'Institute fest',event_type:'FEST',event_date:'2026-10-08',end_date:'2026-10-10',is_holiday:false,yearLabel:'2026-27',semesterNo:5},
  {event_id:3,academic_year_id:3,semester_id:9,title:'National Seminar on VLSI Design',description:'Department of E&TC',event_type:'SEMINAR',event_date:'2026-10-15',end_date:null,is_holiday:false,yearLabel:'2026-27',semesterNo:5},
  {event_id:4,academic_year_id:3,semester_id:9,title:'End Semester Examination',description:'ESE for all UG/PG programs',event_type:'EXAM',event_date:'2026-11-10',end_date:'2026-11-24',is_holiday:false,yearLabel:'2026-27',semesterNo:5},
  {event_id:5,academic_year_id:3,semester_id:9,title:'Result Declaration - Semester 5',description:'Result publishing',event_type:'RESULT',event_date:'2026-12-10',end_date:null,is_holiday:false,yearLabel:'2026-27',semesterNo:5},
];
function payload(path){
  if(path.endsWith('/auth/me')) return {data:{user_id:1,role_code:'ADMIN',email:'admin@pict.edu',is_first_login:0}};
  if(path.endsWith('/dashboard')) return {data:dashboard};
  if(path.endsWith('/academics/semesters/current')) return {data:{semester_no:5,yearLabel:'2026-27'}};
  if(path.endsWith('/notifications')) return {data:[{notification_id:1,title:'Demo environment',message:'Illustrative sample response used for this report screenshot.',type:'INFO',severity:'INFO',link:null,is_read:true,created_at:'2026-10-17T09:00:00'}]};
  if(path.endsWith('/academics/departments')) return {data:departments};
  if(path.endsWith('/academics/programs/all')) return {data:programs};
  if(path.endsWith('/academics/batches')) return {data:batches};
  if(path.endsWith('/academics/sections')) return {data:sections};
  if(path.endsWith('/academics/years')) return {data:years};
  if(path.endsWith('/academics/calendar')) return {data:calendarEvents};
  if(path.endsWith('/academics/semesters')) return {data:semesters};
  if(path.endsWith('/academics/subjects')) return {data:subjects};
  if(path.endsWith('/academics/offerings')) return {data:offerings,meta:{page:1,limit:25,total:345,totalPages:14}};
  if(path.endsWith('/faculty')) return {data:faculty};
  if(path.endsWith('/academics/timetable/conflicts')) return {data:[]};
  if(path.includes('/academics/timetable/')) return {data:slots};
  return {data:[]};
}
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1600,height:1050},deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.addInitScript(t=>{localStorage.setItem('erp_token',t);localStorage.setItem('erp_theme','light');localStorage.setItem('erp_sidebar','expanded');},token);
  const page=await context.newPage();
  page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
  await page.route('**/api/v1/**',async route=>{
    const url=new URL(route.request().url());
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,...payload(url.pathname)})});
  });
  for(const [path,name] of [
    ['/dashboard','01_Admin_Dashboard_UI.png'],
    ['/academics/masters','02_Academic_Masters_UI.png'],
    ['/academics/subjects','03_Subjects_UI.png'],
    ['/academics/offerings','04_Course_Offerings_UI.png'],
    ['/academics/timetable','05_Timetable_UI.png'],
    ['/academics/calendar','06_Academic_Calendar_UI.png'],
  ]){
    await page.goto(`http://127.0.0.1:5173${path}`,{waitUntil:'networkidle',timeout:60000});
    await page.waitForTimeout(900);
    await page.screenshot({path:`${out}/${name}`,fullPage:true});
    console.log(name,'h1=',await page.locator('h1').allTextContents(),'height=',await page.locator('body').evaluate(e=>e.scrollHeight));
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
