import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { execute, query, queryOne, getDbConnection } from './connection.js';
import { initializeSchema } from './schema.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await initializeSchema();

  // Clear existing data cleanly in reverse order of foreign keys
  console.log('[Seed] Clearing old application data...');
  try {
    await execute('DELETE FROM student_answers;');
    await execute('DELETE FROM exam_attempts;');
    await execute('DELETE FROM exam_questions;');
    await execute('DELETE FROM question_options;');
    await execute('DELETE FROM questions;');
    await execute('DELETE FROM exams;');
    await execute('DELETE FROM subjects;');
    await execute('DELETE FROM app_users;');
  } catch (err) {
    console.warn('[Seed] Warning clearing tables (might be empty):', err);
  }

  // 1. Seed Users
  console.log('[Seed] Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const teacherPass = await bcrypt.hash('teacher123', salt);
  const studentPass = await bcrypt.hash('student123', salt);

  const adminId = uuidv4();
  const teacher1Id = uuidv4();
  const teacher2Id = uuidv4();
  const student1Id = uuidv4();
  const student2Id = uuidv4();
  const student3Id = uuidv4();
  const student4Id = uuidv4();
  const student5Id = uuidv4();

  const users = [
    { id: adminId, email: 'admin@exam.com', name: 'System Administrator', role: 'admin', pass: adminPass },
    { id: teacher1Id, email: 'teacher@exam.com', name: 'KARTHIKA NATARAJAN', role: 'teacher', pass: teacherPass },
    { id: teacher2Id, email: 'teacher2@exam.com', name: 'Dr. Grace Hopper', role: 'teacher', pass: teacherPass },
    { id: student1Id, email: 'student@exam.com', name: 'M.Jeswanth Sai Eswar', role: 'student', pass: studentPass },
    { id: student2Id, email: 'student2@exam.com', name: 'Sarah Connor', role: 'student', pass: studentPass },
    { id: student3Id, email: 'student3@exam.com', name: 'David Kim', role: 'student', pass: studentPass },
    { id: student4Id, email: 'student4@exam.com', name: 'Emma Watson', role: 'student', pass: studentPass },
    { id: student5Id, email: 'student5@exam.com', name: 'Liam Smith', role: 'student', pass: studentPass },
  ];

  for (const u of users) {
    await execute(
      `INSERT INTO app_users (id, email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, 'active');`,
      [u.id, u.email, u.pass, u.name, u.role]
    );
  }

  // 2. Seed Subjects
  console.log('[Seed] Creating academic subjects...');
  const cs101Id = uuidv4();
  const cs201Id = uuidv4();
  const cs301Id = uuidv4();
  const math101Id = uuidv4();
  const nosqlId = uuidv4();

  const subjects = [
    { id: cs101Id, code: 'CS101', name: 'Computer Science Fundamentals', description: 'Core principles of computing, architecture, and programming fundamentals.' },
    { id: cs201Id, code: 'CS201', name: 'Data Structures & Algorithms', description: 'Lists, trees, graphs, sorting algorithms, and complexity analysis.' },
    { id: cs301Id, code: 'CS301', name: 'Database Management Systems', description: 'Relational algebra, SQL, columnar storage, indexing, and ACID transactions.' },
    { id: math101Id, code: 'MATH101', name: 'Discrete Mathematics', description: 'Boolean logic, set theory, graph theory, and combinatorics.' },
    { id: nosqlId, code: 'NOSQL', name: 'NoSQL Database Systems', description: 'Document stores, key-value caches, wide-column stores, graph databases, and CAP theorem.' },
  ];

  for (const s of subjects) {
    await execute(
      `INSERT INTO subjects (id, code, name, description) VALUES (?, ?, ?, ?);`,
      [s.id, s.code, s.name, s.description]
    );
  }

  // 3. Seed Question Bank (20 rich questions across subjects)
  console.log('[Seed] Creating question bank with multiple-choice options...');
  
  const questionDefinitions = [
    // CS101 Questions
    {
      subjectId: cs101Id,
      teacherId: teacher1Id,
      text: 'Which computer component is directly responsible for executing machine code instructions?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'The Central Processing Unit (CPU) is the primary component that fetches, decodes, and executes instructions.',
      options: [
        { text: 'Hard Disk Drive (HDD)', isCorrect: false },
        { text: 'Central Processing Unit (CPU)', isCorrect: true },
        { text: 'Random Access Memory (RAM)', isCorrect: false },
        { text: 'Power Supply Unit (PSU)', isCorrect: false },
      ]
    },
    {
      subjectId: cs101Id,
      teacherId: teacher1Id,
      text: 'How many distinct values can be represented by a single byte (8 bits)?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: '2^8 equals 256 distinct numeric values (typically 0 to 255 unsigned).',
      options: [
        { text: '128', isCorrect: false },
        { text: '256', isCorrect: true },
        { text: '512', isCorrect: false },
        { text: '64', isCorrect: false },
      ]
    },
    {
      subjectId: cs101Id,
      teacherId: teacher1Id,
      text: 'Which protocol is primarily used for securely transferring encrypted web pages between browser and server?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'HTTPS (Hypertext Transfer Protocol Secure) encrypts communication using TLS/SSL.',
      options: [
        { text: 'FTP', isCorrect: false },
        { text: 'HTTP', isCorrect: false },
        { text: 'HTTPS', isCorrect: true },
        { text: 'SMTP', isCorrect: false },
      ]
    },
    {
      subjectId: cs101Id,
      teacherId: teacher1Id,
      text: 'What type of software translates high-level source code into machine code prior to execution?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'A compiler translates source code into machine code executable files ahead of runtime.',
      options: [
        { text: 'Compiler', isCorrect: true },
        { text: 'Interpreter', isCorrect: false },
        { text: 'Debugger', isCorrect: false },
        { text: 'Linker', isCorrect: false },
      ]
    },
    {
      subjectId: cs101Id,
      teacherId: teacher1Id,
      text: 'In the context of operating systems, what is a "race condition"?',
      difficulty: 'hard',
      marks: 3.0,
      explanation: 'A race condition occurs when multiple concurrent threads access shared state without proper synchronization, making output dependent on execution timing.',
      options: [
        { text: 'When a CPU runs out of clock cycles', isCorrect: false },
        { text: 'When concurrent threads produce inconsistent results depending on execution timing', isCorrect: true },
        { text: 'When two network interfaces compete for bandwidth', isCorrect: false },
        { text: 'A thermal throttling state in multi-core hardware', isCorrect: false },
      ]
    },

    // CS301 Database Questions (including MonetDB & Columnar concepts)
    {
      subjectId: cs301Id,
      teacherId: teacher1Id,
      text: 'How does a columnar database like MonetDB store relational data on disk and in memory compared to traditional row stores?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Columnar databases store each column values consecutively in memory/disk, maximizing analytical aggregation speed and compression.',
      options: [
        { text: 'Rows are stored consecutively with all column values in a single record', isCorrect: false },
        { text: 'Columns are stored as contiguous arrays, enabling vectorized operations and aggressive compression', isCorrect: true },
        { text: 'Data is stored exclusively in B-trees with no physical column separation', isCorrect: false },
        { text: 'Tables are converted into JSON documents with document-level indexing', isCorrect: false },
      ]
    },
    {
      subjectId: cs301Id,
      teacherId: teacher1Id,
      text: 'What does the "A" in ACID database properties stand for?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'Atomicity ensures all statements in a transaction either completely succeed or completely fail without partial states.',
      options: [
        { text: 'Asynchronous', isCorrect: false },
        { text: 'Atomicity', isCorrect: true },
        { text: 'Availability', isCorrect: false },
        { text: 'Authorization', isCorrect: false },
      ]
    },
    {
      subjectId: cs301Id,
      teacherId: teacher1Id,
      text: 'Which SQL clause is used to eliminate duplicate rows from a query result set?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'The DISTINCT keyword removes duplicate rows from query results.',
      options: [
        { text: 'UNIQUE', isCorrect: false },
        { text: 'DISTINCT', isCorrect: true },
        { text: 'GROUP', isCorrect: false },
        { text: 'FILTER', isCorrect: false },
      ]
    },
    {
      subjectId: cs301Id,
      teacherId: teacher1Id,
      text: 'What is the primary network protocol MonetDB servers use for client communication?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'MonetDB uses MAPI (MonetDB Application Programming Interface), a socket-based protocol operating on port 50000 by default.',
      options: [
        { text: 'MAPI (MonetDB API)', isCorrect: true },
        { text: 'TDS (Tabular Data Stream)', isCorrect: false },
        { text: 'MySQL Wire Protocol', isCorrect: false },
        { text: 'PG Wire Protocol', isCorrect: false },
      ]
    },
    {
      subjectId: cs301Id,
      teacherId: teacher1Id,
      text: 'Which normal form requires removing transitive functional dependencies where non-prime attributes depend on other non-prime attributes?',
      difficulty: 'hard',
      marks: 3.0,
      explanation: 'Third Normal Form (3NF) requires a table to be in 2NF and have no transitive functional dependencies.',
      options: [
        { text: 'First Normal Form (1NF)', isCorrect: false },
        { text: 'Second Normal Form (2NF)', isCorrect: false },
        { text: 'Third Normal Form (3NF)', isCorrect: true },
        { text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false },
      ]
    },

    // NoSQL Questions
    {
      subjectId: nosqlId,
      teacherId: teacher1Id,
      text: 'Which CAP theorem property guarantees that every non-failing node returns a response for read and write requests?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Availability in the CAP theorem ensures every request receives a (non-error) response, without guaranteeing that it contains the most recent write.',
      options: [
        { text: 'Consistency', isCorrect: false },
        { text: 'Availability', isCorrect: true },
        { text: 'Partition tolerance', isCorrect: false },
        { text: 'Atomicity', isCorrect: false },
      ]
    },
    {
      subjectId: nosqlId,
      teacherId: teacher1Id,
      text: 'Which type of NoSQL database is Neo4j classified as?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'Neo4j is a graph database designed to store and navigate nodes, relationships, and properties.',
      options: [
        { text: 'Document store', isCorrect: false },
        { text: 'Graph database', isCorrect: true },
        { text: 'Key-value cache', isCorrect: false },
        { text: 'Wide-column store', isCorrect: false },
      ]
    },
    {
      subjectId: nosqlId,
      teacherId: teacher1Id,
      text: 'In document databases like MongoDB, what binary serialization format is used internally for storage and network transfer?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'BSON (Binary JSON) is a binary-encoded serialization of JSON-like documents supporting additional data types like dates and raw binary data.',
      options: [
        { text: 'XML', isCorrect: false },
        { text: 'YAML', isCorrect: false },
        { text: 'BSON', isCorrect: true },
        { text: 'Protocol Buffers', isCorrect: false },
      ]
    },
    {
      subjectId: nosqlId,
      teacherId: teacher1Id,
      text: 'Which distributed NoSQL data model organizes data into keyspaces, column families, rows, and flexible columns (e.g., Apache Cassandra, HBase)?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Wide-column (or Column-family) databases store tabular data using dynamic column families indexed by row keys.',
      options: [
        { text: 'Wide-column / Column-family store', isCorrect: true },
        { text: 'Relational 3NF store', isCorrect: false },
        { text: 'Pure Key-value store', isCorrect: false },
        { text: 'Hierarchical XML store', isCorrect: false },
      ]
    },
    {
      subjectId: nosqlId,
      teacherId: teacher1Id,
      text: 'What does "Eventual Consistency" mean in distributed NoSQL systems like Amazon DynamoDB?',
      difficulty: 'hard',
      marks: 3.0,
      explanation: 'Eventual consistency guarantees that, if no new updates are made to the object, all replicas will eventually return the last updated value.',
      options: [
        { text: 'Data becomes invalid after a fixed timeout', isCorrect: false },
        { text: 'All replicas will eventually converge to the same value in the absence of new updates', isCorrect: true },
        { text: 'Updates are rejected during network partitions', isCorrect: false },
        { text: 'Data is written only once per 24 hours', isCorrect: false },
      ]
    },

    // CS201 Data Structures & Algorithms Questions
    {
      subjectId: cs201Id,
      teacherId: teacher2Id,
      text: 'What is the average-case time complexity of QuickSort?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Average case of QuickSort is O(n log n). Worst-case with poor pivot selection can degrade to O(n^2).',
      options: [
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n log n)', isCorrect: true },
        { text: 'O(n^2)', isCorrect: false },
        { text: 'O(log n)', isCorrect: false },
      ]
    },
    {
      subjectId: cs201Id,
      teacherId: teacher2Id,
      text: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'A Queue processes elements in First-In, First-Out order.',
      options: [
        { text: 'Stack', isCorrect: false },
        { text: 'Queue', isCorrect: true },
        { text: 'Heap', isCorrect: false },
        { text: 'Tree', isCorrect: false },
      ]
    },
    {
      subjectId: cs201Id,
      teacherId: teacher2Id,
      text: 'In a balanced Binary Search Tree (AVL or Red-Black), what is the time complexity to search for a key?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Self-balancing binary search trees maintain a maximum height of O(log n), ensuring O(log n) lookup.',
      options: [
        { text: 'O(1)', isCorrect: false },
        { text: 'O(log n)', isCorrect: true },
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n log n)', isCorrect: false },
      ]
    },
    {
      subjectId: cs201Id,
      teacherId: teacher2Id,
      text: 'Dijkstra\'s algorithm solves which classic algorithmic problem?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'Dijkstra\'s algorithm finds the shortest paths from a single source node to all other nodes in a weighted graph with non-negative edge weights.',
      options: [
        { text: 'Maximum Network Flow', isCorrect: false },
        { text: 'Single-source Shortest Path with non-negative weights', isCorrect: true },
        { text: 'Minimum Spanning Tree with negative edge cycles', isCorrect: false },
        { text: 'String Pattern Matching', isCorrect: false },
      ]
    },
    {
      subjectId: cs201Id,
      teacherId: teacher2Id,
      text: 'What technique is used in dynamic programming to store previously computed subproblem results for rapid reuse?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'Memoization (top-down) or tabulation (bottom-up) stores intermediate subproblem solutions.',
      options: [
        { text: 'Memoization', isCorrect: true },
        { text: 'Virtualization', isCorrect: false },
        { text: 'Branch and Bound', isCorrect: false },
        { text: 'Greedy Heuristic', isCorrect: false },
      ]
    },

    // MATH101 Questions
    {
      subjectId: math101Id,
      teacherId: teacher2Id,
      text: 'If A and B are two mutually exclusive events with P(A) = 0.4 and P(B) = 0.3, what is P(A or B)?',
      difficulty: 'easy',
      marks: 1.0,
      explanation: 'For mutually exclusive events, P(A or B) = P(A) + P(B) = 0.4 + 0.3 = 0.7.',
      options: [
        { text: '0.12', isCorrect: false },
        { text: '0.70', isCorrect: true },
        { text: '0.58', isCorrect: false },
        { text: '1.00', isCorrect: false },
      ]
    },
    {
      subjectId: math101Id,
      teacherId: teacher2Id,
      text: 'What is the logical negation of the statement: "Every student passed the exam"?',
      difficulty: 'medium',
      marks: 2.0,
      explanation: 'The negation of "For all x, P(x)" is "There exists x such that not P(x)" -> "At least one student failed the exam".',
      options: [
        { text: 'No student passed the exam', isCorrect: false },
        { text: 'At least one student failed the exam', isCorrect: true },
        { text: 'Every student failed the exam', isCorrect: false },
        { text: 'All students took a different exam', isCorrect: false },
      ]
    }
  ];

  const createdQuestions: Array<{ id: string; subjectId: string; marks: number; options: Array<{ id: string; isCorrect: boolean }> }> = [];

  for (const q of questionDefinitions) {
    const qId = uuidv4();
    await execute(
      `INSERT INTO questions (id, subject_id, teacher_id, question_text, marks, difficulty, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [qId, q.subjectId, q.teacherId, q.text, q.marks, q.difficulty, q.explanation]
    );

    const savedOptions: Array<{ id: string; isCorrect: boolean }> = [];
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      const optId = uuidv4();
      await execute(
        `INSERT INTO question_options (id, question_id, option_text, is_correct, sort_order)
         VALUES (?, ?, ?, ?, ?);`,
        [optId, qId, opt.text, opt.isCorrect, i]
      );
      savedOptions.push({ id: optId, isCorrect: opt.isCorrect });
    }

    createdQuestions.push({
      id: qId,
      subjectId: q.subjectId,
      marks: q.marks,
      options: savedOptions,
    });
  }

  // 4. Seed Exams
  console.log('[Seed] Creating examinations...');
  const exam1Id = uuidv4(); // CS101 Fundamentals Exam
  const exam2Id = uuidv4(); // CS301 Columnar DBMS Quiz
  const exam3Id = uuidv4(); // CS201 Algorithms Challenge

  // Exam 1: CS101 (5 questions)
  const cs101Questions = createdQuestions.filter(q => q.subjectId === cs101Id);
  const exam1TotalMarks = cs101Questions.reduce((acc, q) => acc + q.marks, 0);

  await execute(
    `INSERT INTO exams (id, title, description, subject_id, teacher_id, duration_minutes, total_marks, passing_marks, shuffle_questions, show_immediate_results, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, TRUE);`,
    [exam1Id, 'CS101: Midterm Fundamentals Exam', 'Evaluates understanding of computer architecture, operating systems, and basic networking principles.', cs101Id, teacher1Id, 15, exam1TotalMarks, exam1TotalMarks * 0.5]
  );

  for (let i = 0; i < cs101Questions.length; i++) {
    await execute(
      `INSERT INTO exam_questions (id, exam_id, question_id, question_order, marks)
       VALUES (?, ?, ?, ?, ?);`,
      [uuidv4(), exam1Id, cs101Questions[i].id, i + 1, cs101Questions[i].marks]
    );
  }

  // Exam 2: CS301 (5 questions)
  const cs301Questions = createdQuestions.filter(q => q.subjectId === cs301Id);
  const exam2TotalMarks = cs301Questions.reduce((acc, q) => acc + q.marks, 0);

  await execute(
    `INSERT INTO exams (id, title, description, subject_id, teacher_id, duration_minutes, total_marks, passing_marks, shuffle_questions, show_immediate_results, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, TRUE);`,
    [exam2Id, 'CS301: MonetDB & Modern Database Architecture', 'Advanced quiz on relational algebra, columnar database concepts, MAPI protocol, and ACID transactions.', cs301Id, teacher1Id, 20, exam2TotalMarks, exam2TotalMarks * 0.5]
  );

  for (let i = 0; i < cs301Questions.length; i++) {
    await execute(
      `INSERT INTO exam_questions (id, exam_id, question_id, question_order, marks)
       VALUES (?, ?, ?, ?, ?);`,
      [uuidv4(), exam2Id, cs301Questions[i].id, i + 1, cs301Questions[i].marks]
    );
  }

  // Exam 3: CS201 (5 questions)
  const cs201Questions = createdQuestions.filter(q => q.subjectId === cs201Id);
  const exam3TotalMarks = cs201Questions.reduce((acc, q) => acc + q.marks, 0);

  await execute(
    `INSERT INTO exams (id, title, description, subject_id, teacher_id, duration_minutes, total_marks, passing_marks, shuffle_questions, show_immediate_results, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, TRUE);`,
    [exam3Id, 'CS201: Data Structures & Complexity Exam', 'Covers sorting algorithms, trees, graphs, dynamic programming, and big-O analysis.', cs201Id, teacher2Id, 25, exam3TotalMarks, exam3TotalMarks * 0.5]
  );

  for (let i = 0; i < cs201Questions.length; i++) {
    await execute(
      `INSERT INTO exam_questions (id, exam_id, question_id, question_order, marks)
       VALUES (?, ?, ?, ?, ?);`,
      [uuidv4(), exam3Id, cs201Questions[i].id, i + 1, cs201Questions[i].marks]
    );
  }

  // 5. Seed Historical Exam Attempts for instant, rich analytics
  console.log('[Seed] Generating simulated student attempts and analytics records...');

  // Helper to generate simulated student answers for an exam
  const simulatedStudents = [
    { id: student2Id, accuracyTarget: 0.90 }, // Sarah: High achiever
    { id: student3Id, accuracyTarget: 0.75 }, // David: Above average
    { id: student4Id, accuracyTarget: 0.60 }, // Emma: Average
    { id: student5Id, accuracyTarget: 0.40 }, // Liam: Needs improvement
  ];

  for (const sim of simulatedStudents) {
    // Attempt Exam 1
    const attemptId1 = uuidv4();
    let earnedMarks1 = 0;

    await execute(
      `INSERT INTO exam_attempts (id, exam_id, student_id, start_time, end_time, submitted_at, status)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'submitted');`,
      [attemptId1, exam1Id, sim.id]
    );

    for (const q of cs101Questions) {
      const willBeCorrect = Math.random() < sim.accuracyTarget;
      const correctOpt = q.options.find(o => o.isCorrect)!;
      const wrongOpts = q.options.filter(o => !o.isCorrect);
      const chosenOpt = willBeCorrect ? correctOpt : wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
      const markGiven = willBeCorrect ? q.marks : 0;
      earnedMarks1 += markGiven;

      await execute(
        `INSERT INTO student_answers (id, attempt_id, question_id, selected_option_id, is_correct, marks_awarded)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [uuidv4(), attemptId1, q.id, chosenOpt.id, willBeCorrect, markGiven]
      );
    }

    const pct1 = Math.round((earnedMarks1 / exam1TotalMarks) * 100);
    const passed1 = earnedMarks1 >= (exam1TotalMarks * 0.5);

    await execute(
      `UPDATE exam_attempts
       SET total_score = ?, percentage = ?, passed = ?
       WHERE id = ?;`,
      [earnedMarks1, pct1, passed1, attemptId1]
    );

    // Attempt Exam 2
    const attemptId2 = uuidv4();
    let earnedMarks2 = 0;

    await execute(
      `INSERT INTO exam_attempts (id, exam_id, student_id, start_time, end_time, submitted_at, status)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'submitted');`,
      [attemptId2, exam2Id, sim.id]
    );

    for (const q of cs301Questions) {
      const willBeCorrect = Math.random() < sim.accuracyTarget;
      const correctOpt = q.options.find(o => o.isCorrect)!;
      const wrongOpts = q.options.filter(o => !o.isCorrect);
      const chosenOpt = willBeCorrect ? correctOpt : wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
      const markGiven = willBeCorrect ? q.marks : 0;
      earnedMarks2 += markGiven;

      await execute(
        `INSERT INTO student_answers (id, attempt_id, question_id, selected_option_id, is_correct, marks_awarded)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [uuidv4(), attemptId2, q.id, chosenOpt.id, willBeCorrect, markGiven]
      );
    }

    const pct2 = Math.round((earnedMarks2 / exam2TotalMarks) * 100);
    const passed2 = earnedMarks2 >= (exam2TotalMarks * 0.5);

    await execute(
      `UPDATE exam_attempts
       SET total_score = ?, percentage = ?, passed = ?
       WHERE id = ?;`,
      [earnedMarks2, pct2, passed2, attemptId2]
    );
  }

  try {
    const conn = await getDbConnection();
    await conn.commit();
  } catch (e) {}

  console.log('[Seed] Database seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS CREATED:');
  console.log('Admin:   admin@exam.com    / admin123');
  console.log('Teacher: teacher@exam.com  / teacher123 (KARTHIKA NATARAJAN)');
  console.log('Student: student@exam.com  / student123 (M.Jeswanth Sai Eswar)');
  console.log('----------------------------------------------------');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
