import { PrismaClient, Role, CefrLevel, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ANAPEC Platform database...');

  // ── Languages ──────────────────────────────────────────────────────────────
  const languages = await Promise.all([
    prisma.language.upsert({ where:{code:'fr'}, update:{}, create:{code:'fr',name:'Français',nameAr:'الفرنسية'} }),
    prisma.language.upsert({ where:{code:'de'}, update:{}, create:{code:'de',name:'Allemand',nameAr:'الألمانية'} }),
    prisma.language.upsert({ where:{code:'en'}, update:{}, create:{code:'en',name:'Anglais',nameAr:'الإنجليزية'} }),
    prisma.language.upsert({ where:{code:'es'}, update:{}, create:{code:'es',name:'Espagnol',nameAr:'الإسبانية'} }),
    prisma.language.upsert({ where:{code:'it'}, update:{}, create:{code:'it',name:'Italien',nameAr:'الإيطالية'} }),
    prisma.language.upsert({ where:{code:'pt'}, update:{}, create:{code:'pt',name:'Portugais',nameAr:'البرتغالية'} }),
    prisma.language.upsert({ where:{code:'nl'}, update:{}, create:{code:'nl',name:'Néerlandais',nameAr:'الهولندية'} }),
    prisma.language.upsert({ where:{code:'ar'}, update:{}, create:{code:'ar',name:'Arabe classique',nameAr:'العربية الفصحى'} }),
  ]);
  console.log('✅ Languages seeded:', languages.map(l => l.code).join(', '));

  // ── Users ─────────────────────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 10);
  const [superAdmin, admin, candidate1, candidate2, coach] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'superadmin@anapec.ma' },
      update: {},
      create: { email:'superadmin@anapec.ma', passwordHash: await hash('Admin2024!'), firstName:'Super', lastName:'Admin', role:Role.SUPER_ADMIN, isActive:true },
    }),
    prisma.user.upsert({
      where: { email: 'admin@demo.ma' },
      update: {},
      create: { email:'admin@demo.ma', passwordHash: await hash('Demo1234!'), firstName:'Fatima', lastName:'Zahra', role:Role.ADMIN, region:'Casablanca-Settat', city:'Casablanca', isActive:true },
    }),
    prisma.user.upsert({
      where: { email: 'candidat@demo.ma' },
      update: {},
      create: { email:'candidat@demo.ma', passwordHash: await hash('Demo1234!'), firstName:'Ahmed', lastName:'Benali', role:Role.CANDIDATE, cin:'BJ123456', phone:'0612345678', region:'Casablanca-Settat', city:'Casablanca', agency:'Agence Maarif', isActive:true },
    }),
    prisma.user.upsert({
      where: { email: 'candidat2@demo.ma' },
      update: {},
      create: { email:'candidat2@demo.ma', passwordHash: await hash('Demo1234!'), firstName:'Karim', lastName:'El Fassi', role:Role.CANDIDATE, cin:'CD789012', phone:'0623456789', region:'Rabat-Salé-Kénitra', city:'Rabat', agency:'Agence Agdal', isActive:true },
    }),
    prisma.user.upsert({
      where: { email: 'coach@demo.ma' },
      update: {},
      create: { email:'coach@demo.ma', passwordHash: await hash('Demo1234!'), firstName:'Marie', lastName:'Dupont', role:Role.COACH, isActive:true },
    }),
  ]);
  console.log('✅ Demo users seeded');

  // ── French A1 Test ────────────────────────────────────────────────────────
  const frLang = languages.find(l => l.code === 'fr')!;
  const frA1 = await prisma.test.upsert({
    where: { id: 'seed-test-fr-a1' },
    update: {},
    create: {
      id: 'seed-test-fr-a1',
      languageId: frLang.id,
      title: 'Test de français — Niveau A1',
      description: 'Évaluez vos bases en langue française. Ce test couvre le vocabulaire quotidien, la grammaire élémentaire et la compréhension simple.',
      cefrTarget: CefrLevel.A1,
      durationMinutes: 30,
      passingScore: 60,
      instructions: 'Lisez chaque question attentivement. Pour les questions à choix multiples, sélectionnez la meilleure réponse. Vous avez 30 minutes.',
    },
  });

  // Questions for FR A1
  const frA1Questions = [
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Quelle est la traduction de "Bonjour" en anglais ?', contentAr: 'ما هي ترجمة "Bonjour" إلى الإنجليزية؟', options: { options: ['Hello','Goodbye','Please','Thank you'] }, correctAnswer: 'Hello', points: 5 },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Comment dit-on "Je m\'appelle…" pour se présenter ?', options: { options: ['Je suis…','Mon nom est…','Je m\'appelle…','Je me nomme…'] }, correctAnswer: 'Je m\'appelle…', points: 5 },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Quelle phrase est correcte ?', options: { options: ["J'ai vingt ans","Je avoir vingt ans","Moi être vingt ans","Je vingt ans ai"] }, correctAnswer: "J'ai vingt ans", points: 5 },
    { type: QuestionType.TRUE_FALSE, content: 'Le pluriel de "un chat" est "des chats".', options: { options: ['Vrai','Faux'] }, correctAnswer: 'Vrai', points: 5 },
    { type: QuestionType.TRUE_FALSE, content: 'En français, "tu" est plus formel que "vous".', options: { options: ['Vrai','Faux'] }, correctAnswer: 'Faux', points: 5 },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Complétez : "Je ___ étudiant."', options: { options: ['suis','es','est','sommes'] }, correctAnswer: 'suis', points: 5 },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Quel est le contraire de "grand" ?', options: { options: ['Petit','Vieux','Jeune','Fort'] }, correctAnswer: 'Petit', points: 5 },
    { type: QuestionType.FILL_IN_BLANK, content: 'Complétez la phrase : "Bonjour, comment allez-___?"', correctAnswer: 'vous', points: 5 },
    { type: QuestionType.READING_COMPREHENSION, content: 'Lisez : "Marie habite à Paris. Elle travaille dans un bureau. Elle parle français et anglais." — Dans quelle ville habite Marie ?', options: { options: ['Lyon','Marseille','Paris','Bordeaux'] }, correctAnswer: 'Paris', points: 10 },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Lequel est un jour de la semaine ?', options: { options: ['Janvier','Mardi','Printemps','Matin'] }, correctAnswer: 'Mardi', points: 5 },
  ];

  for (let i = 0; i < frA1Questions.length; i++) {
    const q = frA1Questions[i];
    await prisma.question.upsert({
      where: { id: `seed-q-fra1-${i}` },
      update: {},
      create: { id:`seed-q-fra1-${i}`, testId:frA1.id, ...q, orderIndex:i },
    });
  }
  console.log(`✅ French A1 test seeded with ${frA1Questions.length} questions`);

  // ── German A2 Test ────────────────────────────────────────────────────────
  const deLang = languages.find(l => l.code === 'de')!;
  const deA2 = await prisma.test.upsert({
    where: { id: 'seed-test-de-a2' },
    update: {},
    create: {
      id: 'seed-test-de-a2',
      languageId: deLang.id,
      title: 'Deutschtest — Niveau A2',
      description: 'Evaluieren Sie Ihre deutschen Sprachkenntnisse auf A2-Niveau.',
      cefrTarget: CefrLevel.A2,
      durationMinutes: 35,
      passingScore: 60,
      instructions: 'Lesen Sie jede Frage sorgfältig. Wählen Sie die beste Antwort.',
    },
  });

  const deA2Questions = [
    { type:QuestionType.MULTIPLE_CHOICE, content:'Was ist die Hauptstadt von Deutschland?', options:{options:['Berlin','München','Hamburg','Frankfurt']}, correctAnswer:'Berlin', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Wie sagt man "Ich bin müde" auf Englisch?', options:{options:['I am hungry','I am tired','I am happy','I am cold']}, correctAnswer:'I am tired', points:5 },
    { type:QuestionType.TRUE_FALSE, content:'Das Wort "der" ist ein weiblicher Artikel.', options:{options:['Richtig','Falsch']}, correctAnswer:'Falsch', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Welches Verb passt? "Ich ___ gern Musik."', options:{options:['höre','esse','gehe','komme']}, correctAnswer:'höre', points:5 },
    { type:QuestionType.FILL_IN_BLANK, content:'Ergänzen Sie: "Wie ___ Sie?" (Begrüßung)', correctAnswer:'geht', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Was ist der Plural von "das Kind"?', options:{options:['die Kinder','die Kinds','die Kindere','die Kinde']}, correctAnswer:'die Kinder', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Welche Zahl ist das? "zwanzig"', options:{options:['12','20','21','22']}, correctAnswer:'20', points:5 },
    { type:QuestionType.READING_COMPREHENSION, content:'Lesen Sie: "Thomas wohnt in Berlin. Er arbeitet als Ingenieur und fährt jeden Tag mit dem Fahrrad zur Arbeit." — Womit fährt Thomas zur Arbeit?', options:{options:['Mit dem Auto','Mit dem Bus','Mit dem Fahrrad','Zu Fuß']}, correctAnswer:'Mit dem Fahrrad', points:10 },
  ];

  for (let i = 0; i < deA2Questions.length; i++) {
    const q = deA2Questions[i];
    await prisma.question.upsert({
      where: { id:`seed-q-dea2-${i}` },
      update: {},
      create: { id:`seed-q-dea2-${i}`, testId:deA2.id, ...q, orderIndex:i },
    });
  }
  console.log(`✅ German A2 test seeded with ${deA2Questions.length} questions`);

  // ── English B1 Test ────────────────────────────────────────────────────────
  const enLang = languages.find(l => l.code === 'en')!;
  const enB1 = await prisma.test.upsert({
    where: { id: 'seed-test-en-b1' },
    update: {},
    create: {
      id: 'seed-test-en-b1',
      languageId: enLang.id,
      title: 'English Test — Level B1',
      description: 'Assess your intermediate English skills covering grammar, vocabulary, reading, and writing.',
      cefrTarget: CefrLevel.B1,
      durationMinutes: 45,
      passingScore: 60,
    },
  });

  const enB1Questions = [
    { type:QuestionType.MULTIPLE_CHOICE, content:'Choose the correct form: "By this time tomorrow, I ___ the project."', options:{options:['will finish','will have finished','finished','am finishing']}, correctAnswer:'will have finished', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'What does "ambiguous" mean?', options:{options:['Clear and obvious','Having more than one meaning','Very important','Completely wrong']}, correctAnswer:'Having more than one meaning', points:5 },
    { type:QuestionType.TRUE_FALSE, content:'The sentence "She don\'t like coffee" is grammatically correct.', options:{options:['True','False']}, correctAnswer:'False', points:5 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Which word is a synonym for "happy"?', options:{options:['Sad','Angry','Joyful','Tired']}, correctAnswer:'Joyful', points:5 },
    { type:QuestionType.FILL_IN_BLANK, content:'Complete the sentence: "If I ___ more time, I would study harder." (past conditional)', correctAnswer:'had', points:5 },
    { type:QuestionType.READING_COMPREHENSION, content:'Read: "Climate change refers to long-term shifts in global temperatures and weather patterns. While some shifts are natural, since the 1800s, human activities have been the main driver." — According to the text, what has been the main cause of climate change since the 1800s?', options:{options:['Natural weather patterns','Volcanic eruptions','Human activities','Ocean currents']}, correctAnswer:'Human activities', points:10 },
    { type:QuestionType.MULTIPLE_CHOICE, content:'Choose the correct passive voice: "The letter ___ yesterday."', options:{options:['was written','is written','wrote','has written']}, correctAnswer:'was written', points:5 },
    { type:QuestionType.WRITING, content:'Write 3-4 sentences describing your ideal job and why you would like it.', points:20 },
  ];

  for (let i = 0; i < enB1Questions.length; i++) {
    const q = enB1Questions[i];
    await prisma.question.upsert({
      where: { id:`seed-q-enb1-${i}` },
      update: {},
      create: { id:`seed-q-enb1-${i}`, testId:enB1.id, ...q, orderIndex:i },
    });
  }
  console.log(`✅ English B1 test seeded with ${enB1Questions.length} questions`);

  // ── Remediation Courses ────────────────────────────────────────────────────
  const courses = [
    { languageCode:'fr', title:'Bases du français A1', desc:'Maîtrisez les fondamentaux : alphabet, salutations, chiffres, couleurs et vocabulaire quotidien.', level:CefrLevel.A1, order:0 },
    { languageCode:'fr', title:'Français A2 — Vie quotidienne', desc:'Approfondissez votre français avec des thèmes professionnels et des situations de la vie courante.', level:CefrLevel.A2, order:1 },
    { languageCode:'fr', title:'Français B1 — Communication professionnelle', desc:'Perfectionnez votre expression écrite et orale pour le monde du travail.', level:CefrLevel.B1, order:2 },
    { languageCode:'de', title:'Deutsch A1 — Grundkurs', desc:'Lernen Sie die deutschen Grundlagen: Begrüßungen, Zahlen, Farben und Alltagsvokabular.', level:CefrLevel.A1, order:0 },
    { languageCode:'de', title:'Deutsch A2 — Im Alltag', desc:'Erweitern Sie Ihr Deutsch mit alltäglichen Situationen und einfachen Gesprächen.', level:CefrLevel.A2, order:1 },
    { languageCode:'en', title:'English A1 — Starter Course', desc:'Learn English basics: greetings, numbers, colors, and essential everyday vocabulary.', level:CefrLevel.A1, order:0 },
    { languageCode:'en', title:'English B1 — Professional Communication', desc:'Develop your intermediate English for workplace communication, emails, and presentations.', level:CefrLevel.B1, order:1 },
    { languageCode:'es', title:'Español A1 — Primeros pasos', desc:'Aprenda los fundamentos del español: saludos, números y vocabulario básico.', level:CefrLevel.A1, order:0 },
  ];

  for (const c of courses) {
    const lang = languages.find(l => l.code === c.languageCode)!;
    const courseId = `seed-course-${c.languageCode}-${c.level.toLowerCase()}`;
    const course = await prisma.course.upsert({
      where: { id: courseId },
      update: {},
      create: { id:courseId, languageId:lang.id, title:c.title, description:c.desc, cefrLevel:c.level, orderIndex:c.order },
    });

    // Sample lessons for each course
    const lessons = [
      { title:'Introduction et présentation', type:'READING', dur:10, order:0, content:{ text:`Bienvenue dans ce cours de ${c.languageCode.toUpperCase()}. Dans ce module, vous allez découvrir les bases de la langue.`, vocabulary:[{word:'Bonjour',translation:'Hello'},{word:'Merci',translation:'Thank you'},{word:'S\'il vous plaît',translation:'Please'}] } },
      { title:'Vocabulaire essentiel', type:'VOCABULARY', dur:15, order:1, content:{ vocabulary:[{word:'Maison',translation:'House'},{word:'Voiture',translation:'Car'},{word:'Travail',translation:'Work'},{word:'Famille',translation:'Family'},{word:'École',translation:'School'},{word:'Restaurant',translation:'Restaurant'}] } },
      { title:'Grammaire de base', type:'GRAMMAR', dur:20, order:2, content:{ text:'Les verbes essentiels et leur conjugaison au présent.', exercises:[{question:'Complétez : "Je ___ étudiant"',options:['suis','est','sont'],answer:'suis'},{question:'Quel est le pluriel de "chat" ?',options:['chats','chates','chates'],answer:'chats'}] } },
      { title:'Exercices pratiques', type:'EXERCISE', dur:25, order:3, content:{ exercises:[{question:'Traduisez : "Good morning"',options:['Bonsoir','Bonjour','Bonne nuit','Au revoir'],answer:'Bonjour'},{question:'Comment dit-on "I am hungry" ?',options:["J'ai faim","J'ai soif","Je suis fatigué","Je veux"],answer:"J'ai faim"}] } },
    ];

    for (const l of lessons) {
      await prisma.lesson.upsert({
        where: { id:`seed-lesson-${courseId}-${l.order}` },
        update: {},
        create: { id:`seed-lesson-${courseId}-${l.order}`, courseId:course.id, title:l.title, type:l.type as any, content:l.content, durationMinutes:l.dur, orderIndex:l.order },
      });
    }
  }
  console.log(`✅ ${courses.length} courses with lessons seeded`);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo accounts:');
  console.log('  👤 Candidat  : candidat@demo.ma / Demo1234!');
  console.log('  👤 Candidat2 : candidat2@demo.ma / Demo1234!');
  console.log('  🔧 Admin     : admin@demo.ma / Demo1234!');
  console.log('  🔧 Coach     : coach@demo.ma / Demo1234!');
  console.log('  🔧 SuperAdmin: superadmin@anapec.ma / Admin2024!');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
