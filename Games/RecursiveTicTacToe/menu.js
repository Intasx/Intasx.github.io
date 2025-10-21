"use strict";

const normal_color  = new Color(0.4, 0.4, 0.4);
const hovered_color = new Color(0.3, 0.3, 0.3);
const pressed_color = new Color(0.2, 0.2, 0.2);

const GameType = {
    HUMAN: 0,
    COM_EASY: 1,
    COM_MEDIUM: 2,
    COM_HARD: 3
}

const SpecialType = {
    NOTHING: 0,
    SAME_MARK: 1,
    FAST_GAME: 2,
    ALL_ONE: 3
}

const ScreenType = {
    FADE: 0,
    MAIN: 1,
    DIFFICULTY: 2,
    INSTRUCTIONS: 3,
    SPECIAL: 4
    //CREDITS: 5
}

class Menu {

    constructor() {
        // UI buttons
        // The extra spaces are to keep the width of every button the same
        // (centering things is hard)

        // Main menu
        this.singlePlayer = new Button(vec2(-7, 7), " Single Player ", normal_color, hovered_color, pressed_color);
        this.twoPlayers   = new Button(vec2(-7, 2), "  Two  Players ", normal_color, hovered_color, pressed_color);
        this.howToPlay    = new Button(vec2(-7, -3), "  How  to  play ", normal_color, hovered_color, pressed_color);
        this.special      = new Button(vec2(-7, -8), " Special  mode ", normal_color, hovered_color, pressed_color);
        //this.credits      = new Button(vec2(-7, -13), "       Credits        ", normal_color, hovered_color, pressed_color);

        // Difficulty selection
        this.easy   = new Button(vec2(-5, 7), "     Easy    ", normal_color, hovered_color, pressed_color);
        this.medium = new Button(vec2(-5, 2), " Medium ", normal_color, hovered_color, pressed_color);
        this.hard   = new Button(vec2(-5, -3), "    Hard    ", normal_color, hovered_color, pressed_color);
        this.back   = new Button(vec2(-5, -8), "    Back    ", normal_color, hovered_color, pressed_color);

        // Special mode selection
        this.sameMark = new Button(vec2(-23, 7), "Same Mark", normal_color, hovered_color, pressed_color);
        this.fastGame = new Button(vec2(-23, 2), " Fast Game ", normal_color, hovered_color, pressed_color);
        this.allInOne = new Button(vec2(-23, -3), " All in One  ", normal_color, hovered_color, pressed_color);
        this.back_special = new Button(vec2(-23, -8), "       Back      ", normal_color, hovered_color, pressed_color);

        this.back_howTo = new Button(vec2(-21, 16.5), "  Back  ",  normal_color, hovered_color, pressed_color);

        this.screen = ScreenType.MAIN;
        this.gameType = GameType.COM_EASY;
        this.specialType = SpecialType.NOTHING;
        this.fadeColor = new Color(0, 0.25, 0, 0);
    }

    update() {
        switch (this.screen) {
            case ScreenType.FADE:
                if (this.fadeColor.a < 1) {
                    this.fadeColor.a += timeDelta;
                } else {
                    return 1;  // Start game
                }
                break;
            case ScreenType.DIFFICULTY:
                if (this.back.pressed()) {
                    this.screen = ScreenType.MAIN;
                } else if (this.easy.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_EASY;
                } else if (this.medium.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_MEDIUM;
                } else if (this.hard.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_HARD;
                }
                break;
            case ScreenType.INSTRUCTIONS:
                if (this.back_howTo.pressed()) {
                    this.screen = ScreenType.MAIN;
                }
                break;
            case ScreenType.MAIN:
                if (this.singlePlayer.pressed()){
                    this.screen = ScreenType.DIFFICULTY;
                    this.gameType = GameType.COM;
                } else if (this.twoPlayers.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.HUMAN;
                } else if (this.howToPlay.pressed()) {
                    this.screen = ScreenType.INSTRUCTIONS;
                    this.howToPlay.state = ButtonState.NOTHING;
                } else if (this.special.pressed()) {
                    this.screen = ScreenType.SPECIAL;
                    this.special.state = ButtonState.NOTHING;
                }
                break;
            case ScreenType.SPECIAL:
                if (this.sameMark.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_MEDIUM;
                    this.specialType = SpecialType.SAME_MARK;
                } else if (this.fastGame.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_MEDIUM;
                    this.specialType = SpecialType.FAST_GAME;
                } else if (this.allInOne.pressed()) {
                    this.screen = ScreenType.FADE;
                    this.gameType = GameType.COM_MEDIUM;
                    this.specialType = SpecialType.ALL_ONE;
                } else if (this.back_special.pressed()) {
                    this.screen = ScreenType.MAIN;
                }
                break;
        }
        return 0;
    }

    renderTitle() {
        const y = 0.1*Math.sin(realTime);
        drawText("Recursive", vec2(0, 14+y), 3, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("Tic Tac Toe", vec2(0, 11+y), 3, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        overlayContext.drawImage(tileImage, 80, 0, 246, 245, 30, 50, 126, 125);
        overlayContext.drawImage(tileImage, 80+246, 0, 246, 245, 620, 450, 126, 125);
    }

    renderMainMenu() {
        this.singlePlayer.render();
        this.twoPlayers.render();
        this.howToPlay.render();
        this.special.render();
        //this.credits.render();
        //drawText("Made by Intas", vec2(0, -13), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        this.renderTitle();
    }

    renderDifficultySelection() {
        this.easy.render();
        this.medium.render();
        this.hard.render();
        this.back.render();
        this.renderTitle();
    }

    renderHowToPlay() {
        this.back_howTo.render();

        overlayContext.drawImage(tileImage, 572, 0, 73, 72, 470, 290, 73, 72);
        overlayContext.drawImage(tileImage, 645, 0, 73, 72, 620, 290, 73, 72);

        const y = 0.1*Math.sin(realTime);
        drawText("How to play", vec2(0, 16+y), 3, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");

        //drawText("->", vec2(11.3, -1.5), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0), "center", "monospace");

        drawText("Just like regular Tic Tac Toe, the goal is to place your mark in a",   vec2(-0.5, 12),   1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("horizontal, vertical or diagonal row. The twist is that you can   ",   vec2(-0.5, 10.2), 1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("click on your opponent's marks to challenge the spot, in which ",      vec2(-0.5, 8.4),  1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("case, a new grid will be created and a new game will begin.         ", vec2(-0.5, 6.6),  1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("  Whoever wins that game-within-game, wins the challenged spot!",      vec2(-0.5, 4.8),  1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");

        drawText("Some rules to keep in mind:", vec2(-14, 2), 1.5, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");

        drawText("- The marks get darker after they are challenged,", vec2(-12, -1), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("which means they can't be challenged again.", vec2(-12.6, -2.2), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");

        drawText("- In case of a tie, whoever placed first on the", vec2(-13.2, -6), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
        drawText("challenged spot wins.", vec2(-18.3, -7.2), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");

        drawText("- There's a maximum of two levels of recursion.", vec2(-12.3, -13), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
    }

    renderSpecial() {
        this.sameMark.render();
        this.fastGame.render();
        this.allInOne.render();
        this.back_special.render();

        drawText(
            "Both players use the same mark! Rely on your memory to win!  ",
            vec2(5, 6.5), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.4), "center", "Cooper"
        );
        drawText(
            "You have 2 seconds to place your mark or your turn is skipped!",
            vec2(5, 1.5), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.4), "center", "Cooper"
        );
        drawText(
            "All of the previous modes in one! Are you up for the challenge?",
            vec2(5, -3.5), 1, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.4), "center", "Cooper"
        );

        const y = 0.1*Math.sin(realTime);
        drawText("Special mode", vec2(0, 14+y), 3, new Color(1, 1, 1), 0.5, new Color(0, 0, 0, 0.5), "center", "Cooper");
    }

    render() {
        switch (this.screen) {
            case ScreenType.MAIN:
                this.renderMainMenu();
                break;
            case ScreenType.DIFFICULTY:
                this.renderDifficultySelection();
                break;
            case ScreenType.INSTRUCTIONS:
                this.renderHowToPlay();
                break;
            case ScreenType.SPECIAL:
                this.renderSpecial();
                break;
            case ScreenType.FADE:
                if (this.specialType != SpecialType.NOTHING) {
                    this.renderSpecial();
                } else if (this.gameType != GameType.HUMAN) {
                    this.renderDifficultySelection();
                } else {
                    this.renderMainMenu();
                }
                overlayContext.fillStyle = this.fadeColor.rgba();
                overlayContext.fillRect(0, 0, overlayCanvas.width-54, overlayCanvas.height);
        }
        //this.fadeContext.fillStyle = '#040';
        //this.fadeContext.fillRect(0, 0, this.fadeCanvas.width, this.fadeCanvas.height);
    }
}