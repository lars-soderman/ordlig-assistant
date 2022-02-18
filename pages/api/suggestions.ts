import { words } from '../../data/svenska-ord';
import { Clue, Suggestion, ModelCharacter, Limit } from '../../types';

import { clueData } from '../../data/clues';

export default function handler(req, res) {
  const charCount = 5;
  const wordsToProcess = words
    .filter((i) => i.length === charCount)
    .map((i) => i.toLowerCase())
    .filter((i) => !i.includes('-'));

  const clues: Clue[] = req.body || clueData;

  const initModelWord = (): ModelCharacter[] => {
    const model: ModelCharacter[] =
      charCount === 5
        ? [{}, {}, {}, {}, {}]
        : charCount === 6
        ? [{}, {}, {}, {}, {}, {}]
        : null;
    return model.map((i) => {
      return {
        definitely: '',
        maybe: [],
        not: [],
      };
    });
  };

  const allGreyChars = (modelWord: ModelCharacter[]) => {
    return [...new Set(modelWord.flatMap(({ not }) => not))];
  };

  const limits: Limit[] = [];

  const checkAndSetLimits = (
    character: string,
    modelWord: ModelCharacter[]
  ): Limit[] => {
    console.log('limit checking ', character);
    modelWord.forEach((modelCharacter) => {
      if (
        modelCharacter.definitely === character ||
        character in modelCharacter.maybe
      ) {
        console.log('is in yellow or green ', character);
        if (limits.some((l) => l.character === character)) {
          console.log('incrementing limit', character);
          limits[limits.findIndex((r) => r.character === character)].count =
            occurencesInGreenOrYellow(character, modelWord);
        } else {
          console.log('adding ', character);
          limits.push({ character: character, count: 1 });
        }
      }
    });
    console.log('limits', limits);
    return limits;
  };

  const modelWord = () => {
    const modelWord = initModelWord();
    clues.forEach((clue) => {
      switch (clue.result) {
        case 'green':
          modelWord[clue.position - 1].definitely = clue.character;
          modelWord[clue.position - 1].maybe = [];
          break;
        case 'yellow':
          modelWord.forEach((item, index) => {
            if (index + 1 !== clue.position && item.definitely === '') {
              if (item.maybe.indexOf(clue.character) === -1) {
                item.maybe.push(clue.character);
              }
            }
          });
          modelWord[clue.position - 1].not.push(clue.character);
          break;
        case 'grey':
          console.log('grey detected!');
          modelWord.forEach((modelChar) => {
            if (modelChar.not.indexOf(clue.character) === -1) {
              modelChar.not?.push(clue.character);
            }
          });
          checkAndSetLimits(clue.character, modelWord);
          break;
        default:
          console.log('invalid result in clue: ' + clue.result);
          break;
      }
    });
    console.log('modelWord', modelWord);
    return modelWord;
  };

  const isEitherGreenOrYellow = (
    character: string,
    modelWord: ModelCharacter[]
  ): boolean => {
    return modelWord.some((modelCharacter) => {
      return (
        modelCharacter.definitely === character ||
        modelCharacter.maybe.includes(character)
      );
    });
  };

  const occurencesInGreenOrYellow = (
    character: string,
    modelWord: ModelCharacter[]
  ): number => {
    return modelWord.reduce((acc, curr) => {
      return curr.definitely === character || curr.maybe.includes(character)
        ? ++acc
        : acc;
    }, 0);
  };

  const occurrencesOf = (letter, word): number => {
    return word.split('').reduce((acc, curr) => {
      return curr === letter ? ++acc : acc;
    }, 0);
  };

  const createSuggestions = (
    modelWord: ModelCharacter[],
    wordList: string[]
  ): Suggestion[] => {
    return wordList.map((word) => {
      let suggestion: Suggestion = { word, score: 0, disqualified: false };
      for (let i = 0; i < charCount; i++) {
        // Definitely
        if (modelWord[i].definitely !== '') {
          if (modelWord[i].definitely === word[i]) {
            suggestion.score = suggestion.score + 2;
          } else {
            suggestion.score = 0;
            suggestion.disqualified = true;
          }
        }
        // Maybe
        if (modelWord[i]?.maybe.length > 0) {
          if (modelWord[i]?.maybe.includes(word[i])) {
            suggestion.score = suggestion.score + 1;
          }
          if (
            // If word doesnt contain any of the yellow chars, throw it out
            !modelWord.some((char) => char.maybe.some((x) => word.includes(x)))
          ) {
            console.log('nollas vid maybe');
            suggestion.score = 0;
            suggestion.disqualified = true;
            // break;
          }
        }
        // Not
        if (modelWord[i].not.includes(word[i])) {
          suggestion.score = 0;
          suggestion.disqualified = true;
        }
        // Is current letter in "not" anywhere?
        if (modelWord.some((x) => x.not.includes(word[i]))) {
          // Is current letter not also yellow or green?
          if (!isEitherGreenOrYellow(word[i], modelWord)) {
            // Is current letter limited, and does it occur too many times?
            if (
              occurrencesOf(word[i], word) >
              limits.find((x) => x.character === word[i])?.count
            ) {
              console.log('nollning!');
              suggestion.score = 0;
              suggestion.disqualified = true;
            }
          }
        }
      }
      return suggestion;
    });
  };

  const highestScore = (arr) => {
    return arr.reduce((prev, curr) => {
      return prev.score > curr.score ? prev.score : curr.score;
    }, 0);
  };

  const suggestions = createSuggestions(modelWord(), wordsToProcess)
    .filter((i) => i !== undefined)
    .filter((i) => i.disqualified === false);

  const response = suggestions
    .filter((i) => i.score === highestScore(suggestions))
    .map((i) => {
      return { word: i.word, score: i.score };
    });

  res.status(200).json({
    response: response,
  });
}
