"use strict";

const TILE_COUNT = 9;

class Rectangle
{
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    collisionPoint(x, y) {
        //console.log(this.x, this.y, this.w, this.h, x, y, "??");
        //console.log(x >= this.x, x <= (this.x + this.w), y >= this.y, y <= (this.y + this.h));
        return (x >= this.x && x <= (this.x + this.w) && y >= this.y && y <= (this.y + this.h));
    }

    static collision(x1, y1, w, h, x, y) {
        return (x >= x1 && x <= (x1 + w) && y >= y1 && y <= (y1 + h));
    }
}

class Piece
{
    constructor(character, color, id)
    {
        this.character = character;
        this.color = color;
        this.id = id;
    }

    copy() {
        return new Piece(this.character, this.color, this.id);
    }
}

const EmptyPiece    = () => new Piece(" ", new Color, 0);
const PlayerPiece   = () => new Piece("X", new Color(0, 1, 0), -1);
const EnemyPiece    = () => new Piece("O", new Color(1, 0, 0), 1);
const EnemySamePiece = () => new Piece("X", new Color(0, 1, 0), 2);

class Tile
{
    constructor(index, origin, size, challenged, line_thickness, color, piece) {
        this.index = index;
        this.origin = origin;
        this.size = size;
        this.challenged = challenged;
        this.line_thickness = line_thickness;
        this.color = color;
        this.piece = piece;
    }

    equalPiece(other) {
        if (!(other instanceof Tile)) {
            return false;
        }
        return other.piece.character != " " && other.piece.id == this.piece.id; //other.piece.character == this.piece.character;
    }

    getCenter() {
        return vec2(this.origin.x+(this.size.x/2), this.origin.y+(this.size.y/2));
    }

    copy() {
        return new Tile(this.index, this.origin, this.size, this.challenged, this.line_thickness, this.color, this.piece);
    }
}

class Grid
{
    constructor(level, index, origin, size, line_thickness, color) {
        this.level = level;
        this.index = index;
        this.origin = origin;
        this.tileSize = size;
        this.rect = new Rectangle(this.origin.x, this.origin.y, 3*this.tileSize, 3*this.tileSize);
        this.randLen = [];
        for (let i = 0; i < 6; i++) {
            this.randLen.push(randInt(2));
        }
        this.tiles = [];
        for (let i = 0; i < TILE_COUNT; i++) {
            let x = origin.x + (size * (i % 3));
            let y = origin.y + (size * (Math.trunc(i/3)));
            let challenged = this.level >= 2;
            this.tiles.push(new Tile(i, vec2(x, y), vec2(size), challenged, line_thickness, color, EmptyPiece()));
        }
    }

    getTileCenter(tileIndex) {
        return this.tiles[tileIndex].getCenter();
    }

    getPiecesCount() {
        let count = 0;
        for (const tile of this.tiles) {
            if (tile.piece.character != " ") {
                count++;
            }
        }
        return count;
    }

    getGridNumbers(considerPlayer=true) {
        let grid = [];
        console.log("Consider player:", considerPlayer);
        for (const tile of this.tiles) {
            if (tile.piece.id == -1 && considerPlayer) {
                grid.push(-1);
            } else if (tile.piece.id > 0) {
                grid.push(1);
            } else {
                grid.push(0);
            }
        }
        return grid;
    }

    challengeAvailable(idToSearch) {
        for (const tile of this.tiles) {
            if (tile.piece.id == idToSearch && !tile.challenged) {
                return true;
            }
        }
        return false;
    }

    render(sizeSubstract=0) {
        for (let i = 0; i < TILE_COUNT; i++) {
            let tile = this.tiles[i];
            let bottom_left, bottom_right, top_right;
            if (sizeSubstract > 0) {
                bottom_left  = vec2(tile.origin.x-sizeSubstract*this.randLen[0], tile.origin.y+tile.size.y-sizeSubstract*this.randLen[1]);
                bottom_right = vec2(tile.origin.x+tile.size.x-sizeSubstract*this.randLen[2], tile.origin.y+tile.size.y-sizeSubstract*this.randLen[3]);
                top_right    = vec2(tile.origin.x+tile.size.x-sizeSubstract*this.randLen[4], tile.origin.y-sizeSubstract*this.randLen[5]);
            } else {
                bottom_left  = vec2(tile.origin.x, tile.origin.y+tile.size.y);
                bottom_right = vec2(tile.origin.x+tile.size.x, tile.origin.y+tile.size.y);
                top_right    = vec2(tile.origin.x+tile.size.x, tile.origin.y);
            }

            // Third tile, only draw bottom line, except on the third row
            if (((i + 1) % 3) == 0 && i < 8) {
                drawLine(bottom_left, bottom_right, tile.line_thickness, tile.color);
            } else {
                // Third row: only draw line on the right
                if (i < 6) {
                    drawLine(bottom_left, bottom_right, tile.line_thickness, tile.color);
                }

                // Third tile, third row: don't draw any line
                if (i < 8) {
                    drawLine(bottom_right, top_right, tile.line_thickness, tile.color);
                }
            }
            let center = this.getTileCenter(tile.index);
            if (tile.piece.character != " ") {
                const index = (tile.piece.character == 'X') ? 0 : 1;
                drawTile(center, vec2(this.tileSize-2), index, vec2(16), tile.piece.color);
            }
        }
    }
}
