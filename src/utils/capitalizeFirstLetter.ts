export function capitalizeFirstLetter(string: string) {
  const splitString = string.split("_");

  const splitStringCorrected = splitString.map((word) => {
    const lowerCaseWord = word.toLowerCase();

    return lowerCaseWord.charAt(0).toUpperCase() + lowerCaseWord.slice(1);
  });

  return splitStringCorrected.join(" ");
}
