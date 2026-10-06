const words = [['cat', '🐈'], ['dog', '🐕'], ['bird', '🐦'], ['fish', '🐟'], ['lion', '🦁'], ['tiger', '🐅'], ['elephant', '🐘'], ['monkey', '🐒'], ['rabbit', '🐇'], ['turtle', '🐢']];
function question(id, type, prompt, answer, extra = {}) {
  return { id, type, prompt, score: 10, acceptedAnswers: [answer], options: [], explanation: '', passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true, ...extra };
}
const common = { description: 'Bài luyện tiếng Anh mẫu', difficulty: 'easy', course: 'English', lesson: '1', timeLimit: 0, status: 'published' };
const animals = { ...common, title: 'Animals · Lớp 3', grade: 3, skill: 'Vocabulary', unit: 'Animals', questions: words.map(([w, emoji], i) => question(`animal_${i}`, 'multiple_choice', `What animal is this? ${emoji}`, w, { options: [w, words[(i + 1) % 10][0], words[(i + 2) % 10][0]] })) };
const grammarPairs = [['She ___ a student.', 'is', ['is', 'are', 'am']], ['I ___ to school every day.', 'go', ['go', 'goes', 'going']], ['He ___ football on Sunday.', 'plays', ['play', 'plays', 'playing']], ['They ___ happy.', 'are', ['is', 'am', 'are']], ['My mother ___ English.', 'teaches', ['teach', 'teaches', 'teaching']], ['We ___ breakfast at seven.', 'have', ['has', 'have', 'having']], ['The sun ___ in the east.', 'rises', ['rise', 'rises', 'rising']], ['___ she like music?', 'Does', ['Do', 'Does', 'Is']], ['I ___ not like rain.', 'do', ['do', 'does', 'am']], ['Tom ___ his homework after school.', 'does', ['do', 'does', 'doing']]];
const grammar = { ...common, title: 'Present Simple · Lớp 6', grade: 6, skill: 'Grammar', unit: 'Present Simple', questions: grammarPairs.map(([p, a, options], i) => question(`grammar_${i}`, i % 2 ? 'fill_blank' : 'multiple_choice', p, a, { options })) };
const passage = 'Linh lives in a small village near a river. Every morning, she walks to school with her brother Nam. Her favourite subject is English because she wants to travel. After school, she helps her parents grow vegetables. On weekends, her family visits the local library.';
const reading = { ...common, title: 'A day in the village · Lớp 8', grade: 8, skill: 'Reading', unit: 'Daily life', questions: [['Where does Linh live?', 'A village', ['A village', 'A city', 'An island']], ['Who walks with Linh?', 'Her brother', ['Her brother', 'Her cousin', 'Her teacher']], ['What is her favourite subject?', 'English', ['Math', 'English', 'Science']], ['What does she grow?', 'Vegetables', ['Flowers', 'Trees', 'Vegetables']], ['Where does the family go on weekends?', 'The library', ['The cinema', 'The library', 'The market']]].map(([p, a, options], i) => question(`reading_${i}`, 'read_choose', p, a, { options, passage })) };
const showcase = { ...common, title: 'English adventure · 16 dạng bài', grade: 3, skill: 'Vocabulary', unit: 'Adventure', questions: [
  question('mc', 'multiple_choice', 'Choose an animal.', 'cat', { options: ['table', 'cat', 'chair'] }),
  question('blank', 'fill_blank', 'She ___ a student.', 'is'),
  question('match', 'matching', 'Match the animals.', '', { acceptedAnswers: [], pairs: [{ left: '🐈', right: 'cat' }, { left: '🐕', right: 'dog' }] }),
  question('drag', 'drag_drop', 'I ___ a student.', 'am', { options: ['is', 'are', 'am'] }),
  question('letters', 'missing_letters', 'Complete the word: C _ T', 'cat'),
  question('word', 'word_scramble', 'Arrange the letters.', 'cat', { tokens: ['t', 'a', 'c'] }),
  question('sentence', 'sentence_scramble', 'Arrange the words.', 'I go to school.', { tokens: ['school', 'I', 'to', 'go'] }),
  question('odd', 'odd_one_out', 'Which word is different?', 'table', { options: ['cat', 'dog', 'table', 'fish'] }),
  question('tf', 'true_false', 'A cat is an animal.', 'True', { options: ['True', 'False'] }),
  question('lc', 'listen_choose', 'Listen and choose.', 'cat', { speechText: 'Cat', audio: '/assets/exercise-audio/cat.wav', options: ['cat', 'dog', 'fish'] }),
  question('lt', 'listen_type', 'Listen and type the word.', 'cat', { speechText: 'Cat', audio: '/assets/exercise-audio/cat.wav' }),
  question('read', 'read_choose', 'What pet does Tom have?', 'a cat', { passage: 'Tom has a cat. Its name is Mimi.', options: ['a dog', 'a cat', 'a bird'] }),
  question('error', 'error_correction', 'Correct: She go to school every day.', 'She goes to school every day.'),
  question('transform', 'sentence_transformation', 'Rewrite with have: I started learning English three years ago.', 'I have learned English for three years.', { acceptedAnswers: ['I have learned English for three years.', 'I have learnt English for three years.'] }),
  question('typing', 'typing', 'Type the sentence.', 'I love English.', { passage: 'I love English.' }),
  question('race', 'typing_race', 'Ready for a typing race?', 'My cat is happy.', { passage: 'My cat is happy.' }),
] };
const advanced = { ...common, title: 'Creative English · 5 dạng nâng cao', grade: 6, skill: 'Writing', unit: 'Creative English', questions: [
  question('search', 'word_search', 'Find the animal words.', 'CAT', { acceptedAnswers: ['CAT', 'DOG', 'BIRD'] }),
  question('crossword', 'crossword', 'Complete the crossword.', '', { acceptedAnswers: [], pairs: [{ left: 'A pet that meows', right: 'CAT' }, { left: 'A road vehicle', right: 'CAR' }, { left: 'The opposite of cold', right: 'HOT' }] }),
  question('memory', 'memory', 'Match each word to its meaning.', '', { acceptedAnswers: [], pairs: [{ left: 'A pet that meows', right: 'cat' }, { left: 'A pet that barks', right: 'dog' }] }),
  question('writing', 'writing', 'Write about your family.', '', { acceptedAnswers: [], minWords: 5, maxWords: 80 }),
  question('speaking', 'speaking', 'Tell us about your favourite animal.', '', { acceptedAnswers: [] }),
] };
module.exports = { demos: [animals, grammar, reading, showcase, advanced], question };

