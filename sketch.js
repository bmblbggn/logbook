let socket;
let isConnected = false;
let sendingValue = 0;
let lastSentValue = 0;
let esp32IP = "192.168.0.41"; // Replace with your ESP32's IP address


let d, m, y, h, min;

let currentPage = 'home'; // 'home', 'keyboard', 'form', or 'thankyou'
let playerName = '';
let maxNameLength = 20;

// Virtual keyboard layout
let keyboardKeys = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

let specialKeys = [
  { key: 'SPACE', x: 0, y: 0, w: 200, h: 60 },
  { key: '←', x: 0, y: 0, w: 100, h: 60 },     // Backspace
  { key: 'ENTER', x: 0, y: 0, w: 150, h: 60 }
];

let keySize = 70;
let keySpacing = 10;
let keyboardStartY = 400;

let inputs = []; // array of input 
let dropdowns = []; // Array of dropdown objects with metadata

let submitButton;
let newEntryButton;
let backHomeButton;

let validationErrors = {
  name: false,
  rating: false
};

let visitorList = [];
let overallTotal = 0;

let thankYouTimer = 0;


function connectToESP32() {
  // WebSocket connection to ESP32 (port 80, path /ws)
  socket = new WebSocket(`ws://${esp32IP}/ws`);
  
  socket.onopen = function(event) {
    console.log("Connected to ESP32");
    isConnected = true;
  };
  
  socket.onclose = function(event) {
    console.log("Disconnected from ESP32");
    isConnected = false;
    
    // Try to reconnect after 3 seconds
    setTimeout(connectToESP32, 3000);
  };
  
  socket.onerror = function(error) {
    console.log("WebSocket error:", error);
    isConnected = false;
  };
}


function setup() {
  createCanvas(1024, 1280);

  // Connect to ESP32 WebSocket server
  connectToESP32();

  //input fields
  const inputData = [
    { label: 'Name', id: 'name'},
  ];
  //create inputs
  inputData.forEach((data, index) => {
    const input = createInput('');
    input.position(570, 200 + index * 40);
    input.hide();

    inputs.push({
      label: data.label,
      id: data.id,
      input: input,
      y: 200 + index * 40
    });
  });

  //dropdown fields
  const dropdownData = [
    { datapt: 'Rate your visit', //value tbc
      options: [
        { label: 'Select', value: 0},
        { label: '1', value: 0.001 },
        { label: '2', value: 0.001 },
        { label: '3', value: 0.001 },
        { label: '4', value: 0.001 },
        { label: '5', value: 0.001 }
      ] },
    { datapt: 'Age group', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'Under 18', value: 0 },
        { label: '18-24', value: 0.36 },
        { label: '25-34', value: 0.11 },
        { label: '35-44', value: 0.12 },
        { label: '45-54', value: 0.27 },
        { label: '55-64', value: 0.05 },
        { label: '64+', value: 0.05 }
      ] },
    { datapt: 'Gender', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'Male', value: 0.15 },
        { label: 'Female', value: 0.14},
        { label: 'Non-binary', value: 0 } //check value
      ] },
    { datapt: 'Ethnicity', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'White', value: 0.19 },
        { label: 'Black', value: 0.57 },
        { label: 'Hispanic', value: 0.01 },
        { label: 'Asian', value: 0.05 },
        { label: 'Native american', value: 0.09 },
        { label: 'Middle eastern', value: 0.62 },
        { label: 'Mixed', value: 0.03 },
        { label: 'Other', value: 0.07 }
      ] },
    { datapt: 'Occupation', //check value
      options: [
        { label: 'Select', value: 0 },
        { label: 'student', value: 0.0660 },
        { label: 'Full-time employed', value: 0.0660 },
        { label: 'Part-time employed', value: 0.0660 },
        { label: 'self-employed', value: 0.0660 },
        { label: 'retired', value: 0.0660 }
      ] },
    { datapt: 'Annual Family Income - GBP', 
      options: [
        { label: 'Select', value: 0 },
        { label: '<10,000', value: 0.1 },
        { label: '10,000 - 19,999', value: 0.03 },
        { label: '20,000 - 29,999', value: 0.04 },
        { label: '30,000 - 39,999', value: 0.07 },
        { label: '40,000 - 49,999', value: 0.02 },
        { label: '50,000 - 59,999', value: 0.03 },
        { label: '60,000 - 69,999', value: 0.05 },
        { label: '70,000 - 79,999', value: 0.05 },
        { label: '80,000 - 99,999', value: 0.05 },
        { label: '100,000 - 119,999', value: 0.04 },
        { label: '120,000 - 149,999', value: 0.33 },
        { label: '>150,000', value: 0.22 }
      ] },
    { datapt: 'Are you pregnant?', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'Yes', value: 0.11 },
        { label: 'No', value: 0 }
      ] },
    { datapt: 'Do you have any children?', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'Yes', value: 0.0313 }, //check
        { label: 'No', value: 0.0313 }
      ] },
    { datapt: 'Do you own a car?', 
      options: [
        { label: 'Select', value: 0 },
        { label: 'Yes', value: 0.0021 },
        { label: 'No', value: 0 }
      ] },

  ]//dropdownData end
  // Create dropdowns with consistent vertical spacing
  dropdownData.forEach((data, index) => {
    const sel = createSelect();
    sel.position(570, 270 + index * 60); // Vertical spacing: 40px
    sel.style('font-size', '24px');
    sel.hide();
    data.options.forEach(opt => sel.option(opt.label)); // Use label for display

    //store the dropdowns in the array
    dropdowns.push({
      datapt: data.datapt,
      options: data.options,
      select: sel,
      y: 270 + index * 60
    });
  });

  // submit button (form)
  submitButton = createButton('SUBMIT');
  submitButton.size(250, 100);
  submitButton.style('font-size', '30px');
  submitButton.position(385, 890);
  // submitButton.center();
  submitButton.mousePressed(handleSubmit);
  submitButton.touchStarted(() => {
    handleSubmit();
    return false; // Prevent default
  });
  submitButton.hide(); // hide initially

  // entry button (home)
  newEntryButton = createButton('NEW ENTRY');
  newEntryButton.size(300, 100);
  newEntryButton.style('font-size', '30px');
  newEntryButton.position(365, 850);
  // newEntryButton.center();
  newEntryButton.mousePressed(showKeyboardPage);
  newEntryButton.touchStarted(() => {
    showKeyboardPage();
    return false; // Prevent default
  });
newEntryButton.show();

  // home button (form)
  backHomeButton = createButton('BACK TO HOME');
  backHomeButton.position(100, 130);
  backHomeButton.touchStarted(() => {
    showHomePage();
    return false; // Prevent default
  });
  backHomeButton.hide(); // hide initially

}//setup end


function touchStarted() {
  // Don't call mousePressed() here - let p5.js handle button touches naturally
  
  // Only handle custom touch logic for keyboard and back buttons
  if (currentPage === 'form') {
    // Check if touch is on the drawn back button
    if (mouseX >= 50 && mouseX <= 150 && mouseY >= 150 && mouseY <= 190) {
      showHomePage();
      return false; // Prevent default
    }
  }
  
  if (currentPage === 'keyboard') {
    // Check back button
    if (mouseX >= 50 && mouseX <= 150 && mouseY >= 150 && mouseY <= 190) {
      showHomePage();
      return false;
    }
    
    // Handle virtual keyboard touches
    handleKeyboardTouch();
    return false; // Prevent default scrolling
  }
  
  // For other pages (like home), don't return false - let p5.js handle button touches
  return true;
}

function handleKeyboardTouch() {
  // Check letter keys
  for (let row = 0; row < keyboardKeys.length; row++) {
    let rowWidth = keyboardKeys[row].length * (keySize + keySpacing) - keySpacing;
    let rowStartX = (width - rowWidth) / 2;
    
    for (let col = 0; col < keyboardKeys[row].length; col++) {
      let x = rowStartX + col * (keySize + keySpacing);
      let y = keyboardStartY + row * (keySize + keySpacing);
      
      if (isMouseOverKey(x, y, keySize, keySize)) {
        addLetter(keyboardKeys[row][col]);
        return;
      }
    }
  }

  // Check special keys
  specialKeys.forEach(key => {
    if (isMouseOverKey(key.x, key.y, key.w, key.h)) {
      handleSpecialKey(key.key);
    }
  });
}


function updateDateTime() {

  d = day();
  m = month();
  y = year();
  h = hour();
  min = minute();

}//dateTime end


function draw() {

  background(220);

  updateDateTime();
  
  //title
  textSize(50);
  textAlign(CENTER);
  textStyle(BOLD);
  noStroke();
  fill(0);
  text('Visitor Logbook', width/2, 100);
  
  stroke(0);
  line(60,140,964,140);

  if (currentPage === 'home') {
    drawHomePage();
  } else if (currentPage === 'keyboard') {
    drawKeyboardPage();
  } else if (currentPage === 'form') {
    drawFormPage();
  } else if (currentPage === 'thankyou'){
   drawThankYouPage();
  }
  
  console.log(sendingValue);


}// draw end


function drawHomePage() {

  newEntryButton.show();
  backHomeButton.hide();
  submitButton.hide();

  textSize(25);
  textAlign(LEFT);
  textStyle(BOLD);
  noStroke();
  text('Recent Visitors: ', 260, 250);

  //show only last 8 visitors
  let maxDisplayed = 8;
  // let maxDisplayed = 1; // for test
  let startIndex = Math.max(0, visitorList.length - maxDisplayed);

  for (let i = startIndex; i < visitorList.length; i ++){
    let entry = visitorList[i];
    let displayIndex = i - startIndex; //for display positioning, so no extra space
    textStyle(NORMAL);
    text(
      `${entry.name} - ${entry.date} ${entry.time}`, 260, 320 + displayIndex * 50
    );
  }

  // more visitors 
  if (visitorList.length > maxDisplayed) {
    let hiddenCount = visitorList.length - maxDisplayed;
    fill(80);
    text(`and ${hiddenCount} more`, 260, 735);
  }

  // no visitors
  if (visitorList.length <= 0) {
    textStyle(NORMAL);
    textAlign(LEFT);
    text("no one's here yet :'(", 260, 400);
  }
  
  fill(0);
  textSize(20);
  textAlign(LEFT);
  // text(`Total Visitors: ${visitorList.length}`, 50, height-80);
  text(`Logbook price: ${overallTotal.toFixed(4)}`, 50, height -50);


}// homepage end

//for the buttons
function showHomePage() {
  
  resetForm();
  currentPage = 'home';
  
  // Hide form elements
  inputs.forEach(item => item.input.hide());
  dropdowns.forEach(item => item.select.hide());
  submitButton.hide();
  backHomeButton.hide();

  // Show home elements
  newEntryButton.show();
  
  // Clear validation errors
  validationErrors.name = false;
  validationErrors.rating = false;

}// showhomepage end


function drawFormPage() {

  newEntryButton.hide();
  backHomeButton.hide();

  // Draw back button
  fill(200);
  noStroke();
  rect(50, 150, 100, 40, 5);
  fill(0);
  textAlign(CENTER);
  textSize(16);
  text('← BACK', 100, 175);

  textSize(25);
  textAlign(LEFT);
  

  // Display input labels and input values
  inputs.forEach(item => {
    if (item.id === 'name' && validationErrors.name){
      fill(255, 0, 0);
    } else{
      fill(0);
    }
    text(item.label + ': ' + item.input.value().substring(0, 28), 200, item.y +25);
  }); //substring to only show the first 28 letters include space

  // Display dropdown labels and selected values
  dropdowns.forEach(item => {
    if (item.datapt === 'Rate your visit' && validationErrors.rating){
      fill(255, 0, 0);
      text('(REQUIRED)', 390, item.y +25);
    } else if (item.datapt === 'Rate your visit'){
      fill(0);
      text('*', 385, item.y +25);
    }
    fill(0);
    text(item.datapt, 200, item.y +25);
    // text(item.datapt + item.select.value(), 100, item.y + 15);
  });

  //display total price of the current record
  // fill(0);
  // let thisTotal = calculateTotalPrice();
  // textSize(18);
  // text('Total Price: ' + thisTotal.toFixed(4), 25, 850);

}// formpage end

function showFormPage() {
  currentPage = 'form';
  
  // Show form elements
  // inputs.forEach(item => item.input.show());
  dropdowns.forEach(item => item.select.show());
  submitButton.show();
  backHomeButton.show();
  
  // Hide home elements
  newEntryButton.hide();

}//showformpage end


function drawKeyboardPage() {
  // Hide all other UI elements
  inputs.forEach(item => item.input.hide());
  dropdowns.forEach(item => item.select.hide());
  submitButton.hide();
  backHomeButton.hide();
  newEntryButton.hide();

  // Draw instruction
  textSize(28);
  textAlign(CENTER);
  noStroke();
  fill(0);
  text('Enter your name:', width/2, 280);
  
  // Draw name display area with cursor
  textSize(32);
  fill(50);
  noStroke();
  rect(200, 300, 624, 60, 10);
  
  fill(255);
  noStroke();
  textAlign(LEFT);
  let displayName = playerName;
  if (frameCount % 60 < 30) { // Blinking cursor
    displayName += '_';
  }
  text(displayName, 220, 343);
  
  // Character count
  textSize(14);
  noStroke();
  fill(100);
  textAlign(RIGHT);
  text(`${playerName.length}/${maxNameLength}`, 870, 355);
  
  // Draw keyboard
  drawVirtualKeyboard();
  
  // Draw back button
  fill(200);
  rect(50, 150, 100, 40, 5);
  fill(0);
  textAlign(CENTER);
  textSize(16);
  text('← BACK', 100, 175);
}

function showKeyboardPage() {
  currentPage = 'keyboard';
  playerName = ''; // Reset name
  
  // Hide all form elements
  inputs.forEach(item => item.input.hide());
  dropdowns.forEach(item => item.select.hide());
  submitButton.hide();
  backHomeButton.hide();
  newEntryButton.hide();
}

function drawVirtualKeyboard() {
  let startX = (width - (keyboardKeys[0].length * (keySize + keySpacing) - keySpacing)) / 2;
  
  // Draw letter keys
  for (let row = 0; row < keyboardKeys.length; row++) {
    let rowWidth = keyboardKeys[row].length * (keySize + keySpacing) - keySpacing;
    let rowStartX = (width - rowWidth) / 2;
    
    for (let col = 0; col < keyboardKeys[row].length; col++) {
      let x = rowStartX + col * (keySize + keySpacing);
      let y = keyboardStartY + row * (keySize + keySpacing);
      
      drawKey(keyboardKeys[row][col], x, y, keySize, keySize);
    }
  }
  
  // Draw special keys (bottom row)
  let specialY = keyboardStartY + keyboardKeys.length * (keySize + keySpacing) + 20;
  
  // Update special key positions
  specialKeys[0].x = width/2 - 100; // SPACE centered
  specialKeys[0].y = specialY;
  
  specialKeys[1].x = width/2 - 250; // Backspace left
  specialKeys[1].y = specialY;
  
  specialKeys[2].x = width/2 + 120; // ENTER right  
  specialKeys[2].y = specialY;
  
  // Draw special keys
  specialKeys.forEach(key => {
    drawKey(key.key, key.x, key.y, key.w, key.h);
  });
}

function drawKey(letter, x, y, w, h) {
  // Key background
  if (isMouseOverKey(x, y, w, h)) {
    fill(180, 200, 255); // Hover color
  } else {
    fill(240);
  }
  
  stroke(0);
  strokeWeight(2);
  rect(x, y, w, h, 8);
  
  // Key text
  fill(0);
  noStroke();
  textAlign(CENTER);
  textSize(letter.length > 1 ? 16 : 24); // Smaller text for special keys
  text(letter, x + w/2, y + h/2 + 8);
}

function isTouchOverKey(x, y, w, h) {
  // Use touches array if available (for multi-touch)
  if (touches && touches.length > 0) {
    let touch = touches[0];
    return touch.x >= x && touch.x <= x + w && touch.y >= y && touch.y <= y + h;
  }
  return false;
}

// Prevent page scrolling/zooming on iPad
function touchMoved() {
  return false;
}

function isMouseOverKey(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}


function addLetter(letter) {
  if (playerName.length < maxNameLength) {
    playerName += letter;
  }
}

function handleSpecialKey(key) {
  switch(key) {
    case 'SPACE':
      if (playerName.length < maxNameLength && playerName.length > 0) {
        playerName += ' ';
      }
      break;
      
    case '←': // Backspace
      if (playerName.length > 0) {
        playerName = playerName.slice(0, -1);
      }
      break;
      
    case 'ENTER':
      if (playerName.trim().length > 0) {
        // Set the name in the original input field
        let nameField = inputs.find(input => input.id === 'name');
        if (nameField) {
          nameField.input.value(playerName.trim());
        }
        showFormPage(); // Go to dropdown form
      }
      break;
  }
}




function drawThankYouPage() {

  newEntryButton.hide();
  backHomeButton.hide();
  submitButton.hide();
  inputs.forEach(item => item.input.hide());
  dropdowns.forEach(item => item.select.hide());

  // Display thank you message
  textSize(40);
  textAlign(CENTER);
  textStyle(BOLD);
  noStroke();
  fill(0, 150, 0);
  text('Thank you for your contribution :)', width/2, height/2 - 100);
  
  textSize(25);
  fill(0);
  noStroke();
  textStyle(NORMAL);
  text('Your submission has been recorded.', width/2, height/2 - 40);

  // Handle timer
  thankYouTimer += 16.67; // Approximately 60 FPS (1000ms/60fps = 16.67ms)
  
  if (thankYouTimer >= 1800) { // seconds
    thankYouTimer = 0;
    showHomePage();
  }
}


function calculateTotalPrice() {
  let sum = 0;
  dropdowns.forEach(item => {
    let selectedLabel = item.select.value();
    let match = item.options.find(opt => opt.label === selectedLabel);
    if (match) {
      sum += match.value;
    }
  });
  return sum;
}//function calculateTotalPrice end


function resetForm(){ //clean form after submit

  inputs.forEach(item => {
    item.input.value('');
  });

  dropdowns.forEach(item => {
    item.select.selected('Select');
  });

  validationErrors.name = false;
  validationErrors.rating = false;

}// resetform end


function handleSubmit(){

  validationErrors.name = false;
  validationErrors.rating = false;

  let nameField = inputs.find(input => input.id === 'name');
  let name = nameField ? nameField.input.value().trim() : '';

  let ratingDropdown = dropdowns.find(d => d.datapt === 'Rate your visit');
  let rating = ratingDropdown ? ratingDropdown.select.value() : '';
  
  let hasErrors = false;
  
  if (name === ''){
    validationErrors.name = true;
    hasErrors = true;
  }

  if (rating === 'Select'){
    validationErrors.rating = true;
    hasErrors = true;
  }

  if (hasErrors){
    // alert('Please provide your name and rate your visit before SUBMITTING :)');
    return;
  }

  let total = calculateTotalPrice();
  overallTotal += total* 0.75; // rough dollar to pound

  let dateStr = `${nf(d, 2)}/${nf(m, 2)}/${y}`;
  let timeStr = `${nf(h, 2)}:${nf(min, 2)}`;

  visitorList.push({
    name: name.substring(0, 28),
    date: dateStr,
    time: timeStr,
    total: total
  });

  sendingValue = overallTotal.toFixed(4);


  sendIfChanged();

  // if (isConnected && socket.readyState === WebSocket.OPEN) {
  //   if (frameCount % 5 === 0) { // Send every 5 frames to avoid spam
  //     socket.send(overallTotal.toFixed(4));
  //     }
  // }

  resetForm();
  
  currentPage = 'thankyou';
  thankYouTimer = 0;
 
}//function handleSubmit end


function sendIfChanged() {
  if (Math.abs(sendingValue - lastSentValue) > 0.01) {
    if (isConnected && socket.readyState === WebSocket.OPEN) {
      socket.send(sendingValue.toString());
      lastSentValue = sendingValue;
    }
  }
}

