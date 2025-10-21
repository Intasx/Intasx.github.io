"use strict";

glOverlay = !isChrome; // fix slow rendering when not chrome

const State = {
    MENU: 0,
    GAME: 1,
}
let state = State.MENU;

let hasSound = true;

let game;
let menu;

function gameInit()
{
    fixedWidth = 800;
    fixedHeight = 600;
    menu = new Menu;
    game = new Game;
}

function gameUpdate()
{
   switch (state) {
        case State.MENU:
            state = menu.update();
            
            if (state == State.GAME) {
                game = new Game(menu.gameType == GameType.HUMAN, menu.gameType, menu.specialType);
            }
            break;
        case State.GAME:
            state = game.update(State);
            if (state == State.MENU) {
                menu.screen = ScreenType.MAIN;
                menu.typeGame = GameType.COM;
                menu.specialType = SpecialType.NOTHING;
                menu.fadeColor.a = 0;
            }
            if (game.gameFinished && mouseWasPressed(0)) {
                const newFirstPlayer = (game.firstPlayer == 1) ? 2 : 1;
                const humanGame = menu.gameType == GameType.HUMAN;
                game = new Game(humanGame, menu.gameType, menu.specialType, newFirstPlayer, game.player1.victories, game.ties, game.player2.victories, game.grids);
            }
            break;
    }

    const soundPos = screenToWorld(vec2(mainCanvas.width-60, 60));
    if (mouseWasPressed(0) && Rectangle.collision(soundPos.x, soundPos.y, 16, 16, mousePos.x, mousePos.y)) {
        hasSound = !hasSound;
    }
}

function gameUpdatePost()
{
    // called after physics and objects are updated
    // setup camera and prepare for render
}

function gameRender()
{
    drawRect(vec2(), vec2(mainCanvas.width, mainCanvas.height), new Color(0, 0.25, 0));
    switch (state) {
        case State.MENU:
            menu.render();
            break;
        case State.GAME:
            game.render();
            game.renderInterface();
            break;
    }
    
    const soundPos = screenToWorld(vec2(mainCanvas.width-30, 30));
    const soundTile = hasSound ? 3 : 2;
    const size = 3 * defaultTileSize.x / cameraScale;
    drawTile(soundPos, vec2(size), soundTile, defaultTileSize);

    //game.render();
    //button.render();
    //button2.render();
    //drawTile(vec2(-11.5, -18.6), vec2(2), 0, defaultTileSize, new Color(0, 1, 0));

}

function gameRenderPost()
{
    // called after objects are rendered
    // draw effects or hud that appear above all objects
    // draw to overlay canvas for hud rendering
}

// startup LittleJS with your game functions after the tile image is loaded
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, "tiles.png");