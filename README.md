# wool

Minecraft Wool Minigame.

# How to use

- Prereqs:

  - Install npm (`winget install OpenJS.NodeJS.LTS` on Windows 11)
  - Install Visual Studio Code (`winget install Microsoft.VisualStudioCode` on Windows 11)
  - Install the Minecraft Windows from the Windows Store
    The preview build can be used, but you'll need to create `config.json` with the following contents:
    ```
    {
     "mcDirectory": "/AppData/Local/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/"
    }
    ```
  - Clone the repository
  - run `npm update` in the repo directory
  - run `npm install -g gulp-cli`

- Each time:

  - Open vs code on the source directory (`code .` in the repo directory on the command line)
  - Make any desired code changes
  - run `gulp`
  - Run without debugging (Ctrl-F5)
  - Run Minecraft, create a new flat world with game test experiment enabled, and apply the Wool behavior pack to it.

- To update type definitions (e.g. newer builds have shipped):

  - run 'npm udpate' in the repo directory
