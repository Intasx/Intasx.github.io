"use strict";

const GridState = {
    NOTHING: 0,
    PLAYER1_WIN: 1,
    PLAYER2_WIN: 2,
    DRAW: 3
}

const GameState = {
    START: 0,
    PLAYING: 1,
    END: 2,
    RESTART: 3,
    FADE: 4
}

const Difficulty = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3
}

const Special = {
    NOTHING: 0,
    SAME_MARK: 1,
    FAST_GAME: 2,
    ALL_ONE: 3
}

class Game {

    static initGrids() {
        let grids = [];
        let origin1 = vec2(-13.5);
        let size1 = 9;
    
        let origin2 = origin1.copy();
        let size2 = size1/3;
    
        for (let i = 0; i < 91; i++) {
            if (i == 0) {
                grids[i] = new Grid(0, i, origin1, size1, 0.3, new Color);
            } else if (i > 0 && i < 10) {
                let j = i - 1;
                let originX = origin1.x + (size1 * (j % 3));
                let originY = origin1.y + (size1 * Math.trunc(j/3));
                grids[i] = new Grid(1, i, vec2(originX, originY), size2, 0.2, new Color(1, 0, 0, 1));
            } else if (i >= 10 && i < 91) {
                let j = i - 10;
                if (j > 0 && j%9 == 0) {
                    if (j % 27 == 0) {
                        origin2.x = origin1.x;
                    } else {
                        origin2.x = origin2.x + size1;
                        origin2.y = origin2.y - size1;
                    }
                }
                let originX = origin2.x + (size2 * (j % 3));
                let originY = origin2.y + (size2 * Math.trunc(j/3));
                grids[i] = new Grid(2, i, vec2(originX, originY), size2/3, 0.1, new Color(0, 0, 1, 1));
            }
        }
    
        return grids;
    }

    constructor(humanPlayers, selectedDiff, selectedSpecial, firstPlayer=1, player1Victories=0, ties=0, player2Victories=0, oldGrids=[]) {
        if (player1Victories == 0 && ties == 0 && player2Victories == 0) {
            this.state = GameState.START;
            this.sizeSubstract = 9;
            this.grids = Game.initGrids();
        } else {
            this.state = GameState.RESTART;
            this.sizeSubstract = 0;
            this.grids = oldGrids;
        }

        // sound - mp3 is the only extension that IE supports
        // see: https://caniuse.com/?search=audio%20format
        this.player1_placed = loadAudioFile("sfx/player1_placed_piece.mp3");
        this.player2_placed = loadAudioFile("sfx/player2_placed_piece.mp3");
        this.win_sound = loadAudioFile("sfx/winner.mp3");
        this.tie_sound = loadAudioFile("sfx/tie.mp3");
        this.challenge_sound = loadAudioFile("sfx/challenge.mp3");
        this.level_up = loadAudioFile("sfx/level_up.mp3");
        this.level_down = loadAudioFile("sfx/level_down.mp3");

        this.fadeColor = new Color(0, 0.25, 0, 0);

        this.firstPlayer = firstPlayer;
        this.ties = ties;
        this.tiesSet = false;
        this.gameFinished = false;
        
        this.player1 = new Player(1, PlayerPiece());
        this.player1.victories = player1Victories;

        const enemyPiece = (selectedSpecial == Special.SAME_MARK || selectedSpecial == Special.ALL_ONE) ? EnemySamePiece() : EnemyPiece();
        this.player2 = new Player(2, enemyPiece, humanPlayers);
        this.player2.victories = player2Victories;

        this.prevTiles = [];
        this.selectedGrids = [0, -1, -1];
        
        this.newCameraScale = 16;
        this.newCameraPos = vec2(0);
        this.cameraSpeed = 5;

        this.highlightChallenge = new Timer;
        this.winnerMark = new Timer;
        this.comTimer = new Timer;
        this.winnerLine = vec2(-100);
        
        this.winner = {tiles: [], state: GridState.NOTHING};
        this.playerTmp = 0;
        
        this.difficulty = selectedDiff;
        switch (selectedDiff) {
            case Difficulty.EASY:
                this.randInterval = [0, 40];
                this.challengeInterval = [40, 80];
                break;
            case Difficulty.MEDIUM:
                this.randInterval = [0, 10];
                this.challengeInterval = [10, 30];
                break;
            case Difficulty.HARD:
                this.randInterval = [0, 5];
                this.challengeInterval = [5, 6];
                break;
        }
        if (selectedSpecial == Special.FAST_GAME || selectedSpecial == Special.ALL_ONE) {
            this.fastGameTimer = new Timer;
        }

        this.turn = {text: "", color: "#ODO", pos: vec2(10, 60)};
        this.victory = {text: "", color: "#000"};
        this.eventMessage = {text: "", color: "#FF0"};
    }

    static setFirstPlayer(player) {
        player.canPlay = true;
    }

    static drawStrokeText(text, x, y) {
        overlayContext.strokeText(text, x, y);
        overlayContext.fillText(text, x, y);
    }

    getWinner() {
        let grid = this.grids[this.player1.currentGrid];
        let tiles = grid.tiles;
        let result = {tiles: [], state: GridState.NOTHING};
        
        // Horizontal check
        for (let i = 0; i < 9; i+=3) {
            if (tiles[i].equalPiece(tiles[i+1]) && tiles[i].equalPiece(tiles[i+2])) {
                result.tiles = [tiles[i], tiles[i+1], tiles[i+2]];
                result.state = tiles[i].piece.character == "X" ? GridState.PLAYER1_WIN : GridState.PLAYER2_WIN;
                return result;
            }
        }
        
        // Vertical check
        for (let i = 0; i < 3; i++) {
            if (tiles[i].equalPiece(tiles[i+3]) && tiles[i].equalPiece(tiles[i+6])) {
                result.tiles = [tiles[i], tiles[i+3], tiles[i+6]];
                // Here
                result.state = tiles[i].piece.id == -1 ? GridState.PLAYER1_WIN : GridState.PLAYER2_WIN;
                return result;
            }
        }
        
        // Diagonal check
        if (tiles[0].equalPiece(tiles[4]) && tiles[0].equalPiece(tiles[8])) {
            result.tiles = [tiles[0], tiles[4], tiles[8]];
            result.state = tiles[0].piece.id == -1 ? GridState.PLAYER1_WIN : GridState.PLAYER2_WIN;
            return result;
        }
        if (tiles[2].equalPiece(tiles[4]) && tiles[2].equalPiece(tiles[6])) {
            result.tiles = [tiles[2], tiles[4], tiles[6]];
            result.state = tiles[2].piece.id == -1 ? GridState.PLAYER1_WIN : GridState.PLAYER2_WIN;
            return result;
        }

        // Is the grid full?
        for (let i = 0; i < 9; i++) {
            if (tiles[i].piece.character == " ") {
                result.state = GridState.NOTHING;
                return result;
            }
        }
        result.state = GridState.DRAW;
        return result;
    }

    checkWinner() {
        this.winner = this.getWinner();
        this.player1.canPlay = !this.player1.canPlay;
        this.player2.canPlay = !this.player2.canPlay;
        if (this.winner.state != GridState.NOTHING) {
            this.winnerMark.set(1.5);
            if (this.player1.currentLevel == 0) {
                this.state = GameState.END;
            }
            this.playerTmp = this.player1.canPlay ? 1 : 2;
            this.player1.canPlay = false;
            this.player2.canPlay = false;
            if (this.player1.currentLevel == 0) {
                this.turn.text = "";
            }
            switch (this.winner.state) {
                case GridState.PLAYER1_WIN:
                    if (this.player1.currentLevel > 0) {
                        this.eventMessage.text = "Player X won!";
                        this.eventMessage.color = "#0F0";
                    }
                    if (hasSound) {
                        this.win_sound.play();
                    }
                    break;
                case GridState.PLAYER2_WIN:
                    if (this.player1.currentLevel > 0) {
                        this.eventMessage.text = "Player O won!";
                        this.eventMessage.color = "#F00";
                    }
                    if (hasSound) {
                        this.win_sound.play();
                    }
                    break;
                case GridState.DRAW:
                    if (this.player1.currentLevel > 0) {
                        this.eventMessage.text = "Tie game!";
                        this.eventMessage.color = "#FF0";
                    }
                    if (hasSound) {
                        this.tie_sound.play();
                    }
                    break;
            }
        }
    }

    advanceGridLevel() {
        if (hasSound) {
            this.level_up.play();
        }
        this.eventMessage.text = "";
        this.highlightChallenge.unset();
        let currLevel = this.playerTmp == 1 ? this.player1.currentLevel : this.player2.currentLevel;
        let currGrid  = this.playerTmp == 1 ? this.player1.currentGrid : this.player2.currentGrid;
        let currTileI = this.playerTmp == 1 ? this.player1.selectedTileIndex : this.player2.selectedTileIndex;
        let selectedTile = this.grids[this.player2.currentGrid].tiles[currTileI].copy()

        this.selectedGrids[currLevel] = currGrid;

        if (this.playerTmp == 1) {
            this.grids[this.player2.currentGrid].tiles[currTileI].piece.character = " ";
            this.player2.currentGrid  = this.player1.currentGrid;
            this.player2.currentLevel = this.player1.currentLevel;
            this.player1.canPlay = true;
        } else if (this.playerTmp == 2) {
            this.grids[this.player1.currentGrid].tiles[currTileI].piece.character = " ";
            this.player1.currentGrid  = this.player2.currentGrid;
            this.player1.currentLevel = this.player2.currentLevel;
            this.player2.canPlay = true;
        }

        let grid = this.grids[currGrid];
        // Move and zoom the camera to the new grid
        if (selectedTile.index < 3) {
            this.newCameraPos = grid.getTileCenter(7);
            this.newCameraPos.y += 3;
        } else if (selectedTile.index > 5) {
            this.newCameraPos = grid.getTileCenter(1);
            this.newCameraPos.y -= 3;
        } else {
            this.newCameraPos = grid.getTileCenter(4);
        }
        this.newCameraScale = cameraScale + 10 * grid.level;
    }

    backGridLevel() {
        if (hasSound) {
            this.level_down.play();
        }

        if (this.fastGameTimer) {
            this.fastGameTimer.set(2);
        }

        this.winnerMark.unset();
        this.winnerLine = vec2(-100);
        this.eventMessage.text = "";
        const currentLevel = this.player1.currentLevel;
        this.selectedGrids[currentLevel] = -1;
        
        let winnerTile = this.winner.tiles[0] || this.prevTiles[this.player1.currentLevel-1];
        if (winnerTile.piece.character == "X") {
            winnerTile.piece.color = new Color(0, 0.6, 0);
        } else {
            winnerTile.piece.color = new Color(0.6, 0, 0);
        }

        this.winner.tiles = [];

        this.player1.currentLevel--;
        this.player2.currentLevel--;
        this.player1.currentGrid = this.selectedGrids[this.player1.currentLevel];
        this.player2.currentGrid = this.selectedGrids[this.player2.currentLevel];

        let prevTile = this.prevTiles[this.player1.currentLevel];
        if (this.winner.state != GridState.DRAW) {
            prevTile.piece = winnerTile.piece.copy();
        }

        let prevGrid = this.grids[this.selectedGrids[this.player1.currentLevel]];
        prevGrid.tiles[prevTile.index].piece = prevTile.piece.copy();
        this.prevTiles.pop();

        if (this.playerTmp == 1) {
            this.player1.canPlay = true;
        } else {
            this.player2.canPlay = true;
        }
        // if prevTiles[0] is undefined, we are moving to the level zero -> use the central tile
        let prevIndex = (this.prevTiles[0] != undefined) ? this.prevTiles[0].index : 4;
        if (this.player1.currentLevel > 0) {
            if (prevIndex < 3) {
                this.newCameraPos = prevGrid.getTileCenter(7);
                this.newCameraPos.y += 3;
            } else if (prevIndex > 5) {
                this.newCameraPos = prevGrid.getTileCenter(1);
                this.newCameraPos.y -= 3;
            } else {
                this.newCameraPos = prevGrid.getTileCenter(4);
            }
        } else {
            this.newCameraPos = prevGrid.getTileCenter(4);
        }
        this.newCameraScale = cameraScale - 10 * (prevGrid.level+1);
    }

    clearGrid() {
        const piecesCount = this.grids[0].getPiecesCount();
        let tileDone = 0;
        for (let tile of this.grids[0].tiles) {
            if (tile.piece.character == " ") {
                continue;
            } else if (tile.piece.color.a > 0) {
                tile.piece.color.a -= 0.01;
            }
            if (tile.piece.color.a <= 0.01) {
                tileDone++;
            }
            if (tileDone == piecesCount) {
                this.grids = Game.initGrids();
                this.state = GameState.PLAYING;
                Game.setFirstPlayer(this.firstPlayer == 1 ? this.player1 : this.player2);
                return;
            }
        }
    }

    comMovement(randInterval, challengeInterval) {
        let res = turnState.NOTHING;

        if (!this.comTimer.isSet()) {
            this.comTimer.set(0.7);
        }

        if (this.comTimer.isSet() && !this.comTimer.active()) {
            const grid = this.grids[this.player1.currentGrid];
            const count = grid.getPiecesCount();
            let newMove = randInt(9);

            if (this.difficulty == Difficulty.HARD) {
                let randMov = randInt(100);
                if (randMov >= randInterval[0] && randMov < randInterval[1]) {
                    while (grid.tiles[newMove].piece.id > 0) {
                        newMove = randInt(9);
                    }
                } else {
                    newMove = Com.move(grid.getGridNumbers(randInt(100) >= 3));
                }
            } else if (this.difficulty == Difficulty.MEDIUM && (count == 2 || count == 3) && randInt(100) >= 10) {
                console.log("Here!");
                newMove = Com.move(grid.getGridNumbers());
            } else if (count > 1) {
                let randMov = randInt(100);
                console.log("count > 1");
                if (this.player1.currentLevel == 2 || !grid.challengeAvailable(-1)) {
                    console.log("here 1");
                    while (randMov > challengeInterval[0] && randMov < challengeInterval[1]) {
                        randMov = randInt(100);
                    }
                }
                if (randMov >= randInterval[0] && randMov < randInterval[1]) {
                    while (grid.tiles[newMove].piece.id > 0 || (grid.tiles[newMove].piece.id == -1 && grid.tiles[newMove].challenged)) {
                        console.log("randInterval");
                        newMove = randInt(9);
                        console.log(newMove);
                    }
                } else if (this.player1.currentLevel < 2 && randMov >= challengeInterval[0] && randMov < challengeInterval[1] && grid.challengeAvailable(-1)) {
                    console.log("challengeInterval");
                    do {
                        newMove = randInt(9);
                    } while (grid.tiles[newMove].piece.id != -1 && !grid.tiles[newMove].challenged)                                
                } else {
                    console.log("else");
                    newMove = Com.move(grid.getGridNumbers());
                }
            } else {
                while (grid.tiles[newMove].piece.id > 0 || (grid.tiles[newMove].piece.id == -1 && grid.tiles[newMove].challenged)) {
                    console.log("rand");
                    newMove = randInt(9);
                    console.log(newMove);
                }
            }
            res = this.player2.checkSelectedTile(newMove, grid, this.grids, this.prevTiles);
            this.comTimer.unset();
            if (res == turnState.NEW_LEVEL) {
                if (hasSound) {
                    this.challenge_sound.play();
                }
                this.eventMessage.text = "Challenge!";
                this.eventMessage.color = "#FF0";
                this.grids[this.player1.currentGrid].tiles[this.player2.selectedTileIndex].piece.color = new Color(1, 1, 0, 1);
                this.player2.canPlay = false;
                this.playerTmp = 2;
            }
        }
        return res;
    }

    update(State) {
        if (this.state == GameState.RESTART) {
            this.clearGrid();
            return State.GAME;
        } else if (this.state == GameState.FADE) {
            if (this.fadeColor.a < 1) {
                this.fadeColor.a += timeDelta;
                for (let i = 0; i < TILE_COUNT; i++) {
                    this.grids[0].tiles[i].color.a = (1 - this.fadeColor.a);
                }
            } else {
                cameraPos.x = 0;
                cameraPos.y = 0;
                cameraScale = defaultTileSize.x;
                return State.MENU;
            }
            return State.GAME;
        }

        const exitPos = screenToWorld(vec2(mainCanvas.width-140, 45));
        const collButton = Rectangle.collision(exitPos.x, exitPos.y, 4, 4, mousePos.x, mousePos.y);
        if (mouseWasPressed(0) && collButton && this.state == GameState.PLAYING) {
            this.state = GameState.FADE;
            return State.GAME;
        }
        let res = turnState.NOTHING;
        if (this.player1.canPlay) {
            this.turn.text = "Turn: X";
            this.turn.color = "#0D0";

            if (this.fastGameTimer) {
                if (!this.fastGameTimer.isSet()) {
                    this.fastGameTimer.set(2);
                }

                if (!this.fastGameTimer.active()) {
                    if (hasSound) {
                        zzfx(...[1.18,0,897,.01,.01,.4,2,1.87,.2,.9,,,,.7,,.4,,.37,.01,.28]);
                    }
                    res = turnState.CHANGE_TURN;
                    this.fastGameTimer.unset();
                }
            }

            if (mouseWasPressed(0) && res == turnState.NOTHING) {
                res = this.player1.checkPressed(this.grids, this.prevTiles, this.selectedGrids);
                if (res == turnState.NEW_LEVEL) {
                    if (hasSound) {
                        this.challenge_sound.play();
                    }
                    if (this.fastGameTimer) {
                        this.fastGameTimer.unset();
                    }
                    this.eventMessage.text = "Challenge!";
                    this.eventMessage.color = "#FF0";
                    this.grids[this.player2.currentGrid].tiles[this.player1.selectedTileIndex].piece.color = new Color(1, 1, 0, 1);
                    this.player1.canPlay = false;
                    this.playerTmp = 1;
                }
            }
        } else if (this.player2.canPlay) {
            this.turn.text = "Turn: O";
            this.turn.color = "#F00";
            // if player2 is not com
            if (this.player2.isHuman) {
                if (mouseWasPressed(0) && !mouseWasReleased(0)) {
                    res = this.player2.checkPressed(this.grids, this.prevTiles, this.selectedGrids);
                    if (res == turnState.NEW_LEVEL) {
                        if (hasSound) {
                            this.challenge_sound.play();
                        }
                        this.eventMessage.text = "Challenge!";
                        this.eventMessage.color = "#FF0";
                        this.grids[this.player1.currentGrid].tiles[this.player2.selectedTileIndex].piece.color = new Color(1, 1, 0, 1);
                        this.player2.canPlay = false;
                        this.playerTmp = 2;
                    }
                }
            } else {
                res = this.comMovement(this.randInterval, this.challengeInterval);
                if (this.fastGameTimer) {
                    this.fastGameTimer.unset();
                }
            }
        }
    
        if (res == turnState.CHANGE_TURN) {
            this.checkWinner();
        } else if (res == turnState.NEW_LEVEL) {
            this.highlightChallenge.set(1);
        }

        if (!this.player1.canPlay && !this.player2.canPlay && !this.gameFinished) {
            if (this.highlightChallenge.isSet() && !this.highlightChallenge.active()) {
                this.advanceGridLevel();
            }
            if (this.winnerMark.isSet() && !this.winnerMark.active()) {
                //this.winnerLine = vec2(-100);
                if (this.player1.currentLevel == 0) {
                    this.gameFinished = true;
                    if (this.winner.tiles.length == 0 && !this.tiesSet) {
                        this.victory.text = "   Tie game!";
                        this.victory.color = "#FFF";
                        this.ties++;
                        this.tiesSet = true;
                    } else if (this.winner.tiles.length > 0) {
                        if (this.winner.tiles[0].piece.id == -1 && !this.player1.victorySet) {
                            this.player1.victories++;
                            this.player1.victorySet = true;
                            this.victory.text = "Player X won!";
                            this.victory.color = "#0F0";
                        } else if (this.winner.tiles[0].piece.id > 0 && !this.player2.victorySet) {
                            this.player2.victories++;
                            this.victory.text = "Player O won!";
                            this.victory.color = "#F00";
                            this.player2.victorySet = true;
                        }
                    }
                } else {
                    this.backGridLevel();
                    this.checkWinner();
                }
            }
        }
        
        // Camera movement
        if (this.newCameraPos.x != cameraPos.x || this.newCameraPos.y != cameraPos.y) {
            const dif = this.newCameraPos.subtract(cameraPos);
            cameraPos.x += this.cameraSpeed * dif.x * timeDelta;
            cameraPos.y += this.cameraSpeed * dif.y * timeDelta;
            if (Math.abs(cameraPos.x-dif.x) < 0.001) {
                cameraPos.x = this.newCameraPos.x;
            }
            if (Math.abs(cameraPos.y-dif.y) < 0.001) {
                cameraPos.y = this.newCameraPos.y;
            }
        }

        // Camera zoom in/out
        if (this.newCameraScale != cameraScale) {
            const dif = this.newCameraScale - cameraScale;
            cameraScale += this.cameraSpeed * dif * timeDelta;
            if (Math.abs(cameraScale-dif) < 0.001) {
                cameraScale = this.newCameraScale;
            }
        }

        //overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        return State.GAME;
    }

    renderInterface() {
        if (this.state == GameState.FADE) return;

        // Turn: X/O message
        //overlayContext.fillStyle = "rgba(102, 102, 102, 1)";
        //const turnLen = overlayContext.measureText(this.turn.text).width;
        //overlayContext.fillRect(this.turn.pos.x-5, this.turn.pos.y+3, 2.5*turnLen, -60);

        overlayContext.textAlign = "left";
        overlayContext.textBaseline = "bottom";
        overlayContext.font = "3em Cooper Black";
        overlayContext.lineWidth = 5;
        overlayContext.fillStyle = this.turn.color;
        overlayContext.strokeStyle = "#000";
        if (!this.gameFinished) {
            Game.drawStrokeText(this.turn.text, this.turn.pos.x, this.turn.pos.y);
        }

        const pos = vec2(10, mainCanvas.height-5);
        overlayContext.fillStyle = "#666";
        overlayContext.fillRect(0, pos.y-27, overlayCanvas.width, 50);

        // Player 1 score
        overlayContext.font = "20px Cooper";
        overlayContext.fillStyle = "#0F0";
        const player1_txt = "Player X: " + this.player1.victories;
        Game.drawStrokeText(player1_txt, pos.x, pos.y);
        
        // Ties
        const size1 = overlayContext.measureText(player1_txt).width;
        const tie_txt = "Ties: " + this.ties;
        overlayContext.fillStyle = "#FFF";
        Game.drawStrokeText(tie_txt, 15+size1+pos.x, pos.y);

        // Player 2
        const size2 = size1 + overlayContext.measureText(tie_txt).width;
        const player2_txt = "Player O: " + this.player2.victories;
        overlayContext.fillStyle = "#F00";
        Game.drawStrokeText(player2_txt, 35+size2+pos.x, pos.y);

        if (this.player1.canPlay && this.fastGameTimer) {
            overlayContext.font = "40px Cooper";
            if (this.fastGameTimer.getPercent() < 0.5) {
                overlayContext.fillStyle = "#0F0";
            } else if (this.fastGameTimer.getPercent() < 0.8) {
                overlayContext.fillStyle = "#FF0";
            } else {
                overlayContext.fillStyle = "#F00";
            }
            Game.drawStrokeText(this.fastGameTimer.get().toFixed(2), 30, fixedHeight-50);
        }

        if (this.eventMessage.text.length > 0) {
            overlayContext.font = "40px Cooper";
            const eventPos = vec2(mainCanvas.width/2 - 100, mainCanvas.height/2 - 250);
            overlayContext.fillStyle = this.eventMessage.color;
            Game.drawStrokeText(this.eventMessage.text, eventPos.x, eventPos.y);
        }

        if (this.gameFinished) {
            overlayContext.font = "20px Cooper";
            overlayContext.fillStyle = "rgba(10, 10, 10, 0.9)";
            const victory_pos = vec2(mainCanvas.width/2 - 200, mainCanvas.height/2 - 50);
            overlayContext.fillRect(victory_pos.x, victory_pos.y, 400, 100);
            overlayContext.fillStyle = this.victory.color;
            Game.drawStrokeText(this.victory.text, victory_pos.x+130, victory_pos.y+40);
            Game.drawStrokeText("Press anywhere to restart.", victory_pos.x+70, victory_pos.y+70);
        }
    }

    render() {
        if (this.state == GameState.START) {
            this.grids[0].render(this.sizeSubstract);
            this.sizeSubstract -= 5*timeDelta;
            if (this.sizeSubstract <= 0) {
                this.state = GameState.PLAYING;
                Game.setFirstPlayer(this.firstPlayer == 1 ? this.player1 : this.player2);
            }
            return;
        }
        for (let i = 0; i < this.selectedGrids.length; i++) {
            if (this.selectedGrids[i] != -1) {
                this.grids[this.selectedGrids[i]].render();
            }
        }
        if (this.winner.tiles.length > 0) {
            const pos1 = this.winner.tiles[0].getCenter();
            const pos2 = this.winner.tiles[2].getCenter();
            const size = 10 / cameraScale;
            if (this.winnerLine.x == -100 && this.winnerLine.y == -100) {
                this.winnerLine = pos1;
            }
            if (this.winnerLine.x != pos2.x) {
                this.winnerLine.x += (this.winnerLine.x < pos2.x) ? 0.2 : -0.2;
            }
            if (this.winnerLine.y != pos2.y) {
                this.winnerLine.y += (this.winnerLine.y < pos2.y) ? 0.2 : -0.2;
            }
            if (Math.abs(this.winnerLine.x - pos2.x) < 0.5) this.winnerLine.x = pos2.x;
            if (Math.abs(this.winnerLine.y - pos2.y) < 0.5) this.winnerLine.y = pos2.y;
            drawLine(pos1, this.winnerLine, size, new Color(1, 1, 0));
        }

        if (this.state == GameState.FADE) {
            overlayContext.fillStyle = this.fadeColor.rgba();
            overlayContext.fillRect(0, 0, overlayCanvas.width-54, overlayCanvas.height);
        }

        const exitPos = screenToWorld(vec2(mainCanvas.width-100, 25));
        const size = 3 * defaultTileSize.x / cameraScale;
        drawTile(exitPos, vec2(size), 4, defaultTileSize);
    }

}