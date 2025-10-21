"use strict";

class Com {
    
    static checkWinner(grid) {
        const winState = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < 8; i++) {
            const pos0 = grid[winState[i][0]];
            const pos1 = grid[winState[i][1]];
            const pos2 = grid[winState[i][2]];
            if (pos0 != 0 && pos0 == pos1 && pos0 == pos2) {
                return pos2;
            }
        }
        return 0;
    }

    static minimax(grid, player) {
        const winner = Com.checkWinner(grid);
        let move = -1;
        let maxScore = -2;
        if (winner != 0) {
            return winner*player;
        }
        for (let i = 0; i < 9; i++) {
            if (grid[i] == 0) {
                grid[i] = player;
                const score = -this.minimax(grid, -player); // Get the worst position for the other player
                if (score > maxScore) {
                    maxScore = score;
                    move = i;
                }
                grid[i] = 0;
            }
        }
        return (move == -1) ? 0 : maxScore;
    }
    
    static move(grid) {
        let move = -1;
        let maxScore = -2;
        console.log(grid);
        for (let i = 0; i < 9; i++) {
            if (grid[i] == 0) {
                grid[i] = 1;
                const score = -this.minimax(grid, -1);
                grid[i] = 0;
                if (score > maxScore) {
                    maxScore = score;
                    move = i;
                }
            }
        }
        //grid[move] = 1;
        return move;
    }
}