const infixToFunction = {
    "+": (x, y) => x + y,
    "-": (x, y) => x - y,
    "*": (x, y) => x * y,
    "/": (x, y) => x / y,
  }
  
  const infixEval = (str, regex) => str.replace(regex, (_match, arg1, operator, arg2) => infixToFunction[operator](parseFloat(arg1), parseFloat(arg2)));
    //replace method is called with regex, it searches for patterns that match the regex in the input string 'str'. For each match, it extracts the parts defined by the capturing groups () and passes them to the replacement function.
  const highPrecedence = str => {
    const regex = /([\d.]+)([*\/])([\d.]+)/;
    const str2 = infixEval(str, regex);
    return str === str2 ? str : highPrecedence(str2);
  } //highPrecedence evaluate multiplication and division of an expression first and return the string with addition or subtraction 
  
  const isEven = num => num % 2 === 0;
  const sum = nums => nums.reduce((acc, el) => acc + el, 0);
  const average = nums => sum(nums) / nums.length;
  
  const median = nums => {
    const sorted = nums.slice().sort((a, b) => a - b);
    const length = sorted.length;
    const middle = length / 2 - 1;
    return isEven(length)
      ? average([sorted[middle], sorted[middle + 1]])
      : sorted[Math.ceil(middle)];
  }
  
  const spreadsheetFunctions = {
    
    sum,
    average,
    median,
    even: nums => nums.filter(isEven),
    someeven: nums => nums.some(isEven),
    everyeven: nums => nums.every(isEven),
    firsttwo: nums => nums.slice(0, 2),
    lasttwo: nums => nums.slice(-2),
    has2: nums => nums.includes(2),
    increment: nums => nums.map(num => num + 1),
    random: ([x, y]) => Math.floor(Math.random() * y + x),
    range: nums => range(...nums),
    nodupes: nums => [...new Set(nums).values()],
    '' : () => {},
  }
  
  const applyFunction = str => {
    const noHigh = highPrecedence(str);
    const infix = /([\d.]+)([+-])([\d.]+)/;
    const str2 = infixEval(noHigh, infix);
    const functionCall = /([a-z0-9]*)\(([0-9., ]*)\)(?!.*\()/i; // regular expression for a function call such as sum(1,2,3), this regex does not include the parenthesis, () notice they are not of any captured groups
    const toNumberList = args => args.split(",").map(parseFloat);
    const apply = (fn, args) => spreadsheetFunctions[fn.toLowerCase()](toNumberList(args));
    return str2.replace(functionCall, (match, fn, args) => spreadsheetFunctions.hasOwnProperty(fn.toLowerCase()) ? apply(fn, args) : match);//args here is the arguments part of a function call such as sum(1,2,3); args would be the string 1,2,3
  }
  //spreadsheetFunctions.hasOwnProperty(fn.toLowerCase()): checks if the function name ('fn') exists in the spreadsheetFunctions object, using a case-insensitive comparison
  // '? apply(fn, args) : match' : this is a ternary operator that decides what to replace the match with. if the function exists in 'spreadsheetFunctions', it calls the 'apply' function with the function name and arguments, if the function does not exists it leaves the match unchanged (returns 'match')
  // the apply function calls the corresponding functions in the spreadsheetFunctions object
  const range = (start, end) => Array(end - start + 1).fill(start).map((element, index) => element + index); //this function first create an array with empty slots, then fill the slots with the start element and then map() change it
  const charRange = (start, end) => range(start.charCodeAt(0), end.charCodeAt(0)).map(code => String.fromCharCode(code)); //this function generate an array of characters from a starting character to an ending character, this function first uses the range function defined above to generate numeric range then map() the numeric array/ convert the number (character codes) back to characters using the fromCharCode methods
  //so first generate a numeric array [65, 66, 67, 68] then uses fromCharCode turns these character codes to character ['A', 'B', 'C', 'D']
  
  const evalFormula = (x, cells) => {
    const idToText = id => cells.find(cell => cell.id === id).value;
    const rangeRegex = /([A-J])([1-9][0-9]?):([A-J])([1-9][0-9]?)/gi; //ranges of the cells from the spreadsheet
    const rangeFromString = (num1, num2) => range(parseInt(num1), parseInt(num2)); //generates a range of numbers from string values num1 and num2
    const elemValue = num => character => idToText(character + num); //a cell ID such as A1, get the cell value
    const addCharacters = character1 => character2 => num => charRange(character1, character2).map(elemValue(num));//note: when calling the elemValue() function, it is a curried function so it will return another function that takes another argument and the map function will pass each character in the character array into this function
    const rangeExpanded = x.replace(rangeRegex, (_match, char1, num1, char2, num2) => rangeFromString(num1, num2).map(addCharacters(char1)(char2)));
    const cellRegex = /[A-J][1-9][0-9]?/gi;
    const cellExpanded = rangeExpanded.replace(cellRegex, match => idToText(match.toUpperCase())); //The cellExpanded step ensures that all individual cell references are replaced with their actual values, handling cases where the input may contain individual cell references, either alone or mixed with ranges. cases such as SUM(A1, B2) + C3 need cellExpanded, cellExpanded will return SUM(1, 5) + 9
    const functionExpanded = applyFunction(cellExpanded); //functionExpanded will evaluate the expression got from cellExpanded SUM(1, 5) + 9
    return functionExpanded === x ? functionExpanded : evalFormula(functionExpanded, cells);
  }
  
  window.onload = () => { //window.onload method is a special event handler in javascript that executes a function when the entire page has finished loading
    const container = document.getElementById("container");
    const createLabel = (name) => {
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = name;
      container.appendChild(label);
    }
    const letters = charRange("A", "J");
    letters.forEach(createLabel);
    range(1, 99).forEach(number => {
      createLabel(number);
      letters.forEach(letter => {
        const input = document.createElement("input");
        input.type = "text";
        input.id = letter + number;
        input.ariaLabel = letter + number;
        input.onchange = update; //each input field is created and assigned an 'onchange' EVENT LISTENER that poinst to the update function
        container.appendChild(input);
      })
    })
  }
  
  const update = event => {
    const element = event.target;
    const value = element.value.replace(/\s/g, "");
    if (!value.includes(element.id) && value.startsWith('=')) {
      element.value = evalFormula(value.slice(1), Array.from(document.getElementById("container").children));
    }
  }