/**
 * UI i18n — lightweight bilingual dictionary (English + Hindi).
 *
 * No external dependencies. Usage:
 *   import { t, type Lang } from '@/lib/i18n/dictionary'
 *   t(lang, 'nav.courses')
 *
 * Server components get `lang` from the locale (URL/header). Client components
 * receive it as a prop.
 */

export type Lang = 'en' | 'hi'

export const SUPPORTED_LANGS: Lang[] = ['en', 'hi']

/** Resolve a string to a valid Lang, defaulting to 'en'. */
export function resolveLang(s: string | null | undefined): Lang {
  return s === 'hi' ? 'hi' : 'en'
}

const en = {
  // Nav
  'nav.skills': 'Skills',
  'nav.courses': 'Courses',
  'nav.pdfStore': 'PDF Store',
  'nav.centres': 'Centres',
  'nav.books': 'Books',
  'nav.search': 'Search',
  // Auth
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Sign up',
  'auth.signOut': 'Sign out',
  'auth.dashboard': 'Dashboard',
  'auth.console': 'Console',
  // Hero
  'hero.badge': 'LEARN IN YOUR LANGUAGE',
  'hero.subtitle': 'Structured Tutorials, Examples, Practice, Quizzes & Resources — for Excel, Tally, Digital Marketing, AI tools and more.',
  'hero.browseCourses': 'Browse courses',
  'hero.createAccount': 'Create free account',
  'hero.flow': 'Discover → Learn → Practice → Test → Apply → Track Progress',
  // Home sections
  'home.exploreByCategory': 'Explore by Category',
  'home.exploreByCategorySub': 'Find courses organised by skill area',
  'home.viewAll': 'View all',
  'home.featuredCourses': 'Featured Courses',
  'home.featuredCoursesSub': 'Start learning with our curated skill courses',
  'home.findCentres': 'Find Skill & Training Centres Near You',
  'home.findCentresSub': 'Browse verified skills and training institutes. Compare courses, fees, reviews, and admission details.',
  'home.browseCentres': 'Browse Centres',
  'home.registerCentre': 'Register Your Centre',
  'home.whyMioDemy': 'Why MioDemy?',
  'home.whyMioDemySub': 'A learning experience designed for real outcomes',
  'home.structuredLearning': 'Structured learning',
  'home.structuredLearningDesc': 'Every course follows a clear path: concepts → examples → practice → assessment.',
  'home.bilingual': 'Bilingual',
  'home.bilingualDesc': 'Learn in English or Hindi. Switch languages anytime without losing your place.',
  'home.practiceTest': 'Practice & test',
  'home.practiceTestDesc': 'Quizzes, mock tests and projects reinforce what you learn and track progress.',
  // Course page
  'course.startLearning': 'Start learning',
  'course.signUpFree': 'Sign up free',
  'course.courseInfo': 'Course Info',
  'course.difficulty': 'Difficulty',
  'course.duration': 'Duration',
  'course.lessons': 'Lessons',
  'course.lesson': 'lesson',
  'course.language': 'Language',
  'course.whatYoullLearn': "What you'll learn",
  'course.prerequisites': 'Prerequisites',
  'course.whoThisIsFor': 'Who this is for',
  'course.courseContent': 'Course Content',
  'course.curriculumComingSoon': 'Curriculum coming soon.',
  'course.freePdfDownload': 'Free PDF & Notes Download',
  'course.freePdfDesc': 'Get free PDF tutorials, notes, and cheat sheets for',
  'course.downloadFreePdfs': 'Download Free PDFs',
  'course.relatedCourses': 'Related Courses',
  'course.aboutCourse': 'About this course',
  'course.faqTitle': 'Frequently Asked Questions',
  // Lesson page
  'lesson.minRead': 'min read',
  'lesson.practiceQuestions': 'Practice Questions',
  'lesson.practiceSub': 'Test your understanding — pick an answer and check.',
  'lesson.reviewQuestions': 'Review Questions',
  'lesson.reviewSub': 'Think about the answer, then reveal the model answer.',
  'lesson.checkAnswer': 'Check answer',
  'lesson.correct': 'Correct!',
  'lesson.notQuiteRight': 'Not quite right',
  'lesson.explanation': 'Explanation',
  'lesson.revealModelAnswer': 'Reveal model answer',
  'lesson.modelAnswer': 'Model answer',
  'lesson.hide': 'Hide',
  'lesson.tryAgain': 'Try again',
  'lesson.singleChoice': 'Single choice',
  'lesson.multipleChoice': 'Multiple choice',
  'lesson.trueFalse': 'True / False',
  'lesson.descriptive': 'Descriptive',
  // Breadcrumbs
  'breadcrumb.home': 'Home',
  'breadcrumb.courses': 'Courses',
  // Footer
  'footer.learn': 'Learn',
  'footer.allSkills': 'All Skills',
  'footer.company': 'Company',
  'footer.legal': 'Legal',
  'footer.rights': 'All rights reserved.',
  'footer.flow': 'Discover → Learn → Practice → Test → Track',
  'footer.tagline': 'Learn practical skills in your language.',
  // Misc
  'common.loading': 'Loading…',
  'common.contentUnavailable': 'Content is temporarily unavailable',
  'common.backToHome': 'Back to home',
}

const hi: Record<keyof typeof en, string> = {
  // Nav
  'nav.skills': 'स्किल्स',
  'nav.courses': 'कोर्स',
  'nav.pdfStore': 'PDF स्टोर',
  'nav.centres': 'सेंटर',
  'nav.books': 'किताबें',
  'nav.search': 'खोज',
  // Auth
  'auth.signIn': 'साइन इन',
  'auth.signUp': 'साइन अप',
  'auth.signOut': 'साइन आउट',
  'auth.dashboard': 'डैशबोर्ड',
  'auth.console': 'कंसोल',
  // Hero
  'hero.badge': 'अपनी भाषा में सीखें',
  'hero.subtitle': 'संरचित ट्यूटोरियल, उदाहरण, अभ्यास, क्विज़ और संसाधन — एक्सेल, टैली, डिजिटल मार्केटिंग, AI टूल्स और बहुत कुछ।',
  'hero.browseCourses': 'कोर्स देखें',
  'hero.createAccount': 'मुफ्त अकाउंट बनाएं',
  'hero.flow': 'खोजें → सीखें → अभ्यास → परीक्षण → लागू → प्रगति',
  // Home sections
  'home.exploreByCategory': 'श्रेणी देखें',
  'home.exploreByCategorySub': 'अपनी रुचि के क्षेत्र के अनुसार कोर्स खोजें',
  'home.viewAll': 'सभी देखें',
  'home.featuredCourses': 'फीचर्ड कोर्स',
  'home.featuredCoursesSub': 'हमारे चुने हुए स्किल कोर्स से सीखना शुरू करें',
  'home.findCentres': 'अपने पास स्किल और ट्रेनिंग सेंटर खोजें',
  'home.findCentresSub': 'सत्यापित स्किल और ट्रेनिंग संस्थान देखें। कोर्स, फीस, समीक्षा और प्रवेश विवरण की तुलना करें।',
  'home.browseCentres': 'सेंटर देखें',
  'home.registerCentre': 'अपना सेंटर रजिस्टर करें',
  'home.whyMioDemy': 'MioDemy क्यों?',
  'home.whyMioDemySub': 'वास्तविक परिणामों के लिए डिज़ाइन किया गया सीखने का अनुभव',
  'home.structuredLearning': 'संरचित सीख',
  'home.structuredLearningDesc': 'हर कोर्स एक स्पष्ट पथ पर चलता है: अवधारणाएँ → उदाहरण → अभ्यास → मूल्यांकन।',
  'home.bilingual': 'द्विभाषी',
  'home.bilingualDesc': 'अंग्रेज़ी या हिंदी में सीखें। कभी भी भाषा बदलें, आपकी जगह बरकरार रहेगी।',
  'home.practiceTest': 'अभ्यास और परीक्षण',
  'home.practiceTestDesc': 'क्विज़, मॉक टेस्ट और प्रोजेक्ट आपकी सीख को मजबूत करते हैं और प्रगति ट्रैक करते हैं।',
  // Course page
  'course.startLearning': 'सीखना शुरू करें',
  'course.signUpFree': 'मुफ्त साइन अप',
  'course.courseInfo': 'कोर्स जानकारी',
  'course.difficulty': 'कठिनाई',
  'course.duration': 'अवधि',
  'course.lessons': 'पाठ',
  'course.lesson': 'पाठ',
  'course.language': 'भाषा',
  'course.whatYoullLearn': 'आप क्या सीखेंगे',
  'course.prerequisites': 'पूर्व-आवश्यकताएँ',
  'course.whoThisIsFor': 'यह किसके लिए है',
  'course.courseContent': 'कोर्स सामग्री',
  'course.curriculumComingSoon': 'पाठ्यक्रम जल्द आ रहा है।',
  'course.freePdfDownload': 'मुफ्त PDF और नोट्स डाउनलोड',
  'course.freePdfDesc': 'इसके लिए मुफ्त PDF ट्यूटोरियल, नोट्स और चीट शीट पाएं',
  'course.downloadFreePdfs': 'मुफ्त PDF डाउनलोड करें',
  'course.relatedCourses': 'संबंधित कोर्स',
  'course.aboutCourse': 'इस कोर्स के बारे में',
  'course.faqTitle': 'अक्सर पूछे जाने वाले प्रश्न',
  // Lesson page
  'lesson.minRead': 'मिनट पढ़ें',
  'lesson.practiceQuestions': 'अभ्यास प्रश्न',
  'lesson.practiceSub': 'अपनी समझ जांचें — उत्तर चुनें और जांचें।',
  'lesson.reviewQuestions': 'समीक्षा प्रश्न',
  'lesson.reviewSub': 'उत्तर के बारे में सोचें, फिर मॉडल उत्तर देखें।',
  'lesson.checkAnswer': 'उत्तर जांचें',
  'lesson.correct': 'सही!',
  'lesson.notQuiteRight': 'बिल्कुल सही नहीं',
  'lesson.explanation': 'व्याख्या',
  'lesson.revealModelAnswer': 'मॉडल उत्तर देखें',
  'lesson.modelAnswer': 'मॉडल उत्तर',
  'lesson.hide': 'छिपाएं',
  'lesson.tryAgain': 'फिर से कोशिश करें',
  'lesson.singleChoice': 'एक विकल्प',
  'lesson.multipleChoice': 'बहु विकल्प',
  'lesson.trueFalse': 'सही / गलत',
  'lesson.descriptive': 'वर्णनात्मक',
  // Breadcrumbs
  'breadcrumb.home': 'होम',
  'breadcrumb.courses': 'कोर्स',
  // Footer
  'footer.learn': 'सीखें',
  'footer.allSkills': 'सभी स्किल्स',
  'footer.company': 'कंपनी',
  'footer.legal': 'कानूनी',
  'footer.rights': 'सर्वाधिकार सुरक्षित।',
  'footer.flow': 'खोजें → सीखें → अभ्यास → परीक्षण → ट्रैक',
  'footer.tagline': 'अपनी भाषा में व्यावहारिक स्किल्स सीखें।',
  // Misc
  'common.loading': 'लोड हो रहा है…',
  'common.contentUnavailable': 'सामग्री अस्थायी रूप से अनुपलब्ध है',
  'common.backToHome': 'होम पर वापस',
}

export const dictionaries: Record<Lang, typeof en> = { en, hi }

/** Translate a key in the given language. Falls back to English, then the key. */
export function t(lang: Lang, key: keyof typeof en): string {
  return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? (key as string)
}
