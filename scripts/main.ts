import * as GameTest from "mojang-gametest";
import { world, BlockLocation, MinecraftBlockTypes, BeforeChatEvent, TickEvent } from "mojang-minecraft";

const START_TICK = 100;
const overworld = world.getDimension("overworld");

// global variables
let curTick = 0;

function initializeGame() {
  // Add the score scoreboard
  try {
    overworld.runCommand('scoreboard objectives add score dummy "Score"');
  } catch (e) {}

  overworld.runCommand("scoreboard players set @a score 0");
  overworld.runCommand('scoreboard objectives setdisplay sidebar "Score" descending');

  // eliminate pesky nearby mobs
  try {
    overworld.runCommand("kill @e[type=!player]");
  } catch (e) {}

  // Set up intial inventory
  overworld.runCommand("give @a shears");
}

function cleanupGame() {
  // Remove the scoreboard
  try {
    overworld.runCommand("scoreboard objectives remove score");
  } catch (e) {}

  // Clear player inventory
  try {
    overworld.runCommand("clear @a");
  } catch (e) {}
}

function startGame() {
  // Get count of players
  let players = world.getPlayers();
  let playerCount = players.length;
  if (playerCount > 1) {
    overworld.runCommand(`say Staring game for ${playerCount} players.`);
  } else {
    overworld.runCommand(`say Staring game for ${playerCount} player.`);
  }

  //   Create arena copy for each player
  for (let i = 0; i < playerCount; i++) {
    let x = 100 * i;
    let y = 0;
    let z = 0;
    players[i].runCommand(`structure load Arena ${x} ${y} ${z}`);

    x += 8;
    y += 1;
    players[i].runCommand(`tp @s ${x} ${y} ${z}`);
  }

  //   Teleport each player to their own arena
  // Set game timer
  // Start decrementing timer
  //

  overworld.runCommand("say Collect Wool!");
}

function endGame() {
  // When the timer hits zero, call this method.
}

function gameTick(event: TickEvent) {
  if (event.currentTick % 20 == 0) {
    // Count down 1 second
  }
}
world.events.tick.subscribe(gameTick);

function beforeChat(event: BeforeChatEvent) {
  if (event.message.startsWith("!")) {
    let command = event.message.substring(1);

    switch (command) {
      case "init":
        overworld.runCommand("say Initializing game...");
        initializeGame();
        break;
      case "start":
        startGame();
        break;
      case "end":
        endGame();
        break;
      case "cleanup":
        overworld.runCommand("say Cleaning up game...");
        cleanupGame();
        break;
    }

    event.cancel = true;
  }
}
world.events.beforeChat.subscribe(beforeChat);
