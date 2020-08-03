//canvas van het spel
var canvas = document.getElementById("gameScreen");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//gewenst aantal vlinders
const NR_TARGETS = 20;
//maximale variatie in de grootte van de vlinders
const VARIATIE_SIZE = 50;
//hoe dicht een vlinder bij het net moet zijn
const MARGE_SPELER = -25;
//instellingen voor de vlinder animatie
const SPRITE_WIDTH = 980;
const SPRITE_HEIGHT = 130;
const SPRITE_COL = 14;
const SPRITE_ROW = 2;
//of de vlinders mogen rondvliegen en aan welke snelheid
const ROND_VLIEGEN = 1;
const SNELHEID_VLIEGEN = 2;
//of de vlinders individueel mogen fladderen of allemaal samen
const RANDOM_ANIMATIE_START = 1;

//audio
let hitSound = new Sound("audio/bewegen1_ding.wav", NR_TARGETS);
let winSound = new Sound("audio/bewegen1_gewonnen.wav");

//afbeeldingen
let imgTuin = document.getElementById("img_tuin");
let imgVlinderRoze = document.getElementById("img_vlinder_roze");
let imgVlinderBlauw = document.getElementById("img_vlinder_blauw");
let imgVlinderGroen = document.getElementById("img_vlinder_groen");
let imgNet = document.getElementById("img_net");

//het kadertje op het eindscherm
let eindKader = document.getElementById('endDiv');

//de speler zelf (vangnet)
const player = {
  x:0,
  y:0,
  size : 150,
  score : 0,
  behaaldeTargets : 0
}

//de doelwitten (vlinders)
const vlinderLijst = {};
//een lijst met de verschillende kleuren vlinders
const imgLijst = {};
imgLijst[0] = imgVlinderRoze;
imgLijst[1] = imgVlinderBlauw;
imgLijst[2] = imgVlinderGroen;
//of de speler gewonnen heeft of niet
var gewonnen = 0;
//het verbergen van de speel opnieuw knop
eindKader.style.display= 'none';
//breedte van 1 vlinder positie
var sheetWidth = SPRITE_WIDTH/SPRITE_COL;
//hoogte van 1 vlinder positie
var sheetHeight = SPRITE_HEIGHT/SPRITE_ROW;
//maak de vlinders random aan
makeTargets();
//animatie van de vlinders
var vlinderBeweeg = setInterval(updateFrame, 100);
//de vlinders laten rondvliegen
if(ROND_VLIEGEN){
  var vliegen = setInterval(vlinderVliegen,50);
}
//refresh rate van het scherm
var scherm = setInterval(render, 5);
//hier wordt het interval voor de score daling later in gestoken
var daling;
//controleert de positie van de speler
canvas.addEventListener("mousemove", playerPos);

//maakt een random nummer tussen min en max
function getNumber(min, max) {
  var randomNumber = Math.floor(Math.random() * (max + 1) + min);
  return randomNumber
}

//doet de score elke seconde met 1 dalen
function decreaseScore(){
  for(var i = 0; i<NR_TARGETS; i++)
  {
    if(vlinderLijst[i].value == 1){
      clearInterval(daling);
    }
    vlinderLijst[i].value -= 1;
    console.log("Score decreased");
  }
}

//maakt een vlinder en zet het in de lijst
function Vlinder(id){
  const target = {
    x:0,
    y:0,
    height : 0,
    width : 0,
    kleur : 0,
    status : 1,
    value : 10,
    currentFrame : 0,
    srcX : 0,
    srcY : 0,
    snelX : SNELHEID_VLIEGEN,
    snelY : SNELHEID_VLIEGEN
  }
  vlinderLijst[id] = target;
}

//zorgt dat alle vlinders gemaakt worden en random geplaatst worden
function makeTargets(){
  for(var i = 0; i < NR_TARGETS; i++){
    Vlinder(i);
    //random grootte van de vlinders
    vlinderLijst[i].height = sheetHeight + getNumber(0, VARIATIE_SIZE);
    vlinderLijst[i].width = sheetWidth + getNumber(0, VARIATIE_SIZE);
    //random startlocatie van de vlinders
    vlinderLijst[i].x = getNumber(0, canvas.width-vlinderLijst[i].width);
    vlinderLijst[i].y = getNumber(0, canvas.height-vlinderLijst[i].height);
    //random kleur van de vlinders
    vlinderLijst[i].kleur = getNumber(0,2);
    //random vliegrichting van de vlinders
    vlinderLijst[i].snelX -= 2*SNELHEID_VLIEGEN*getNumber(0,1);
    vlinderLijst[i].snelY -= 2*SNELHEID_VLIEGEN*getNumber(0,1);
    //eventuele random vleugel startposities
    if(RANDOM_ANIMATIE_START){
      vlinderLijst[i].currentFrame = getNumber(0, SPRITE_COL-1);
    }
  }
}

//het eindscherm (wanneer je wint)
function eindScherm(){
  //win geluidje
  winSound.play();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgTuin, 0, 0, canvas.width, canvas.height);
  //achtergrond verduisteren
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 1;
  eindKader.style.display= 'inline';
  document.getElementById("gameScreen").style.cursor="default";
  if(player.score > NR_TARGETS*5){
    document.getElementById("eindTekst").innerHTML="Goed Gedaan!<br> Jouw score is "+player.score;
  }
  else{
    document.getElementById("eindTekst").innerHTML="Goed Gedaan!<br> Blijf zeker oefenen.";
  }
}

//een functie om meerdere audio streams tegelijk af te kunnen spelen
function Sound(src, maxStreams = 1, vol = 1.0){
  this.streamNum = 0;
  this.streams = [];
  for(var i = 0; i < maxStreams; i++){
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }
  this.play = function(){
    this.streamNum = (this.streamNum + 1)% maxStreams;
    this.streams[this.streamNum].play();
  }
}

//update de huidige "vorm" van de vlinder (voor de beweging)
function updateFrame(){
  for(var i = 0; i<NR_TARGETS; i++){
    vlinderLijst[i].currentFrame = ++vlinderLijst[i].currentFrame % SPRITE_COL;
    vlinderLijst[i].srcX = vlinderLijst[i].currentFrame * sheetWidth;
  }
}

//het rondvliegen van de vlinders
function vlinderVliegen(){
  for(var i = 0; i<NR_TARGETS; i++){
    vlinderLijst[i].x += vlinderLijst[i].snelX;
    vlinderLijst[i].y += vlinderLijst[i].snelY;

    //als de vlinder buiten het scherm zou vliegen
    if(vlinderLijst[i].x < -vlinderLijst[i].width/5 || vlinderLijst[i].x > canvas.width-vlinderLijst[i].width/1.25){
      vlinderLijst[i].snelX = -vlinderLijst[i].snelX;
    }
    if(vlinderLijst[i].y < -vlinderLijst[i].height/4 || vlinderLijst[i].y > canvas.height-vlinderLijst[i].height/1.1){
      vlinderLijst[i].snelY = -vlinderLijst[i].snelY;
    }
  }
}

//plaatst alle entiteiten op het scherm
function render(){
  //scherm leegmaken en de tuin tekenen
  ctx.clearRect(0, 0, 800, 600);
  ctx.drawImage(imgTuin, 0, 0, canvas.width, canvas.height);
  //elke vlinder tekenen
  for(var i = 0; i<NR_TARGETS; i++){
    if(vlinderLijst[i].status == 1){
      ctx.drawImage(imgLijst[vlinderLijst[i].kleur], vlinderLijst[i].srcX, vlinderLijst[i].srcY, sheetWidth, sheetHeight, vlinderLijst[i].x, vlinderLijst[i].y, vlinderLijst[i].width, vlinderLijst[i].height);
    }
  }
    //het net tekenen
    ctx.drawImage(imgNet, player.x, player.y, player.size, player.size);
    //wanneer je wint stoppen met het scherm steeds te refreshen en laat het eindscherm zien
    if(gewonnen){
      clearInterval(scherm);
      eindScherm();
    }
}

//wanneer de muis beweegt wordt de locatie van de speler bijgewerkt
function playerPos(muis){
  let rect = canvas.getBoundingClientRect();
  player.y = muis.clientY - rect.top - player.size/2;
  player.x = muis.clientX - rect.left - player.size/2;
  checkRaak();
}

//controleert of het vangnet over een vlinder staat
function checkRaak(){
  //enkel het net van het vangnet telt (+ tolerantie)
  var playerXMin = player.x + player.size/2 - MARGE_SPELER;
  var playerXMax = player.x + player.size + MARGE_SPELER;
  var playerYMin = player.y - MARGE_SPELER;
  var playerYMax = player.y + player.size/2 + MARGE_SPELER;
  for(var i = 0; i<NR_TARGETS; i++){
    if(playerYMin < vlinderLijst[i].y+vlinderLijst[i].height && playerYMax > vlinderLijst[i].y && playerXMin < vlinderLijst[i].x+vlinderLijst[i].width && playerXMax > vlinderLijst[i].x){
      if(vlinderLijst[i].status){
        hitSound.play();
        player.score += vlinderLijst[i].value;
        player.behaaldeTargets += 1;
        vlinderLijst[i].status = 0;
        if(player.behaaldeTargets == 1){
          //de score die wordt verloren per tijdseenheid
          daling = setInterval(decreaseScore, 1000);
        }
        win();
      }
    }
  }
}

//controleert of de speler gewonnen heeft
function win(){
  if(player.behaaldeTargets == NR_TARGETS){
    setTimeout(function(){gewonnen = 1},1000);
    console.log("Gewonnen");
  }
}

//herlaad de pagina
function again()
{
  document.location.reload();
}
