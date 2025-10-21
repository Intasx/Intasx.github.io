"use strict";

const ButtonState = {
    PRESSED: 0,
    HOLDING: 1,
    RELEASED: 2,
    NOTHING: 3
}

class Button {
    constructor(origin, text, color, hoveredColor, pressedColor) {
        this.origin = origin;
        this.text = text;
        this.color = color;
        this.hoveredColor = hoveredColor;
        this.pressedColor = pressedColor;
        this.state = ButtonState.NOTHING;
        this.clicked = loadAudioFile("sfx/player1_placed_piece.mp3");
    }

    pressed() {
        return this.state == ButtonState.RELEASED;
    }

    render() {
        overlayContext.font = "30px Cooper Black";
        const pos = worldToScreen(this.origin);
        const size = overlayContext.measureText(this.text);
        const rectWidth = 12+size.width;
        const rectHeight = 40;

        const mouseColl = Rectangle.collision(pos.x, pos.y-16, rectWidth, rectHeight, mousePosScreen.x, mousePosScreen.y);
        const mouseDown = mouseIsDown(0);
        let color = this.color;
        if (mouseColl) {
            if (mouseDown && (this.state == ButtonState.NOTHING || this.state == ButtonState.RELEASED)) {
                this.state = ButtonState.PRESSED;
            } else if (mouseDown && (this.state == ButtonState.PRESSED)) {
                this.state = ButtonState.HOLDING;
            } else if (!mouseDown && (this.state == ButtonState.PRESSED || this.state == ButtonState.HOLDING)) {
                this.state = ButtonState.RELEASED;
                if (hasSound) {
                    this.clicked.cloneNode().play();
                }
            } else if (!mouseDown && this.state == ButtonState.RELEASED) {
                this.state = ButtonState.NOTHING;
            }
        } else {
            this.state = ButtonState.NOTHING;
        }

        switch (this.state) {
            case ButtonState.NOTHING:
            case ButtonState.RELEASED:
                color = mouseColl ? this.hoveredColor : this.color;
                break;
            case ButtonState.HOLDING:
            case ButtonState.PRESSED:
                color = this.pressedColor;
                break;
        }

        overlayContext.strokeStyle = "#000";
        overlayContext.strokeRect(pos.x-1, pos.y-17, rectWidth+1, rectHeight);
        overlayContext.fillStyle = color.rgba();
        overlayContext.fillRect(pos.x, pos.y-16, rectWidth, rectHeight);
        overlayContext.strokeText(this.text, pos.x+rectWidth/2-(size.width/2)-1, pos.y+14);
        overlayContext.fillStyle = "#FFFFFF";
        overlayContext.fillText(this.text, pos.x+rectWidth/2-(size.width/2), pos.y+15);

    }
}