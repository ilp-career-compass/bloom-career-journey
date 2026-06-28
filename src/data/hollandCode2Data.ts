export type LangKey = 'en' | 'kn' | 'ta' | 'hi';
export type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface Holland2Question {
  sequenceNumber: number;
  category: CategoryKey;
  image: string;
  question: Record<LangKey, string>;
}

export const HOLLAND2_MODULE_TITLE: Record<LangKey, string> = {
  en: 'My Nature - My Style - Matching Professional Interest with Personality Traits (Holland Code)',
  kn: 'ನನ್ನ ಸ್ವಭಾವ - ನನ್ನ ಶೈಲಿ - ವ್ಯಕ್ತಿತ್ವದ ಗುಣಲಕ್ಷಣಗಳೊಂದಿಗೆ ವೃತ್ತಿಪರ ಆಸಕ್ತಿಯನ್ನು ಹೊಂದಿಸುವುದು (ಹಾಲೆಂಡ್ ಕೋಡ್)',
  ta: 'எனது இயல்பு - எனது நடை: ஆளுமைப் பண்புகளுடன் தொழில்முறை ஆர்வங்களைப் பொருத்துதல் (ஹாலண்ட் கோடு)',
  hi: 'मेरा स्वभाव - मेरी शैली: व्यक्तित्व लक्षणों के साथ व्यावसायिक रुचि का मिलान (हॉलैंड कोड)'
};

export const HOLLAND2_TITLE_TEXT: Record<LangKey, string> = {
  en: 'This activity helps us understand our personality type and choose a job or career field that matches it.',
  kn: 'ಚಟುವಟಿಕೆ ನಮಗೆ ನಮ್ಮ ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರವನ್ನು ತಿಳಿದುಕೊಂಡು ಅದಕ್ಕೆ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಉದ್ಯೋಗ/ವೃತ್ತಿಯ ಕ್ಷೇತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯವಾಗುತ್ತದೆ.',
  ta: 'இந்தச் செயல்பாடு நமது ஆளுமை வகையைப் புரிந்துகொண்டு, அதற்குப் பொருத்தமான வேலை அல்லது தொழில் துறையைத் தேர்ந்தெடுக்க உதவுகிறது.',
  hi: 'यह गतिविधि हमें अपने व्यक्तित्व के प्रकार को समझने और उसके अनुसार उपयुक्त नौकरी या करियर क्षेत्र चुनने में मदद करती है।'
};

export const HOLLAND2_SUBTITLE_TEXT: Record<LangKey, string> = {
  en: 'John L. Holland was a famous psychologist who developed this method to help individuals choose work that matches their nature. Holland divided people’s interests and working styles into 6 main groups, known as RIASEC.\n\n' +
    '1. Realistic – Practical or those who work with their hands - may like machines, tools, farming, vehicles, and technical work.\n' +
    '2. Investigative – Searchers or those interested in knowing - may like asking questions, research, science, math, and finding answers to problems.\n' +
    '3. Artistic – Artistic or creative - may like painting, music, drama, writing, design, and working on new ideas.\n' +
    '4. Social – Social or those who help people - may like teaching others, helping, guiding, and service work.\n' +
    '5. Enterprising – Entrepreneurial or those who take leadership - may like speaking, persuading people, leading, and doing business.\n' +
    '6. Conventional – Traditional or those who work systematically - may like record-keeping, calculation, office work, and managing information properly.',
  
  kn: 'ಜಾನ್ ಎಲ್. ಹಾಲೆಂಡ್ ಒಬ್ಬ ಪ್ರಸಿದ್ಧ ಮನಶ್ಶಾಸ್ತ್ರಜ್ಞರಾಗಿದ್ದು, ಒಬ್ಬ ವ್ಯಕ್ತಿಯ ಸ್ವಭಾವಕ್ಕೆ ಸರಿಹೊಂದುವ ಕೆಲಸವನ್ನು ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯವಾಗಲೆಂದು ಈ ವಿಧಾನವನ್ನು ರೂಪಿಸಿದರು. ಹಾಲೆಂಡ್ ಅವರು ಜನರ ಆಸಕ್ತಿಗಳು ಮತ್ತು ಕೆಲಸದ ರೀತಿಯನ್ನು 6 ಪ್ರಮುಖ ಗುಂಪುಗಳಾಗಿ ವಿಂಗಡಿಸಿದ್ದಾರೆ. ಇದನ್ನು RIASEC ಎಂದು ಕರೆಯುತ್ತಾರೆ.\n\n' +
    '1. Realistic – ವಾಸ್ತವಿಕ ಅಥವಾ ಕೈಯಿಂದ ಕೆಲಸ ಮಾಡುವವರು - ಯಂತ್ರಗಳು, ಉಪಕರಣಗಳು, ಕೃಷಿ, ವಾಹನಗಳು, ತಾಂತ್ರಿಕ ಕೆಲಸಗಳು ಇಷ್ಟವಾಗಬಹುದು.\n' +
    '2. Investigative – ಶೋಧಕ ಅಥವಾ ತಿಳಿದುಕೊಳ್ಳಲು ಆಸಕ್ತಿ ಇರುವವರು - ಪ್ರಶ್ನೆ ಕೇಳುವುದು, ಸಂಶೋಧನೆ, ವಿಜ್ಞಾನ, ಗಣಿತ, ಸಮಸ್ಯೆಗಳಿಗೆ ಉತ್ತರ ಹುಡುಕುವುದು ಇಷ್ಟವಾಗಬಹುದು.\n' +
    '3. Artistic – ಕಲಾತ್ಮಕ ಅಥವಾ ಸೃಜನಾತ್ಮಕರು - ಚಿತ್ರಕಲೆ, ಸಂಗೀತ, ನಾಟಕ, ಬರವಣಿಗೆ, ವಿನ್ಯಾಸ, ಹೊಸ ಕಲ್ಪನೆಗಳ ಕೆಲಸಗಳು ಇಷ್ಟವಾಗಬಹುದು.\n' +
    '4. Social – ಸಾಮಾಜಿಕ ಅಥವಾ ಜನರಿಗೆ ಸಹಾಯ ಮಾಡುವವರು - ಇತರರಿಗೆ ಕಲಿಸುವುದು, ಸಹಾಯ ಮಾಡುವುದು, ಮಾರ್ಗದರ್ಶನ ನೀಡುವುದು, ಸೇವಾ ಕೆಲಸಗಳು ಇಷ್ಟವಾಗಬಹುದು.\n' +
    '5. Enterprising – ಉದ್ಯಮಶೀಲ ಅಥವಾ ನಾಯಕತ್ವ ವಹಿಸುವವರು - ಮಾತನಾಡುವುದು, ಜನರನ್ನು ಮನವೊಲಿಸುವುದು, ನಾಯಕತ್ವ ವಹಿಸುವುದು, ವ್ಯವಹಾರ ಮಾಡುವುದು ಇಷ್ಟವಾಗಬಹುದು.\n' +
    '6. Conventional – ಸಾಂಪ್ರದಾಯಿಕ ಅಥವಾ ವ್ಯವಸ್ಥಿತವಾಗಿ ಕೆಲಸ ಮಾಡುವವರು - ದಾಖಲೆ ಇಡುವುದು, ಲೆಕ್ಕಾಚಾರ, ಕಚೇರಿ ಕೆಲಸ, ಮಾಹಿತಿಯನ್ನು ಸರಿಯಾಗಿ ನಿರ್ವಹಿಸುವುದು ಇಷ್ಟವಾಗಬಹುದು.',
  
  ta: 'ஜான் எல். ஹாலண்ட் ஒரு புகழ்பெற்ற உளவியலாளர் ஆவார்; ஒரு நபரின் இயல்புக்கு ஏற்ற வேலையைத் தேர்ந்தெடுக்க உதவும் வகையில் இந்த முறையை அவர் உருவாக்கினார். ஹாலண்ட் மக்களின் ஆர்வங்களையும் வேலை செய்யும் முறைகளையும் RIASEC எனப்படும் 6 முக்கிய குழுக்களாகப் பிரித்துள்ளார்.\n\n' +
    '1. Realistic (யதார்த்தமானவர்) – கைவேலை செய்பவர்கள் - இயந்திரங்கள், கருவிகள், விவசாயம், வாகனங்கள் மற்றும் தொழில்நுட்ப வேலைகளை விரும்பலாம்.\n' +
    '2. Investigative (ஆராய்வோர்) – தெரிந்துகொள்ள ஆர்வமுள்ளவர்கள் - கேள்விகள் கேட்பது, ஆராய்ச்சி, அறிவியல், கணிதம் மற்றும் பிரச்சினைகளுக்குத் தீர்வு காண்பதை விரும்பலாம்.\n' +
    '3. Artistic (கலைநயம் மிக்கவர்) – ஆக்கப்பூர்வமானவர்கள் - ஓவியம், இசை, நாடகம், எழுதுதல், வடிவமைப்பு மற்றும் புதிய சிந்தனைகளை விரும்பலாம்.\n' +
    '4. Social (சமூக நலன் விரும்பி) – மக்களுக்கு உதவுபவர்கள் - கற்பித்தல், உதவி செய்தல், வழிகாட்டுதல் மற்றும் சேவைப் பணிகளை விரும்பலாம்.\n' +
    '5. Enterprising (முயற்சியாளர்) – தலைமை ஏற்பவர்கள் - பேசுதல், மக்களைக் கவர்தல், தலைமை தாங்குதல் மற்றும் வியாபாரம் செய்வதை விரும்பலாம்.\n' +
    '6. Conventional (முறைப்படுத்துபவர்) – திட்டமிட்டுச் செயல்படுபவர்கள் - ஆவணங்களைப் பராமரித்தல், கணக்கீடு, அலுவலக வேலை மற்றும் தகவல்களைச் சரியாக நிர்வகிப்பதை விரும்பலாம்.',
  
  hi: 'जॉन एल. हॉलैंड एक प्रसिद्ध मनोवैज्ञानिक थे, जिन्होंने इस पद्धति को इसलिए बनाया ताकि व्यक्ति अपने स्वभाव के अनुकूल काम चुन सके। हॉलैंड ने लोगों की रुचियों और काम करने के तरीकों को 6 मुख्य समूहों में विभाजित किया है, जिसे RIASEC कहा जाता है।\n\n' +
    '1. Realistic (वास्तविक) – जो हाथों से काम करना पसंद करते हैं - इन्हें मशीनें, औजार, कृषि, वाहन और तकनीकी कार्य पसंद हो सकते हैं।\n' +
    '2. Investigative (खोजी) – जो जानने के इच्छुक होते हैं - इन्हें सवाल पूछना, शोध, विज्ञान, गणित और समस्याओं का समाधान खोजना पसंद हो सकते हैं।\n' +
    '3. Artistic (कलात्मक) – जो रचनात्मक होते हैं - इन्हें चित्रकला, संगीत, नाटक, लेखन, डिजाइन और नए विचारों पर काम करना पसंद हो सकते हैं।\n' +
    '4. Social (सामाजिक) – जो लोगों की मदद करते हैं - इन्हें दूसरों को सिखाना, मदद करना, मार्गदर्शन देना और सेवा कार्य पसंद हो सकते हैं।\n' +
    '5. Enterprising (उद्यमी) – जो नेतृत्व करते हैं - इन्हें बोलना, लोगों को राजी करना, नेतृत्व करना और व्यवसाय करना पसंद हो सकते हैं।\n' +
    '6. Conventional (पारंपरिक) – जो व्यवस्थित रूप से काम करते हैं - इन्हें रिकॉर्ड रखना, गणना, कार्यालय कार्य और जानकारी को सही ढंग से संभालना पसंद हो सकते हैं।'
};

export const CATEGORY_LABELS_2: Record<LangKey, Record<CategoryKey, string>> = {
  en: {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional',
  },
  kn: {
    R: 'ವಾಸ್ತವಿಕ (Realistic)',
    I: 'ವಿಚಾರಣಾತ್ಮಕ (Investigative)',
    A: 'ಕಲಾತ್ಮಕ (Artistic)',
    S: 'ಸಾಮಾಜಿಕ (Social)',
    E: 'ಉದ್ಯಮಶೀಲ (Enterprising)',
    C: 'ಸಾಂಪ್ರದಾಯಿಕ (Conventional)',
  },
  ta: {
    R: 'நடைமுறை வேலைகள் (Realistic)',
    I: 'ஆராயும் வேலைகள் (Investigative)',
    A: 'கலை சார்ந்த வேலைகள் (Artistic)',
    S: 'மக்களுக்கு உதவும் வேலைகள் (Social)',
    E: 'வியாபாரம் / தலைமை வேலைகள் (Enterprising)',
    C: 'அலுவலக வேலைகள் (Conventional)',
  },
  hi: {
    R: 'व्यावहारिक (Realistic)',
    I: 'विश्लेषणात्मक (Investigative)',
    A: 'कलात्मक (Artistic)',
    S: 'सामाजिक (Social)',
    E: 'उद्यमशील (Enterprising)',
    C: 'पारंपरिक (Conventional)',
  },
};

export const HOLLAND2_QUESTIONS: Holland2Question[] = [
  {
    sequenceNumber: 1,
    category: 'R',
    image: 'Q1R.jpg',
    question: {
      en: 'I like fixing bikes, cycles, vehicles or appliances',
      kn: 'ನನಗೆ ಬೈಕು, ಸೈಕಲ್, ಗಾಡಿಗಳು ಅಥವಾ ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳನ್ನು ರಿಪೇರಿ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு பைக், சைக்கிள், வாகனங்கள் அல்லது வீட்டு உபயோகப் பொருட்களைச் சரிசெய்ய பிடிக்கும்.',
      hi: 'मुझे बाइक, साइकिल, गाड़ियां या घर के उपकरण (appliances) ठीक करना पसंद है।'
    }
  },
  {
    sequenceNumber: 2,
    category: 'I',
    image: 'Q2I.jpeg',
    question: {
      en: 'I like to solve puzzles/riddles',
      kn: 'ನನಗೆ ಪಜ್ಜಲ್ಸ್ (Puzzles) ಅಥವಾ ಒಗಟುಗಳನ್ನು ಬಿಡಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு புதிர்கள் அல்லது விடுகதைகளைத் தீர்க்க பிடிக்கும்.',
      hi: 'मुझे पहेलियाँ के जवाब खोजना पसंद है।'
    }
  },
  {
    sequenceNumber: 3,
    category: 'A',
    image: 'Q3A.jpeg',
    question: {
      en: 'I like to take photographs',
      kn: 'ನನಗೆ ಫೋಟೋಗಳನ್ನು ತೆಗೆಯುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் புகைப்படங்கள் (Photos) எடுக்க பிடிக்கும்.',
      hi: 'मुझे तस्वीरें खींचना (फोटोग्राफी) पसंद है।'
    }
  },
  {
    sequenceNumber: 4,
    category: 'S',
    image: 'Q4S.jpeg',
    question: {
      en: 'I like to teach or train people',
      kn: 'ನನಗೆ ಜನರಿಗೆ ಕಲಿಸುವುದು ಅಥವಾ ತರಬೇತಿ ನೀಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மற்றவர்களுக்குக் கற்றுக்கொடுக்க அல்லது பயிற்சி அளிக்க பிடிக்கும்.',
      hi: 'मुझे लोगों को पढ़ाना या ट्रेनिंग देना पसंद है।'
    }
  },
  {
    sequenceNumber: 5,
    category: 'E',
    image: 'Q5E.png',
    question: {
      en: 'I like to manage a hotel',
      kn: 'ನನಗೆ ಹೋಟೆಲ್ ನಿರ್ವಹಣೆ ಮಾಡುವುದು ಇಷ್ಟ',
      ta: 'எனக்கு ஒரு ஹோட்டலை ನಿர்வகிக்க பிடிக்கும்.',
      hi: 'मुझे होटल संभालना (manage करना) पसंद है।'
    }
  },
  {
    sequenceNumber: 6,
    category: 'C',
    image: 'Q6C.jpeg',
    question: {
      en: 'I like to work with computers',
      kn: 'ನನಗೆ ಕಂಪ್ಯೂಟರ್ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குக் கணினியில் (Computer) வேலை செய்ய பிடிக்கும்.',
      hi: 'मुझे कंप्यूटर पर काम करना पसंद है।'
    }
  },
  {
    sequenceNumber: 7,
    category: 'R',
    image: 'Q7R.jpeg',
    question: {
      en: 'I like to cook',
      kn: 'ನನಗೆ ಅಡುಗೆ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குச் சமைக்க பிடிக்கும்.',
      hi: 'मुझे खाना बनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 8,
    category: 'I',
    image: 'Q8I.jpeg',
    question: {
      en: 'I like to learn about the weather',
      kn: 'ನನಗೆ ಹವಾಮಾನದ ಬಗ್ಗೆ ತಿಳಿದುಕೊಳ್ಳುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு வானிலை (Weather) பற்றி அறிந்துகொள்ள பிடிக்கும்.',
      hi: 'मुझे मौसम के बारे में जानना पसंद है।'
    }
  },
  {
    sequenceNumber: 9,
    category: 'A',
    image: 'Q9A.jpeg',
    question: {
      en: 'I like to sing or play instruments',
      kn: 'ನನಗೆ ಹಾಡುವುದು ಅಥವಾ ಸಂಗೀತ ವಾದ್ಯಗಳನ್ನು ನುಡಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் பாட அல்லது இசைக்கருவிகளை வாசிக்க பிடிக்கும்.',
      hi: 'मुझे गाना या वाद्ययंत्र (musical instruments) बजाना पसंद है।'
    }
  },
  {
    sequenceNumber: 10,
    category: 'S',
    image: 'Q10S.jpeg',
    question: {
      en: 'I like to share information about history',
      kn: 'ನನಗೆ ಇತಿಹಾಸದ ಬಗ್ಗೆ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு வரலாறு பற்றிய தகவல்களைப் பகிர்ந்து கொள்ள பிடிக்கும்.',
      hi: 'मुझे इतिहास के बारे में जानकारी बांटना पसंद है।'
    }
  },
  {
    sequenceNumber: 11,
    category: 'E',
    image: 'Q11E.jpg',
    question: {
      en: 'I like to own a business (e.g, textile shop)',
      kn: 'ನನಗೆ ಸ್ವಂತ ಉದ್ಯಮ ಅಥವಾ ವ್ಯಾಪಾರ ಮಾಡುವುದು ಇಷ್ಟ (ಉದಾಹರಣೆಗೆ: ಬಟ್ಟೆ ಅಂಗಡಿ).',
      ta: 'எனக்குச் சொந்தமாகத் தொழில் செய்ய பிடிக்கும் (உதாரணமாக: ஜவுளிக்கடை).',
      hi: 'मुझे अपना खुद का बिज़नेस शुरू करना पसंद है (जैसे: कपड़े की दुकान)।'
    }
  },
  {
    sequenceNumber: 12,
    category: 'C',
    image: 'Q12C.png',
    question: {
      en: 'I like to run a beauty salon/shop',
      kn: 'ನನಗೆ ಬ್ಯೂಟಿ ಪಾರ್ಲರ್/ಅಂಗಡಿ ನಡೆಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு ஒரு பியூட்டி பார்லர்/அழகுநிலையம் நடத்த பிடிக்கும்.',
      hi: 'मुझे ब्यूटी पार्लर या सैलून चलाना पसंद है।'
    }
  },
  {
    sequenceNumber: 13,
    category: 'R',
    image: 'Q13R.jpeg',
    question: {
      en: 'I like to plant trees or grow crops',
      kn: 'ನನಗೆ ಗಿಡ-ಮರಗಳನ್ನು ನೆಡುವುದು ಅಥವಾ ಬೆಳೆ ಬೆಳೆಯುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மரங்களை நட அல்லது பயிர்களை வளர்க்க பிடிக்கும்.',
      hi: 'मुझे पेड़ पौधे लगाना या फसल उगाना पसंद है।'
    }
  },
  {
    sequenceNumber: 14,
    category: 'I',
    image: 'Q14I.jpeg',
    question: {
      en: 'I like to work in a lab',
      kn: 'ನನಗೆ ಪ್ರಯೋಗಾಲಯದಲ್ಲಿ (Lab) ಕೆಲಸ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு ஆய்வகத்தில் (Lab) வேலை செய்ய பிடிக்கும்.',
      hi: 'मुझे लैब (प्रयोगशाला) में काम करना पसंद है।'
    }
  },
  {
    sequenceNumber: 15,
    category: 'A',
    image: 'Q15A.jpeg',
    question: {
      en: 'I like to act in plays',
      kn: 'ನನಗೆ ನಾಟಕಗಳಲ್ಲಿ ನಟಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு நாடகங்களில் நடிக்க பிடிக்கும்.',
      hi: 'मुझे नाटकों में अभिनय (acting) करना पसंद है।'
    }
  },
  {
    sequenceNumber: 16,
    category: 'S',
    image: 'Q16S.jpeg',
    question: {
      en: 'I like to give first aid',
      kn: 'ನನಗೆ ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ನೀಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு முதலுதவி (First Aid) செய்ய பிடிக்கும்.',
      hi: 'मुझे प्राथमिक उपचार (First Aid) देना पसंद है।'
    }
  },
  {
    sequenceNumber: 17,
    category: 'E',
    image: 'Q17E.png',
    question: {
      en: 'I like convincing people of my ideas/influence them',
      kn: 'ನನ್ನ ಆಲೋಚನೆಗಳನ್ನು ಜನರು ಒಪ್ಪುವಂತೆ ಮನವೊಲಿಸುವುದು ನನಗೆ ಇಷ್ಟ.',
      ta: 'எனது கருத்துக்களை மற்றவர்களிடம் கூறி அவர்களைச் சம்மதிக்க வைக்க பிடிக்கும்.',
      hi: 'मुझे अपने विचारों से लोगों को राजी करना या मनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 18,
    category: 'C',
    image: 'Q18C.jpeg',
    question: {
      en: 'I like to be a cashier / maintain accounts',
      kn: 'ನನಗೆ ಕ್ಯಾಷಿಯರ್ ಆಗಿ ಕೆಲಸ ಮಾಡುವುದು ಅಥವಾ ಲೆಕ್ಕಪತ್ರ ನಿರ್ವಹಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குக் காசாளராக (Cashier) இருக்க அல்லது கணக்குகளைப் பராமரிக்க பிடிக்கும்.',
      hi: 'मुझे कैशियर बनना या पैसों का हिसाब-किताब रखना पसंद है।'
    }
  },
  {
    sequenceNumber: 19,
    category: 'R',
    image: 'Q19R.png',
    question: {
      en: 'I like to put things together',
      kn: 'ನನಗೆ ವಸ್ತುಗಳನ್ನು ಜೋಡಿಸುವುದು ಅಥವಾ ಒಟ್ಟುಗೂಡಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் பொருட்களை ஒன்றாக இணைக்க பிடிக்கும்.',
      hi: 'मुझे चीज़ों को एक साथ जोड़ना या फिट करना पसंद है।'
    }
  },
  {
    sequenceNumber: 20,
    category: 'I',
    image: 'Q20I.jpg',
    question: {
      en: 'I like to do science experiments',
      kn: 'ನನಗೆ ವಿಜ್ಞಾನದ ಪ್ರಯೋಗಗಳನ್ನು ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு அறிவியல் சோதனைகளை (Science Experiments) செய்ய பிடிக்கும்.',
      hi: 'मुझे विज्ञान के प्रयोग (experiments) करना पसंद है।'
    }
  },
  {
    sequenceNumber: 21,
    category: 'A',
    image: 'Q21A.jpeg',
    question: {
      en: 'I like to draw',
      kn: 'ನನಗೆ ಚಿತ್ರ ಬಿಡಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் படம் வரைய பிடிக்கும்.',
      hi: 'मुझे चित्र बनाना (ड्रॉइंग) पसंद है।'
    }
  },
  {
    sequenceNumber: 22,
    category: 'S',
    image: 'Q22S.jpeg',
    question: {
      en: 'I like to volunteer for social service / help people in the community',
      kn: 'ನನಗೆ ಸಮಾಜ ಸೇವೆ ಮಾಡುವುದು ಅಥವಾ ಸಮಾಜದಲ್ಲಿ ಜನರಿಗೆ ಸಹಾಯ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குச் சமூக சேவை செய்ய அல்லது மக்களுக்கு உதவ பிடிக்கும்.',
      hi: 'मुझे समाज सेवा करना या लोगों की मदद करना पसंद है।'
    }
  },
  {
    sequenceNumber: 23,
    category: 'E',
    image: 'Q23E.jpeg',
    question: {
      en: 'I like to lead/start a group',
      kn: 'ನನಗೆ ಒಂದು ತಂಡವನ್ನು ಮುನ್ನಡೆಸುವುದು ಅಥವಾ ಆರಂಭಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு ஒரு குழுவைத் வழிநடத்த அல்லது தொடங்க பிடிக்கும்.',
      hi: 'मुझे किसी ग्रुप का नेतृत्व (lead) करना या ग्रुप बनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 24,
    category: 'C',
    image: 'Q24C.png',
    question: {
      en: 'I like to keep record of things',
      kn: 'ನನಗೆ ವಸ್ತುಗಳ/ಮಾಹಿತಿಯ ದಾಖಲೆಗಳನ್ನು ಇಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் பொருட்களின் விவரங்களைப் பதிவு செய்து வைக்க பிடிக்கும்.',
      hi: 'मुझे चीज़ों का रिकॉर्ड या लेखा-जोखा रखना पसंद है।'
    }
  },
  {
    sequenceNumber: 25,
    category: 'R',
    image: 'Q25R.png',
    question: {
      en: 'I like to use machines and make things',
      kn: 'ನನಗೆ ಯಂತ್ರಗಳನ್ನು ಬಳಸಿ ವಸ್ತುಗಳನ್ನು ತಯಾರಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு இயந்திரங்களைப் பயன்படுத்திப் பொருட்களைத் தயாரிக்க பிடிக்கும்.',
      hi: 'मुझे मशीनों का उपयोग करके चीजें बनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 26,
    category: 'I',
    image: 'Q26I.jpeg',
    question: {
      en: 'I like to build model rockets',
      kn: 'ನನಗೆ ರಾಕೆಟ್ ಮಾದರಿಗಳನ್ನು ತಯಾರಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மாதிரி ராக்கெட்டுகளை (Model Rockets) உருவாக்க பிடிக்கும்.',
      hi: 'मुझे रॉकेट के मॉडल बनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 27,
    category: 'A',
    image: 'Q27A.jpeg',
    question: {
      en: 'I like to arrange flowers/stages & decorate houses',
      kn: 'ನನಗೆ ಹೂವುಗಳನ್ನು ಜೋಡಿಸುವುದು, ವೇದಿಕೆ ನಿರ್ಮಿಸುವುದು ಅಥವಾ ಮನೆ ಅಲಂಕರಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் பூக்கள்/மேடைகளை அலங்கரிக்க அல்லது வீட்டை அழகுபடுத்த பிடிக்கும்.',
      hi: 'मुझे फूल/स्टेज सजाना या घर की सजावट करना पसंद है।'
    }
  },
  {
    sequenceNumber: 28,
    category: 'S',
    image: 'Q28S.jpeg',
    question: {
      en: 'I like to help and heal people',
      kn: 'ನನಗೆ ಜನರಿಗೆ ಸಹಾಯ ಮಾಡುವುದು ಮತ್ತು ಅವರ ಆರೋಗ್ಯವನ್ನು ಸುಧಾರಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மக்களுக்கு உதவவும் அவர்களின் நோயைக் குணப்படுத்தவும் பிடிக்கும்.',
      hi: 'मुझे लोगों की मदद करना और उनका इलाज करना पसंद है।'
    }
  },
  {
    sequenceNumber: 29,
    category: 'E',
    image: 'Q29E.jpeg',
    question: {
      en: 'I like to give speeches/debate',
      kn: 'ನನಗೆ ಭಾಷಣ ಮಾಡುವುದು ಅಥವಾ ಚರ್ಚಾ ಸ್ಪರ್ಧೆಯಲ್ಲಿ ಭಾಗವಹಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மேடைப் பேச்சு பேச அல்லது விவாதங்களில் பங்கேற்க பிடிக்கும்.',
      hi: 'मुझे भाषण देना या वाद-विवाद (debate) करना पसंद है।'
    }
  },
  {
    sequenceNumber: 30,
    category: 'C',
    image: 'Q30C.png',
    question: {
      en: 'I like to write down things I need to do',
      kn: 'ನಾನು ಮಾಡಬೇಕಾದ ಕೆಲಸಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಬರೆಯುವುದು ನನಗೆ ಇಷ್ಟ.',
      ta: 'நான் செய்ய வேண்டிய வேலைகளை எழுதி வைக்க பிடிக்கும்.',
      hi: 'मुझे अपने करने वाले कामों की सूची (To-do list) लिखना पसंद है।'
    }
  },
  {
    sequenceNumber: 31,
    category: 'R',
    image: 'Q31R.png',
    question: {
      en: 'I like to play a sport',
      kn: 'ನನಗೆ ಯಾವುದಾದರೂ ಕ್ರೀಡೆ/ಆಟ ಆಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு ஏதேனும் ஒரு விளையாட்டு விளையாட பிடிக்கும்.',
      hi: 'मुझे कोई खेल (sports) खेलना पसंद है।'
    }
  },
  {
    sequenceNumber: 32,
    category: 'I',
    image: 'Q32I.jpeg',
    question: {
      en: 'I like to build models, toys & other items',
      kn: 'ನನಗೆ ಮಾದರಿಗಳು, ಆಟಿಕೆಗಳು ಮತ್ತು ಇತರ ವಸ್ತುಗಳನ್ನು ತಯಾರಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மாதிரிகள், பொம்மைகள் மற்றும் இதர பொருட்களைச் செய்ய பிடிக்கும்.',
      hi: 'मुझे मॉडल, खिलौने और अन्य चीजें बनाना पसंद है।'
    }
  },
  {
    sequenceNumber: 33,
    category: 'A',
    image: 'Q33A.jpeg',
    question: {
      en: 'I like to write stories/poems',
      kn: 'ನನಗೆ ಕಥೆಗಳು ಅಥವಾ ಕವಿತೆಗಳನ್ನು ಬರೆಯುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குக் கதைகள் அல்லது கவிதைகள் எழுத பிடிக்கும்',
      hi: 'मुझे कहानियाँ या कविताएँ लिखना पसंद है।'
    }
  },
  {
    sequenceNumber: 34,
    category: 'S',
    image: 'Q34S.jpg',
    question: {
      en: 'I like to make people laugh',
      kn: 'ನನಗೆ ಜನರನ್ನು ನಗಿಸುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு மற்றவர்களைச் சிரிக்க வைக்க பிடிக்கும்.',
      hi: 'मुझे लोगों को हंसाना पसंद है।'
    }
  },
  {
    sequenceNumber: 35,
    category: 'E',
    image: 'Q35E.jpg',
    question: {
      en: 'I like to sell things',
      kn: 'ನನಗೆ ವಸ್ತುಗಳನ್ನು ಮಾರಾಟ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்குப் பொருட்களை விற்க பிடிக்கும்.',
      hi: 'मुझे चीजें बेचना पसंद है।'
    }
  },
  {
    sequenceNumber: 36,
    category: 'C',
    image: 'Q36C.jpeg',
    question: {
      en: 'I like to answer phones/help customers',
      kn: 'ನನಗೆ ಫೋನ್ ಕರೆಗಳಿಗೆ ಉತ್ತರಿಸುವುದು ಅಥವಾ ಗ್ರಾಹಕರಿಗೆ ಸಹಾಯ ಮಾಡುವುದು ಇಷ್ಟ.',
      ta: 'எனக்கு போன் கால்களுக்கு பதிலளிக்க அல்லது வாடிக்கையாளர்களுக்கு உதவ பிடிக்கும்.',
      hi: 'मुझे फ़ोन पर बात करना या ग्राहकों (customers) की मदद करना पसंद है।'
    }
  }
];

export interface WheelSectorData {
  category: CategoryKey;
  color: string;
  bgColor: string;
  hoverColor: string;
  borderColor: string;
  synonym: Record<LangKey, string>;
  jobs: Record<LangKey, string[]>;
  description: Record<LangKey, string>;
}

export const HOLLAND2_WHEEL_DATA: WheelSectorData[] = [
  {
    category: 'C',
    color: '#8B5CF6', // Purple
    bgColor: 'rgba(139, 92, 246, 0.15)',
    hoverColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: '#7C3AED',
    synonym: {
      en: 'ORGANIZER',
      kn: 'ಸಂಘಟಕರು (ORGANIZER)',
      ta: 'முறையமைப்பாளர் (ORGANIZER)',
      hi: 'आयोजक (ORGANIZER)'
    },
    jobs: {
      en: ['Accountant', 'Teacher', 'P.A. (secretary)', 'C.A.', 'Insurance agent'],
      kn: ['ಅಕೌಂಟೆಂಟ್', 'ಶಿಕ್ಷಕರು', 'ಪಿ.ಎ. (ಕಾರ್ಯದರ್ಶಿ)', 'ಸಿ.ಎ.', 'ವಿಮಾ ಏಜೆಂಟ್'],
      ta: ['கணக்காளர்', 'ஆசிரியர்', 'தனிச் செயலாளர் (P.A.)', 'சி.ஏ. (C.A.)', 'காப்பீட்டு முகவர்'],
      hi: ['मुनीम (Accountant)', 'शिक्षक', 'पी.ए. (सचिव)', 'सी.ए. (C.A.)', 'बीमा एजेंट']
    },
    description: {
      en: 'Likes to work with numbers, records, or machines in an orderly, systematic way. They value precision, details, and organization.',
      kn: 'ಸಂಖ್ಯೆಗಳು, ದಾಖಲೆಗಳು ಅಥವಾ ಯಂತ್ರಗಳೊಂದಿಗೆ ವ್ಯವಸ್ಥಿತವಾಗಿ ಕೆಲಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತಾರೆ. ಇವರು ನಿಖರತೆ ಮತ್ತು ಸಂಘಟನೆಗೆ ಆದ್ಯತೆ ನೀಡುತ್ತಾರೆ.',
      ta: 'எண்கள், கோப்புகள் அல்லது இயந்திரங்களுடன் முறையான வழியில் வேலை செய்ய விரும்புபவர்கள். இவர்கள் துல்லியம் மற்றும் ஒழுங்கமைப்பை மதிக்கிறார்கள்.',
      hi: 'संख्याओं, रिकॉर्ड या मशीनों के साथ व्यवस्थित तरीके से काम करना पसंद करते हैं। वे सटीकता और संगठन को महत्व देते हैं।'
    }
  },
  {
    category: 'A',
    color: '#10B981', // Green
    bgColor: 'rgba(16, 185, 129, 0.15)',
    hoverColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#059669',
    synonym: {
      en: 'CREATORS',
      kn: 'ಸೃಜನಾತ್ಮಕರು (CREATORS)',
      ta: 'படைப்பாளிகள் (CREATORS)',
      hi: 'सृजनकर्ता (CREATORS)'
    },
    jobs: {
      en: ['Marketing', 'Salesmen', 'Designer', 'Wedding planner', 'Journalist'],
      kn: ['ಮಾರ್ಕೆಟಿಂಗ್', 'ಮಾರಾಟಗಾರರು', 'ಡಿಸೈನರ್', 'ವೆಡ್ಡಿಂಗ್ ಪ್ಲಾನರ್', 'ಪತ್ರಕರ್ತರು'],
      ta: ['சந்தைப்படுத்துதல் (Marketing)', 'விற்பனையாளர்', 'வடிவமைப்பாளர்', 'திருமண அமைப்பாளர்', 'பத்திரிகையாளர்'],
      hi: ['विपणन (Marketing)', 'विक्रेता', 'डिजाइनर', 'वेडिंग प्लानर', 'पत्रकार']
    },
    description: {
      en: 'Likes to work with creative ideas, art, music, or writing. They prefer self-expression and unstructured environments.',
      kn: 'ಸೃಜನಾತ್ಮಕ ಆಲೋಚನೆಗಳು, ಕಲೆ, ಸಂಗೀತ ಅಥವಾ ಬರವಣಿಗೆಯೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತಾರೆ. ಇವರು ಸ್ವಯಂ ಅಭಿವ್ಯಕ್ತಿಗೆ ಆದ್ಯತೆ ನೀಡುತ್ತಾರೆ.',
      ta: 'ஆக்கப்பூர்வமான யோசனைகள், கலை, இசை அல்லது எழுத்து வேலைகளை விரும்புபவர்கள். இவர்கள் தங்களை வெளிப்படுத்திக் கொள்ள விரும்புகிறார்கள்.',
      hi: 'रचनात्मक विचारों, कला, संगीत या लेखन के साथ काम करना पसंद करते हैं। वे स्वतंत्र अभिव्यक्ति पसंद करते हैं।'
    }
  },
  {
    category: 'I',
    color: '#F59E0B', // Yellow
    bgColor: 'rgba(245, 158, 11, 0.15)',
    hoverColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#D97706',
    synonym: {
      en: 'THINKERS',
      kn: 'ಚಿಂತಕರು (THINKERS)',
      ta: 'சிந்தனையாளர்கள் (THINKERS)',
      hi: 'चिन्तक (THINKERS)'
    },
    jobs: {
      en: ['Scientist', 'Engineer', 'Auditor', 'Data Entry'],
      kn: ['ವಿಜ್ಞಾನಿ', 'ಇಂಜಿನಿಯರ್', 'ಆಡಿಟರ್', 'ಡೇಟಾ ಎಂಟ್ರಿ'],
      ta: ['விஞ்ஞானி', 'பொறியாளர்', 'தணிக்கையாளர்', 'தரவு உள்ளீடு (Data Entry)'],
      hi: ['वैज्ञानिक', 'इंजीनियर', 'लेखा परीक्षक (Auditor)', 'डेटा एंट्री']
    },
    description: {
      en: 'Likes to observe, learn, investigate, analyze, evaluate, or solve problems. They are highly intellectual and curious.',
      kn: 'ವೀಕ್ಷಿಸುವುದು, ಕಲಿಯುವುದು, ತನಿಖೆ ಮಾಡುವುದು, ವಿಶ್ಲೇಷಿಸುವುದು ಮತ್ತು ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸುವುದು ಇಷ್ಟಪಡುತ್ತಾರೆ. ಇವರು ಜಿಜ್ಞಾಸುಗಳು.',
      ta: 'பிரச்சினைகளைக் கவனிக்க, கற்றுக்கொள்ள, ஆராய, பகுப்பாய்வு செய்ய அல்லது தீர்க்க விரும்புபவர்கள். இவர்கள் அதிக அறிவாற்றல் மற்றும் ஆர்வம் கொண்டவர்கள்.',
      hi: 'समस्याओं का निरीक्षण करना, सीखना, जांच करना, विश्लेषण करना या उनका समाधान खोजना पसंद करते हैं। वे अत्यधिक बौद्धिक और जिज्ञासु होते हैं।'
    }
  },
  {
    category: 'E',
    color: '#3B82F6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.15)',
    hoverColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#2563EB',
    synonym: {
      en: 'PERSUADERS',
      kn: 'ಮನವೊಲಿಸುವವರು (PERSUADERS)',
      ta: 'தூண்டுபவர்கள் (PERSUADERS)',
      hi: 'प्रेरक (PERSUADERS)'
    },
    jobs: {
      en: ['Manager', 'Bank Manager', 'Advertising', 'Translator', 'Business'],
      kn: ['ವ್ಯವಸ್ಥಾಪಕರು', 'ಬ್ಯಾಂಕ್ ವ್ಯವಸ್ಥಾಪಕರು', 'ಜಾಹೀರಾತು', 'ಅನುವಾದಕರು', 'ವ್ಯಾಪಾರ'],
      ta: ['மேலாளர்', 'வங்கி மேலாளர்', 'விளம்பரம்', 'மொழிபெயர்ப்பாளர்', 'தொழில் / வியாபாரம்'],
      hi: ['प्रबंधक (Manager)', 'बैंक प्रबंधक', 'विज्ञापन', 'अनुवादक', 'व्यवसाय']
    },
    description: {
      en: 'Likes to work with people, influencing, persuading, leading or managing them for organizational goals or economic gain.',
      kn: 'ಜನರೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವುದು, ನಾಯಕತ್ವ ವಹಿಸುವುದು, ವ್ಯವಹಾರ ಮಾಡುವುದು ಮತ್ತು ಲಾಭಕ್ಕಾಗಿ ಪ್ರೇರೇಪಿಸುವುದು ಇಷ್ಟಪಡುತ್ತಾರೆ.',
      ta: 'மக்களுடன் இணைந்து பணியாற்ற, அவர்களை வழிநடத்த, வியாபாரம் செய்ய அல்லது இலக்குகளை அடைய அவர்களைத் தூண்ட விரும்புபவர்கள்.',
      hi: 'लोगों के साथ काम करना, उन्हें प्रभावित करना, उनका नेतृत्व करना या व्यावसायिक लाभ के लिए उन्हें प्रबंधित करना पसंद करते हैं।'
    }
  },
  {
    category: 'R',
    color: '#EF4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.15)',
    hoverColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#DC2626',
    synonym: {
      en: 'DOERS',
      kn: 'ಮಾಡುವವರು (DOERS)',
      ta: 'செயல்வீரர்கள் (DOERS)',
      hi: 'कर्ता (DOERS)'
    },
    jobs: {
      en: ['Mechanic (Car/AC/Computer)', 'Technician', 'Cook', 'Architect'],
      kn: ['ಮೆಕ್ಯಾನಿಕ್ (ಕಾರ್/ಎಸಿ/ಕಂಪ್ಯೂಟರ್)', 'ತಂತ್ರಜ್ಞರು', 'ಅಡುಗೆಯವರು', 'ವಾಸ್ತುಶಿಲ್ಪಿ'],
      ta: ['மெக்கானிக் (கார்/ஏசி/கணினி)', 'தொழில்நுட்ப வல்லுநர்', 'சமையல்காரர்', 'கட்டிடக் கலைஞர்'],
      hi: ['मैकेनिक (कार/एसी/कंप्यूटर)', 'तकनीशियन', 'रसोइया', 'वास्तुकार']
    },
    description: {
      en: 'Likes to work with hands, machines, tools, animals, or plants. They prefer concrete, practical, and hands-on activities.',
      kn: 'ಕೈ ಕೆಲಸಗಳು, ಯಂತ್ರಗಳು, ಉಪಕರಣಗಳು, ಸಸ್ಯಗಳು ಅಥವಾ ಪ್ರಾಣಿಗಳೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತಾರೆ. ಇವರು ಪ್ರಾಯೋಗಿಕ ಕೆಲಸಗಾರರು.',
      ta: 'இயந்திரங்கள், கருவிகள் அல்லது தாவரங்களுடன் வேலை செய்ய விரும்புபவர்கள். இவர்கள் நடைமுறையான மற்றும் நேரடி வேலைகளை விரும்புகிறார்கள்.',
      hi: 'हाथों, मशीनों, औजारों या पौधों के साथ काम करना पसंद करते हैं। वे व्यावहारिक और प्रत्यक्ष गतिविधियों को प्राथमिकता देते हैं।'
    }
  },
  {
    category: 'S',
    color: '#14B8A6', // Teal
    bgColor: 'rgba(20, 184, 166, 0.15)',
    hoverColor: 'rgba(20, 184, 166, 0.25)',
    borderColor: '#0D9488',
    synonym: {
      en: 'HELPERS',
      kn: 'ಸಹಾಯಕರು (HELPERS)',
      ta: 'உதவுபவர்கள் (HELPERS)',
      hi: 'सहायक (HELPERS)'
    },
    jobs: {
      en: ['Municipal Officer', 'Nurse', 'Social Worker', 'Trainer', 'Compounder', 'Teacher'],
      kn: ['ಪುರಸಭೆ ಅಧಿಕಾರಿ', 'ದಾದಿ', 'ಸಮಾಜ ಸೇವಕರು', 'ತರಬೇತುದಾರರು', 'ಕಾಂಪೌಂಡರ್', 'ಶಿಕ್ಷಕರು'],
      ta: ['நகராட்சி அதிகாரி', 'செவிலியர்', 'சமூகப் பணியாளர்', 'பயிற்சியாளர்', 'காம்பவுண்டர்', 'ஆசிரியர்'],
      hi: ['नगर पालिका अधिकारी', 'नर्स', 'सामाजिक कार्यकर्ता', 'ट्रेनर', 'कंपाउंडर', 'शिक्षक']
    },
    description: {
      en: 'Likes to work with people to enlighten, help, train, discuss, or cure them. They value empathy, relationships, and service.',
      kn: 'ಜನರಿಗೆ ಸಹಾಯ ಮಾಡಲು, ತರಬೇತಿ ನೀಡಲು, ಚರ್ಚಿಸಲು ಅಥವಾ ಗುಣಪಡಿಸಲು ಇಷ್ಟಪಡುತ್ತಾರೆ. ಇವರು ಸಹಾನುಭೂತಿ ಮತ್ತು ಸೇವೆಗೆ ಆದ್ಯತೆ ನೀಡುತ್ತಾರೆ.',
      ta: 'மக்களுக்கு உதவ, அவர்களுக்குப் பயிற்சி அளிக்க, உரையாட அல்லது குணப்படுத்த விரும்புபவர்கள். இவர்கள் மனிதநேயம் மற்றும் சேவையை மதிக்கிறார்கள்.',
      hi: 'लोगों को सिखाने, उनकी मदद करने, प्रशिक्षित करने या उनका इलाज करने के लिए उनके साथ काम करना पसंद करते हैं। वे सहानुभूति और सेवा को महत्व देते हैं।'
    }
  }
];

