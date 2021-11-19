import {
  world,
  BlockLocation,
  MinecraftBlockTypes,
  BeforeChatEvent,
  TickEvent,
  Player,
  PlayerJoinEvent,
} from "mojang-minecraft";

const overworld = world.getDimension("overworld");

// Set global state
overworld.runCommand("structure load lobby -5 0 -5");
overworld.runCommand("setworldspawn 0 3 0");

// global variables
let newPlayersQueue = new Array<Player>();

function initializeGame() {
  // Add the score scoreboard
  try {
    overworld.runCommand('scoreboard objectives add score dummy "Score"');
  } catch (e) {}

  overworld.runCommand("scoreboard players set @a score 0");
  overworld.runCommand("scoreboard objectives setdisplay sidebar score descending");

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
    let z = 100;
    players[i].runCommand(`structure load arena ${x} ${y} ${z}`);

    x += 8;
    y += 1;
    players[i].runCommand(`tp @s ${x} ${y} ${z}`);
  }

  // Set game timer
  // Start decrementing timer
  //

  overworld.runCommand("say Collect Wool!");
}

function endGame() {
  // When the timer hits zero, call this method.
}

//
// Event handlers
//
let firstTick = 0;
function gameTick(event: TickEvent) {
  if (firstTick == 0) firstTick = event.currentTick;

  // Teleport new players to the lobby.  Needed to be defered to end of frame to work, adding a bug for
  for (let i = 0; i < newPlayersQueue.length; i++) {
    let newPlayer = newPlayersQueue[i];
    newPlayer.runCommand("tp @s 0 3 0");
  }
  newPlayersQueue = [];

  if (event.currentTick % 100 == 0) {
    overworld.runCommand(`say Tick ${event.currentTick}`);
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

function playerJoin(event: PlayerJoinEvent) {
  // This must be deferred due to a bug.
  //event.player.runCommand("tp @s 0 3 0");

  newPlayersQueue.push(event.player);
}
world.events.playerJoin.subscribe(playerJoin);
