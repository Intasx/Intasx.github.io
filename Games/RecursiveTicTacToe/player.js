"use strict";

const turnState = {
    NOTHING: -1,
    CHANGE_TURN: 0,
    NEW_LEVEL: 1,
    SKIPPED: 2
}

/*
if (id == 1) {
    this.piece_placed = [,0,283,,,.09,,1.71,,,,,,.4,,,,.83,.06,.1];
} else if (id == 2) {
    this.piece_placed = [,0,500,,,.09,,1.71,,,,,,.4,,,,.83,.06,.1];
}
*/


class Player
{
    constructor(id, piece, isHuman=true) {
        this.id = id;
        this.piece = piece;
        this.canPlay = false;
        this.currentGrid = 0;
        this.currentLevel = 0;
        this.selectedTileIndex = -1;
        this.victories = 0;
        this.victorySet = false;
        if (id == 1) {
            this.piece_placed = loadAudioFile("sfx/player1_placed_piece.mp3");
        } else if (id == 2) {
            this.piece_placed = loadAudioFile("sfx/player2_placed_piece.mp3");
        }
        this.isHuman = isHuman;
        /*if (id == 1) {
            this.piece_placed = [,0,283,,,.09,,1.71,,,,,,.4,,,,.83,.06,.1];
        } else if (id == 2) {
            this.piece_placed = [,0,500,,,.09,,1.71,,,,,,.4,,,,.83,.06,.1];
        }*/
    }

    checkPressed(gridList, prevTiles, selectedGrids) {
        let grid = gridList[this.currentGrid];

        if (!grid.rect.collisionPoint(mousePos.x, mousePos.y)) {
            //console.log("Out of bounds!");
            return -1;
        }

        // Get the x, y in grid coords [0 to 2]
        const gridX = Math.trunc(((mousePos.x - grid.origin.x)/grid.tileSize)) % 3;
        const gridY = Math.trunc(((mousePos.y - grid.origin.y)/grid.tileSize)) % 3;
        let tile = grid.tiles[3*gridY + gridX];
        if (tile.piece.id == this.piece.id) {
            return turnState.NOTHING;
        } else if (tile.piece.character == " ") {
            tile.piece = this.piece.copy();
            this.selectedTileIndex = tile.index;
            if (hasSound) {
                this.piece_placed.cloneNode().play();
            }
            //this.piece_placed.play();
            //zzfx(...this.piece_placed);
            return turnState.CHANGE_TURN;
        } else if (!tile.challenged) {
            tile.challenged = true;
            this.selectedTileIndex = tile.index;

            // Save the challenged tile in case of a draw
            prevTiles[this.currentLevel] = tile.copy();
            switch (tile.piece.id) {
                case 1:
                    prevTiles[this.currentLevel].piece = EnemyPiece();
                    break;
                case -1:
                    prevTiles[this.currentLevel].piece = PlayerPiece();
                    break;
                case 2:
                    prevTiles[this.currentLevel].piece = EnemySamePiece();
                    break;
            }

            // Get the new grid index
            let newGrid = 0;
            if (this.currentLevel == 0) {
                newGrid = tile.index+1;
            } else if (this.currentLevel == 1) {
                let offset1 = 27 * Math.trunc((this.currentGrid-1)/3);
                let offset2 = 9 * ((this.currentGrid-1) % 3);
                newGrid = 1 + 9 + offset1 + offset2 + tile.index;
            }
            this.currentGrid = newGrid;
            //selectedGrids[this.currentLevel+1] = newGrid;
            gridList[newGrid].tiles[tile.index].piece = prevTiles[this.currentLevel].piece.copy();
            this.currentLevel++;
            return turnState.NEW_LEVEL;
        }
        return turnState.NOTHING;
    }

    checkSelectedTile(tileIndex, grid, gridList, prevTiles) {
        let tile = grid.tiles[tileIndex];
        if (tile.piece.character == " ") {
            tile.piece = this.piece.copy();
            this.selectedTileIndex = tile.index;
            if (hasSound) {
                this.piece_placed.cloneNode().play();
            }
            return turnState.CHANGE_TURN;
        } else if (!tile.challenged) {
            tile.challenged = true;
            this.selectedTileIndex = tile.index;

            // Save the challenged tile in case of a draw
            prevTiles[this.currentLevel] = tile.copy();
            switch (tile.piece.id) {
                case 1:
                    prevTiles[this.currentLevel].piece = EnemyPiece();
                    break;
                case -1:
                    prevTiles[this.currentLevel].piece = PlayerPiece();
                    break;
                case 2:
                    prevTiles[this.currentLevel].piece = EnemySamePiece();
                    break;
            }

            // Get the new grid index
            let newGrid = 0;
            if (this.currentLevel == 0) {
                newGrid = tile.index+1;
            } else if (this.currentLevel == 1) {
                let offset1 = 27 * Math.trunc((this.currentGrid-1)/3);
                let offset2 = 9 * ((this.currentGrid-1) % 3);
                newGrid = 1 + 9 + offset1 + offset2 + tile.index;
            }
            this.currentGrid = newGrid;
            //selectedGrids[this.currentLevel+1] = newGrid;
            gridList[newGrid].tiles[tile.index].piece = prevTiles[this.currentLevel].piece.copy();
            this.currentLevel++;
            return turnState.NEW_LEVEL;
        }
    }
}