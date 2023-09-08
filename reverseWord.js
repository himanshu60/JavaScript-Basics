// DSA Question - sentence like "hello world", reverse single word separately. in js with simpler code

function reverseWords(sentence) {
    // Split the sentence into words
    const words = sentence.split(' ');
  
    // Reverse each word and join them back into a sentence
    const reversedWords = words.map(word => word.split('').reverse().join(''));
  
    // Join the reversed words to form the final sentence
    const reversedSentence = reversedWords.join(' ');
  
    return reversedSentence;
  }
  
  const originalSentence = "hello world";
  const reversedSentence = reverseWords(originalSentence);
  
  console.log(reversedSentence); // Output: "olleh dlrow"
  