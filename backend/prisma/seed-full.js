const { PrismaClient, CefrLevel, QuestionType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const LANGUAGES = [
  { code: 'fr', name: 'Français', nameAr: 'الفرنسية' },
  { code: 'en', name: 'Anglais', nameAr: 'الإنجليزية' },
  { code: 'de', name: 'Allemand', nameAr: 'الألمانية' },
  { code: 'es', name: 'Espagnol', nameAr: 'الإسبانية' },
  { code: 'it', name: 'Italien', nameAr: 'الإيطالية' },
  { code: 'pt', name: 'Portugais', nameAr: 'البرتغالية' },
  { code: 'nl', name: 'Néerlandais', nameAr: 'الهولندية' },
  { code: 'ar', name: 'Arabe classique', nameAr: 'العربية الفصحى' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const FR_QUESTIONS = {
  A1: {
    reading: [
      { q: 'Lisez: "Marie habite à Paris. Elle travaille dans un bureau." — Où habite Marie?', options: ['Lyon', 'Paris', 'Marseille', 'Bordeaux'], a: 'Paris' },
      { q: 'Quel jour est-ce?', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi'], a: 'Lundi' },
      { q: 'Complétez: "Le chat est ___ la table."', options: ['sur', 'sous', 'dans', 'avec'], a: 'sur' },
      { q: 'Choisissez le bon article: "___ livre"', options: ['le', 'la', 'un', 'une'], a: 'le' },
      { q: 'Quel est le pluriel de "cheval"?', options: ['chevals', 'chevaux', 'cheval', 'chevaux'], a: 'chevaux' },
      { q: 'Trouvez le mot contraire de "grand"', options: ['petit', 'gros', 'majeur', 'vieux'], a: 'petit' },
      { q: 'Complétez: "Je ___ français."', options: ['suis', 'es', 'est', 'sommes'], a: 'suis' },
      { q: 'Quelle phrase est correcte?', options: ["J'ai un chat", "J'ai un", 'chat un', 'J Hai un chat'], a: "J'ai un chat" },
      { q: 'Que signifie "bonjour"?', options: ['Au revoir', 'Merci', 'Bonjour', 'Bonsoir'], a: 'Bonjour' },
      { q: 'Comment s\'appelle-t-elle? Elle ___ Marie.', options: ['s\'appelle', 'appel', 'appeler', 'appelé'], a: 's\'appelle' },
    ],
    listening: [
      { q: 'Écoutez: "Le train part à 10h." — À quelle heure?', options: ['9h', '10h', '11h', '12h'], a: '10h' },
      { q: 'Vous entendrez: "Où est la gare?" — Que demande-t-il?', options: ['La station', 'La gare', 'L\'aéroport', 'Le métro'], a: 'La gare' },
      { q: 'Écoutez la phrase et répondez: "Il fait beau."', options: ['Il pleut', 'Il fait soleil', 'Il fait beau', 'Il fait froid'], a: 'Il fait beau' },
      { q: 'Qu\'entendez-vous: "Je mange une pomme."', options: ['poire', 'pomme', 'banane', 'orange'], a: 'pomme' },
      { q: 'Écoutez: "C\'est星期一." — Quel jour?', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi'], a: 'Lundi' },
      { q: 'La phrase: "Elle va au travail."', options: ['Elle reste', 'Elle va', 'Elle vient', 'Elle sort'], a: 'Elle va' },
      { q: 'Écoutez: "J\'ai vingt ans."', options: ['10', '15', '20', '25'], a: '20' },
      { q: '"Merci beaucoup" signifie:', options: ['Merci', 'Merci beaucoup', 'De rien', 'Pardon'], a: 'Merci beaucoup' },
      { q: 'Que dit-on pour saluer le matin?', options: ['Bonsoir', 'Bonne nuit', 'Bonjour', 'Au revoir'], a: 'Bonjour' },
      { q: 'Écoutez: "Je suis étudiant."', options: ['étudiante', 'étudiant', 'étudier', 'études'], a: 'étudiant' },
    ],
    grammar: [
      { q: 'Complétez: "Je ___ un chat."', options: ['ai', 'as', 'a', 'avons'], a: 'ai' },
      { q: 'Article défini: "___ table"', options: ['un', 'une', 'le', 'la'], a: 'la' },
      { q: 'Pluriel de "journal":', options: ['journaux', 'journals', 'journalx', 'journal'], a: 'journaux' },
      { q: 'Contraire de "grand":', options: ['petit', 'gros', 'mince', 'large'], a: 'petit' },
      { q: '"Tu" est:', options: ['formel', 'informel', 'pluriel', 'féminin'], a: 'informel' },
      { q: 'Complétez: "Il ___ français."', options: ['suis', 'es', 'est', 'sommes'], a: 'est' },
      { q: 'Question avec "est-ce que": "Tu aimes?"', options: ['Est-ce que tu aimes?', 'Tu est-ce que aimes?', 'Aimes-tu?', 'Est que tu aimes?'], a: 'Est-ce que tu aimes?' },
      { q: 'Mots interrogatifs: "___ allez-vous?"', options: ['Comment', 'Où', 'Quand', 'Que'], a: 'Comment' },
      { q: '"aller" au présent:', options: ['allé', 'vais', 'allais', 'allé'], a: 'vais' },
      { q: '，正确回答: "Comment vous appelez-vous?"', options: ['Je m\'appelle', 'Mon nom', 'Je suis', 'Appelez-moi'], a: 'Je m\'appelle' },
    ],
    vocabulary: [
      { q: 'Maison en anglais:', options: ['House', 'Home', 'Room', 'Door'], a: 'House' },
      { q: 'Voiture =', options: ['Car', 'Bus', 'Train', 'Bike'], a: 'Car' },
      { q: '"Travail" =', options: ['Work', 'Travel', 'Trip', 'Job'], a: 'Work' },
      { q: 'Famille =', options: ['Family', 'Friends', 'Team', 'Group'], a: 'Family' },
      { q: 'Jour de la semaine:', options: ['Janvier', 'Lundi', 'Printemps', 'Matin'], a: 'Lundi' },
      { q: 'Couleur:', options: ['Rouge', 'Rapide', 'Grand', 'Petit'], a: 'Rouge' },
      { q: 'Nombre:', options: ['Cinq', 'Froid', 'Chaud', 'Grand'], a: 'Cinq' },
      { q: 'Merci en anglais:', options: ['Hello', 'Please', 'Thank you', 'Goodbye'], a: 'Thank you' },
      { q: 'Au revoir:', options: ['Hello', 'Goodbye', 'Please', 'Sorry'], a: 'Goodbye' },
      { q: 'Ecole =', options: ['School', 'House', 'Office', 'Store'], a: 'School' },
    ]
  }
};

function generateTestTitle(lang, level) {
  const titles = {
    fr: { A1: 'Test de français — Niveau A1', A2: 'Test de français — Niveau A2', B1: 'Test de français — Niveau B1', B2: 'Test de français — Niveau B2', C1: 'Test de français — Niveau C1', C2: 'Test de français — Niveau C2' },
    en: { A1: 'English Test — Level A1', A2: 'English Test — Level A2', B1: 'English Test — Level B1', B2: 'English Test — Level B2', C1: 'English Test — Level C1', C2: 'English Test — Level C2' },
    de: { A1: 'Deutschtest — Niveau A1', A2: 'Deutschtest — Niveau A2', B1: 'Deutschtest — Niveau B1', B2: 'Deutschtest — Niveau B2', C1: 'Deutschtest — Niveau C1', C2: 'Deutschtest — Niveau C2' },
    es: { A1: 'Español — Nivel A1', A2: 'Español — Nivel A2', B1: 'Español — Nivel B1', B2: 'Español — Nivel B2', C1: 'Español — Nivel C1', C2: 'Español — Nivel C2' },
    it: { A1: 'Italiano — Livello A1', A2: 'Italiano — Livello A2', B1: 'Italiano — Livello B1', B2: 'Italiano — Livello B2', C1: 'Italiano — Livello C1', C2: 'Italiano — Livello C2' },
    pt: { A1: 'Português — Nível A1', A2: 'Português — Nível A2', B1: 'Português — Nível B1', B2: 'Português — Nível B2', C1: 'Português — Nível C1', C2: 'Português — Nível C2' },
    nl: { A1: 'Nederlands — Niveau A1', A2: 'Nederlands — Niveau A2', B1: 'Nederlands — Niveau B1', B2: 'Nederlands — Niveau B2', C1: 'Nederlands — Niveau C1', C2: 'Nederlands — Niveau C2' },
    ar: { A1: 'اختبار العربية — المستوى A1', A2: 'اختبار العربية — المستوى A2', B1: 'اختبار العربية — المستوى B1', B2: 'اختبار العربية — المستوى B2', C1: 'اختبار العربية — المستوى C1', C2: 'اختبار العربية — المستوى C2' },
  };
  return titles[lang]?.[level] || `Test ${lang.toUpperCase()} ${level}`;
}

const DURATIONS = { A1: 30, A2: 30, B1: 45, B2: 45, C1: 60, C2: 60 };

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.answer.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  console.log('✓ Cleared existing data');

  // Create languages
  const langMap = {};
  for (const l of LANGUAGES) {
    const lang = await prisma.language.upsert({
      where: { code: l.code },
      update: {},
      create: { code: l.code, name: l.name, nameAr: l.nameAr }
    });
    langMap[l.code] = lang;
  }
  console.log(`✓ Created ${Object.keys(langMap).length} languages`);

  // Create users
  const hash = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.upsert({ where: { email: 'admin@platform.com' }, update: {}, create: { email: 'admin@platform.com', passwordHash: hash, firstName: 'Admin', lastName: 'User', role: 'ADMIN' } });
  await prisma.user.upsert({ where: { email: 'student@platform.com' }, update: {}, create: { email: 'student@platform.com', passwordHash: hash, firstName: 'Student', lastName: 'Test', role: 'CANDIDATE' } });
  console.log('✓ Created users');

  // Create tests for each language and level
  let totalQuestions = 0;
  for (const langCode of Object.keys(langMap)) {
    for (const level of LEVELS) {
      const testId = `test-${langCode}-${level.toLowerCase()}`;
      const duration = DURATIONS[level];
      
      const test = await prisma.test.upsert({
        where: { id: testId },
        update: {},
        create: {
          id: testId,
          languageId: langMap[langCode].id,
          title: generateTestTitle(langCode, level),
          description: `Test de ${langCode.toUpperCase()} niveau ${level}`,
          cefrTarget: level,
          durationMinutes: duration,
          passingScore: 60
        }
      });

      // Generate questions based on level
      let questions = [];
      const qBase = FR_QUESTIONS.A1; // Using French A1 as template for structure

      // Reading (10 questions)
      for (let i = 0; i < 10; i++) {
        const template = qBase.reading[i % qBase.reading.length];
        questions.push({
          testId: test.id,
          type: 'READING_COMPREHENSION',
          skill: 'READING',
          content: template.q,
          options: { options: template.options },
          correctAnswer: template.a,
          points: 5,
          orderIndex: questions.length
        });
      }

      // Listening (10 questions)
      for (let i = 0; i < 10; i++) {
        const template = qBase.listening[i % qBase.listening.length];
        questions.push({
          testId: test.id,
          type: 'LISTENING_COMPREHENSION',
          skill: 'LISTENING',
          content: template.q,
          options: { options: template.options },
          correctAnswer: template.a,
          points: 5,
          orderIndex: questions.length
        });
      }

      // Grammar (10 questions)
      for (let i = 0; i < 10; i++) {
        const template = qBase.grammar[i % qBase.grammar.length];
        questions.push({
          testId: test.id,
          type: 'MULTIPLE_CHOICE',
          skill: 'GRAMMAR',
          content: template.q,
          options: { options: template.options },
          correctAnswer: template.a,
          points: 5,
          orderIndex: questions.length
        });
      }

      // Vocabulary (10 questions)
      for (let i = 0; i < 10; i++) {
        const template = qBase.vocabulary[i % qBase.vocabulary.length];
        questions.push({
          testId: test.id,
          type: 'MULTIPLE_CHOICE',
          skill: 'VOCABULARY',
          content: template.q,
          options: { options: template.options },
          correctAnswer: template.a,
          points: 5,
          orderIndex: questions.length
        });
      }

      // Writing (1 question)
      questions.push({
        testId: test.id,
        type: 'WRITING',
        skill: 'WRITING',
        content: `Écrivez un paragraphe de 8-10 phrases sur vous-même (niveau ${level}).`,
        points: 20,
        orderIndex: questions.length
      });

      // Speaking (1 question)
      questions.push({
        testId: test.id,
        type: 'SPEAKING',
        skill: 'SPEAKING',
        content: `Présentez-vous en 1-2 minutes. Parlez de votre famille, votre travail et vos hobbies.`,
        points: 25,
        orderIndex: questions.length
      });

      // Create questions
      for (let i = 0; i < questions.length; i++) {
        await prisma.question.create({
          data: { ...questions[i], id: `${testId}-q${i}` }
        });
      }
      totalQuestions += questions.length;
    }
  }

  console.log(`✓ Created ${Object.keys(langMap).length} languages × ${LEVELS.length} levels = ${Object.keys(langMap).length * LEVELS.length} tests with ${totalQuestions} questions`);

  // Create sample course
  const frCourse = await prisma.course.create({
    data: {
      languageId: langMap.fr.id,
      title: 'Bases du français A1',
      description: 'Maîtrisez les fondamentaux du français',
      cefrLevel: 'A1',
      orderIndex: 0
    }
  });

  await prisma.lesson.create({
    data: {
      courseId: frCourse.id,
      title: 'Introduction',
      type: 'READING',
      content: { text: 'Bienvenue dans ce cours!' },
      durationMinutes: 10,
      orderIndex: 0
    }
  });

  console.log('✓ Created sample course');
  console.log('\n🎉 Database seeded successfully!');
  console.log('Admin: admin@platform.com / Admin1234!');
  console.log('Student: student@platform.com / Admin1234!');
}

seed()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
