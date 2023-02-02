class Dialog {
    constructor(speaker, lines) {
        this.speaker = speaker;
        this.lines = lines;
        this.index = 0;
        this.currentTextLine = 0;
        this.dialogPlaying = false;
    }

    playDialog() {
        var speakerText = $("#speakerText");
        var dialogText = $("#dialogText");
        var dialogBox = $("#dialogBox");

        if (!this.dialogPlaying) {
            this.dialogPlaying = true;

            speakerText.text(this.speaker);

            if (this.currentTextLine >= this.lines.length) {
                this.currentTextLine = 0;
                dialogBox.slideToggle(function () {
                    dialogText.text("");
                    this.dialogPlaying = false;
                });
            } else {
                dialogText.text("");
                this.showText(this.lines[this.currentTextLine]);
            }
        } else {
            // Skip to end of dialog if playing? Should probably do this in showText
        }
    }

    trigger(text) {
        this.showText(text);
    }

    showText(text) {
        var dialogText = $("#dialogText");

        if (this.index < text.length) {
            dialogText.text(dialogText.text() + text[this.index]);

            this.index++;

            setTimeout(() => this.showText(text), 5);
        } else {
            this.index = 0;

            if (this.currentTextLine < this.lines.length) {
                this.currentTextLine++;
            }

            this.dialogPlaying = false;
        }
    }
}

var freddy01 = new Dialog("Freddy", ["Listen up, I'm Freddy, and I run this rat race.",
    "I got a vision, see, to build a spaceship so big and so beautiful it'll make ya cry.",
    "And I ain't gonna stop until I colonize the whole damn universe, you hear me?",
    "I got the skills, I got the connections, and I got the guts to make this happen.",
    "Any rat stands in my way, they gonna regret it.",
    "This is Freddy's game now, and I'm gonna play it to win. You got that?"
]);

$("#dialogBox").hide();

var dialogButtonTrigger = $("#triggerDialogButton");
dialogButtonTrigger.on("click", function () {
    $("#dialogBox").slideToggle();
    freddy01.playDialog();
})

$("#dialogBox").on("click", function () {
    freddy01.playDialog();
});