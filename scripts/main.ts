import {
  world,
  BlockLocation,
  MinecraftBlockTypes,
  BeforeChatEvent,
  TickEvent,
  Player,
  PlayerJoinEvent,
  BlockInventoryComponent,
  BlockInventoryComponentContainer,
  Container,
  MinecraftItemTypes,
  PistonActivateEvent,
} from "mojang-minecraft";

const overworld = world.getDimension("overworld");

// Set global state
overworld.runCommand("structure load lobby -5 0 -5");
overworld.runCommand("gamerule doDaylightCycle false");
overworld.runCommand("gamerule doMobLoot false");
overworld.runCommand("gamerule doMobSpawning false");
overworld.runCommand("gamerule doWeatherCycle false");
overworld.runCommand("gamerule randomtickspeed 6");
overworld.runCommand("gamerule sendCommandFeedback false");

cleanupGame();

// global variables
let deferredActions = new Array<[() => void, number]>();
let roundRemaingingTime = -1;
let winningPlayerName = "";
let winningScore = 0;

function initializeGame() {
  cleanupGame();

  winningPlayerName = "";
  winningScore = 0;

  // Add the score scoreboard
  try {
    overworld.runCommand('scoreboard objectives add score dummy "Score"');
  } catch (e) {}

  overworld.runCommand("scoreboard players set @a score 0");
  overworld.runCommand("scoreboard objectives setdisplay sidebar score descending");

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

  // eliminate pesky nearby mobs
  try {
    overworld.runCommand("kill @e[type=!player]");
  } catch (e) {}
}

function startGame() {
  initializeGame();

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
    z += 1;
    players[i].runCommand(`tp @s ${x} ${y} ${z} facing ${x} ${y} ${z + 1}`);
  }

  overworld.runCommand("title @a clear");
  overworld.runCommand("title @a title GO!");

  // Set game timer
  roundRemaingingTime = 180;
}

function endGame() {
  // Force round timer to complete so game can be force ended with debug commands
  roundRemaingingTime = -1;

  try {
    overworld.runCommand("tp @a 0 3 0");
  } catch (e) {}

  try {
    overworld.runCommand("title @a clear");
  } catch (e) {}

  if (winningScore > 0) {
    try {
      overworld.runCommand(`title @a subtitle ${winningPlayerName} wins!`);
      overworld.runCommand("title @a title Game Over");
    } catch (e) {}
  } else {
    try {
      overworld.runCommand(`title @a subtitle Nobody scored. What gives?`);
      overworld.runCommand("title @a title Game Over");
    } catch (e) {}
  }

  cleanupGame();
}

function runDeferredActions() {
  for (let i = deferredActions.length - 1; i >= 0; i--) {
    let [lambda, ticks] = deferredActions[i];

    if (ticks-- <= 0) {
      lambda();
      deferredActions.splice(i, 1);
    } else {
      deferredActions[i] = [lambda, ticks];
    }
  }
}

function updateTimeRemaining(tick: number) {
  if (roundRemaingingTime >= 0) {
    // Show the time to all players
    let minutes = Math.floor(roundRemaingingTime / 60);
    let seconds: string = (roundRemaingingTime % 60).toString();
    while (seconds.length < 2) seconds = "0" + seconds;
    overworld.runCommand(`title @a actionbar ${minutes}:${seconds}`);

    // Decrement remaining time
    if (tick % 20 == 0) {
      roundRemaingingTime--;

      // End the game if time has elapsed
      if (roundRemaingingTime < 0) {
        endGame();
      }
    }
  }
}

function updateScore() {
  if (roundRemaingingTime >= 0) {
    let players = world.getPlayers();

    //   Create arena copy for each player
    for (let i = 0; i < players.length; i++) {
      let playerScore = 0;
      let chestBlock = overworld.getBlock(new BlockLocation(13 + 100 * i, 6, 131));

      let chest: BlockInventoryComponentContainer = chestBlock.getComponent("inventory").container;
      for (let j = 0; j < chest.size; j++) {
        let itemStack = chest.getItem(j);
        if (itemStack && itemStack.id == MinecraftItemTypes.wool.getName()) {
          switch (itemStack.data) {
            case 2: // Purple
              playerScore += 5 * itemStack.amount;
              break;
            case 11: // Blue
              playerScore += 3 * itemStack.amount;
              break;
            case 14: // Red
              playerScore += 2 * itemStack.amount;
              break;
            case 15: // Black
              playerScore += 10 * itemStack.amount;
              break;
            default:
              // White & all others
              playerScore += 1 * itemStack.amount;
              break;
          }
        }
      }

      if (playerScore > winningScore) {
        winningScore = playerScore;
        winningPlayerName = players[i].name;
      }

      players[i].runCommand(`scoreboard players set @s score ${playerScore}`);
    }
  }
}

//
// Event handlers
//
function gameTick(event: TickEvent) {
  runDeferredActions();

  updateTimeRemaining(event.currentTick);

  updateScore();
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
  // Teleporting the player must be deferred by 1 tick due to an observability issue.
  let player = event.player;
  deferredActions.push([
    function () {
      player.runCommand("tp @s 0 3 0 facing 0 3 1");
    },
    1,
  ]);

  // Title must be deferred by many ticks due to an observability issue.
  //   This delay is a race condition.  We may need a concept of when a player is fully added.
  deferredActions.push([
    function () {
      player.runCommand("title @s subtitle PhD level games");
      player.runCommand("title @s title Wool");
    },
    60,
  ]);
}
world.events.playerJoin.subscribe(playerJoin);

// We're using a piston activate event to detect a press of the only button
//  in the world, the one to start the game.  We should add a button event.
function pistonActivate(event: PistonActivateEvent) {
  startGame();
}
world.events.pistonActivate.subscribe(pistonActivate);
