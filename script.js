document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       SAFE HELPERS
    ========================================================= */

    const root = document.documentElement;

    function cssVar(name, fallback) {
        try {
            const value = getComputedStyle(root)
                .getPropertyValue(name)
                .trim();

            return value || fallback;
        } catch {
            return fallback;
        }
    }


    /* =========================================================
       BUSINESS / SUPPORT
    ========================================================= */

    try {
        const buttons = document.querySelectorAll(
            ".business-button, .support-button"
        );

        buttons.forEach((button) => {
            let resetTimer;

            button.addEventListener("pointerdown", () => {
                clearTimeout(resetTimer);
                button.classList.add("touched");

                resetTimer = setTimeout(() => {
                    button.classList.remove("touched");
                }, 1200);
            });
        });
    } catch (error) {
        console.warn("Business/Support error:", error);
    }


    /* =========================================================
       AUDIO ENGINE
    ========================================================= */

    let audioContext = null;

    function getAudio() {
        try {
            if (!audioContext) {
                const AudioCtx =
                    window.AudioContext ||
                    window.webkitAudioContext;

                if (!AudioCtx) return null;

                audioContext = new AudioCtx();
            }

            if (audioContext.state === "suspended") {
                audioContext.resume().catch(() => {});
            }

            return audioContext;
        } catch {
            return null;
        }
    }

    function beep(
        frequency,
        duration = 0.08,
        volume = 0.06,
        type = "square"
    ) {
        const ctx = getAudio();

        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;

            osc.frequency.setValueAtTime(
                frequency,
                ctx.currentTime
            );

            gain.gain.setValueAtTime(
                volume,
                ctx.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + duration
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(
                ctx.currentTime + duration
            );
        } catch {}
    }

    function burstSound() {
        const ctx = getAudio();

        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";

            osc.frequency.setValueAtTime(
                120,
                ctx.currentTime
            );

            osc.frequency.exponentialRampToValueAtTime(
                35,
                ctx.currentTime + 0.5
            );

            gain.gain.setValueAtTime(
                0.14,
                ctx.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.5
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(
                ctx.currentTime + 0.5
            );
        } catch {}
    }

    function gameOverSound() {
        const ctx = getAudio();

        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "square";

            osc.frequency.setValueAtTime(
                260,
                ctx.currentTime
            );

            osc.frequency.exponentialRampToValueAtTime(
                65,
                ctx.currentTime + 0.45
            );

            gain.gain.setValueAtTime(
                0.09,
                ctx.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.45
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(
                ctx.currentTime + 0.45
            );
        } catch {}
    }


    /* =========================================================
       EMOJI RAIN
    ========================================================= */

    try {
        const rainButton =
            document.querySelector(
                ".emoji-rain-button"
            );

        const letters = [
            "A",
            "H",
            "K",
            "M",
            "Q",
            "Z"
        ];

        let holding = false;
        let completed = false;

        let holdTimer = null;
        let growAnimation = null;

        let bigLetter = null;
        let startTime = 0;


        function makeRain() {
            beep(520, 0.08, 0.07);

            for (let i = 0; i < 30; i++) {
                const particle =
                    document.createElement("span");

                particle.className =
                    "emoji-rain-particle";

                particle.textContent =
                    letters[
                        Math.floor(
                            Math.random() *
                            letters.length
                        )
                    ];

                particle.style.left =
                    Math.random() * 100 + "vw";

                particle.style.fontSize =
                    16 +
                    Math.random() * 18 +
                    "px";

                particle.style.animationDuration =
                    2 +
                    Math.random() * 2.5 +
                    "s";

                particle.style.animationDelay =
                    Math.random() * 0.4 +
                    "s";

                document.body.appendChild(
                    particle
                );

                particle.addEventListener(
                    "animationend",
                    () => particle.remove()
                );
            }
        }


        function megaLetterBurst() {
            for (let i = 0; i < 65; i++) {
                const particle =
                    document.createElement("span");

                particle.className =
                    "mega-letter-particle";

                particle.textContent =
                    letters[
                        Math.floor(
                            Math.random() *
                            letters.length
                        )
                    ];

                particle.style.left =
                    Math.random() * 100 +
                    "vw";

                particle.style.bottom =
                    "-40px";

                particle.style.fontSize =
                    18 +
                    Math.random() * 30 +
                    "px";

                particle.style.setProperty(
                    "--x",
                    (
                        (Math.random() - 0.5) *
                        300
                    ) + "px"
                );

                particle.style.setProperty(
                    "--rotation",
                    (
                        (Math.random() - 0.5) *
                        900
                    ) + "deg"
                );

                particle.style.animationDuration =
                    1.4 +
                    Math.random() * 2 +
                    "s";

                particle.style.animationDelay =
                    Math.random() * 0.3 +
                    "s";

                document.body.appendChild(
                    particle
                );

                particle.addEventListener(
                    "animationend",
                    () => particle.remove()
                );
            }
        }


        function startHold() {
            if (holding) return;

            holding = true;
            completed = false;

            startTime =
                performance.now();

            getAudio();

            bigLetter =
                document.createElement("span");

            bigLetter.className =
                "mega-emoji-letter";

            bigLetter.textContent = "A";

            document.body.appendChild(
                bigLetter
            );


            function grow(now) {
                if (!holding) return;

                const progress =
                    Math.min(
                        (now - startTime) /
                        5000,
                        1
                    );

                const size =
                    30 +
                    progress * 220;

                if (bigLetter) {
                    bigLetter.style.fontSize =
                        size + "px";

                    bigLetter.style.opacity =
                        0.7 +
                        progress * 0.3;
                }

                if (Math.random() < 0.04) {
                    beep(
                        180 +
                        progress * 700,
                        0.06,
                        0.02
                    );
                }

                if (progress < 1) {
                    growAnimation =
                        requestAnimationFrame(
                            grow
                        );
                }
            }


            growAnimation =
                requestAnimationFrame(
                    grow
                );


            holdTimer =
                setTimeout(() => {
                    if (!holding) return;

                    completed = true;
                    holding = false;

                    cancelAnimationFrame(
                        growAnimation
                    );

                    if (bigLetter) {
                        bigLetter.remove();
                        bigLetter = null;
                    }

                    burstSound();
                    megaLetterBurst();
                }, 5000);
        }


        function endHold() {
            if (!holding) return;

            holding = false;

            clearTimeout(holdTimer);

            cancelAnimationFrame(
                growAnimation
            );

            if (bigLetter) {
                bigLetter.remove();
                bigLetter = null;
            }

            if (!completed) {
                beep(
                    180,
                    0.1,
                    0.04
                );
            }
        }


        if (rainButton) {
            rainButton.addEventListener(
                "pointerdown",
                (event) => {
                    event.preventDefault();
                    startHold();
                }
            );

            rainButton.addEventListener(
                "pointerup",
                (event) => {
                    event.preventDefault();

                    if (!completed && holding) {
                        endHold();
                        makeRain();
                    }

                    completed = false;
                }
            );

            rainButton.addEventListener(
                "pointercancel",
                endHold
            );

            rainButton.addEventListener(
                "pointerleave",
                () => {
                    if (holding) {
                        endHold();
                    }
                }
            );
        }

    } catch (error) {
        console.warn("Emoji Rain error:", error);
    }


    /* =========================================================
       PIXEL RUN
       =========================================================
       IMPORTANT:
       The game only starts if #dinoGame and #gameScore exist.
       If they don't exist, the rest of the website still works.
    ========================================================= */

    try {
        const canvas =
            document.getElementById("dinoGame");

        const scoreDisplay =
            document.getElementById("gameScore");

        if (!canvas || !scoreDisplay) {
            console.warn(
                "Pixel Run: #dinoGame or #gameScore not found."
            );

            return;
        }


        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            console.warn(
                "Pixel Run: Canvas 2D is not supported."
            );

            return;
        }


        /* =====================================================
           GAME STATE
        ===================================================== */

        let gameRunning = false;
        let gameOver = false;

        let score = 0;
        let speed = 4;

        let lastTime = 0;

        let lives = 3;
        let invincibleTimer = 0;

        let speedPotionTimer = 0;
        let slowPotionTimer = 0;

        let bossActive = false;
        let bossNumber = 0;

        let bossHP = 0;
        let bossMaxHP = 0;

        let nextBoss = 500;

        let damageFlash = 0;

        let attackButton = null;
        let continueButton = null;


        /* =====================================================
           GAME OBJECTS
        ===================================================== */

        const dino = {
            x: 40,
            y: 0,

            width: 26,
            height: 28,

            velocityY: 0,

            gravity: 0.65,
            jumpPower: -11,

            grounded: true
        };


        const cactus = {
            x: 300,
            y: 0,

            width: 16,
            height: 28
        };


        const crow = {
            x: -100,
            y: 0,

            width: 32,
            height: 18,

            active: false,
            wing: 0
        };


        const potion = {
            x: -100,
            y: 0,

            width: 16,
            height: 21,

            active: false,
            type: null
        };


        /* =====================================================
           CANVAS RESIZE
        ===================================================== */

        function resizeGame() {
            const rect =
                canvas.getBoundingClientRect();

            const width =
                Math.max(
                    1,
                    rect.width
                );

            const height =
                Math.max(
                    1,
                    rect.height
                );

            const dpr =
                Math.min(
                    window.devicePixelRatio ||
                    1,
                    2
                );

            canvas.width =
                Math.round(
                    width * dpr
                );

            canvas.height =
                Math.round(
                    height * dpr
                );

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );
        }


        resizeGame();
        document.addEventListener("dirga-game-toggle", () => { if (!canvas.closest(".pixel-game").hidden) resizeGame(); });

        window.addEventListener(
            "resize",
            resizeGame
        );


        function gameWidth() {
            return canvas.clientWidth ||
                canvas.width;
        }


        function gameHeight() {
            return canvas.clientHeight ||
                canvas.height;
        }


        function groundY() {
            return gameHeight() - 25;
        }


        /* =====================================================
           BOSS UI
        ===================================================== */

        function removeBossUI() {
            const old =
                document.getElementById(
                    "pixelBossUI"
                );

            if (old) {
                old.remove();
            }

            attackButton = null;
            continueButton = null;
        }


        function updateBossUI() {
            const hpText =
                document.getElementById(
                    "pixelBossHPText"
                );

            const hpBar =
                document.getElementById(
                    "pixelBossHPBar"
                );

            if (!hpText || !hpBar) {
                return;
            }

            hpText.textContent =
                "HP " +
                Math.max(
                    0,
                    Math.ceil(bossHP)
                ) +
                " / " +
                bossMaxHP;

            const percentage =
                bossMaxHP > 0
                    ? (bossHP / bossMaxHP) * 100
                    : 0;

            hpBar.style.width =
                Math.max(
                    0,
                    percentage
                ) + "%";
        }


        function createBossUI() {
            removeBossUI();


            const parent =
                canvas.parentElement ||
                document.body;


            const computedPosition =
                getComputedStyle(
                    parent
                ).position;


            if (
                computedPosition ===
                "static"
            ) {
                parent.style.position =
                    "relative";
            }


            const wrapper =
                document.createElement("div");


            wrapper.id =
                "pixelBossUI";


            Object.assign(
                wrapper.style,
                {
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform:
                        "translate(-50%, -50%)",
                    zIndex: "9999",
                    textAlign: "center",
                    fontFamily:
                        '"Pixel", monospace',
                    padding: "18px",
                    border:
                        "2px solid currentColor",
                    background:
                        cssVar(
                            "--background",
                            "#ffffff"
                        ),
                    color:
                        cssVar(
                            "--brown",
                            "#5b4636"
                        ),
                    minWidth: "210px",
                    boxSizing: "border-box"
                }
            );


            const title =
                document.createElement("div");


            title.textContent =
                bossNumber === 1
                    ? "BOSS 1"
                    : "BOSS 2";


            Object.assign(
                title.style,
                {
                    fontSize: "20px",
                    marginBottom: "10px"
                }
            );


            const subtitle =
                document.createElement("div");


            subtitle.textContent =
                bossNumber === 1
                    ? "THE BOSS APPEARED!"
                    : "THE FINAL BOSS APPEARED!";


            Object.assign(
                subtitle.style,
                {
                    fontSize: "8px",
                    marginBottom: "10px"
                }
            );


            const hpText =
                document.createElement("div");


            hpText.id =
                "pixelBossHPText";


            Object.assign(
                hpText.style,
                {
                    fontSize: "10px",
                    marginBottom: "6px"
                }
            );


            const hpOuter =
                document.createElement("div");


            Object.assign(
                hpOuter.style,
                {
                    width: "180px",
                    height: "12px",
                    border:
                        "2px solid currentColor",
                    margin: "0 auto",
                    boxSizing: "border-box"
                }
            );


            const hpBar =
                document.createElement("div");


            hpBar.id =
                "pixelBossHPBar";


            Object.assign(
                hpBar.style,
                {
                    width: "100%",
                    height: "100%",
                    background:
                        "currentColor",
                    transition:
                        "width 0.12s linear"
                }
            );


            hpOuter.appendChild(
                hpBar
            );


            const message =
                document.createElement("div");


            message.id =
                "pixelBossMessage";


            message.textContent =
                "ATTACK THE BOSS!";


            Object.assign(
                message.style,
                {
                    fontSize: "8px",
                    margin:
                        "10px 0"
                }
            );


            attackButton =
                document.createElement("button");


            attackButton.type =
                "button";


            attackButton.textContent =
                "ATTACK";


            Object.assign(
                attackButton.style,
                {
                    fontFamily:
                        '"Pixel", monospace',
                    fontSize: "11px",
                    padding:
                        "9px 18px",
                    cursor: "pointer",
                    touchAction: "manipulation"
                }
            );


            attackButton.addEventListener(
                "click",
                attackBoss
            );


            wrapper.appendChild(title);
            wrapper.appendChild(subtitle);
            wrapper.appendChild(hpText);
            wrapper.appendChild(hpOuter);
            wrapper.appendChild(message);
            wrapper.appendChild(attackButton);


            parent.appendChild(
                wrapper
            );


            updateBossUI();
        }


        /* =====================================================
           BOSS SYSTEM
        ===================================================== */

        function startBoss(number) {
            bossActive = true;
            bossNumber = number;

            gameRunning = false;


            bossMaxHP =
                number === 1
                    ? 20
                    : 45;


            bossHP =
                bossMaxHP;


            beep(
                100,
                0.55,
                0.12,
                "sawtooth"
            );


            setTimeout(() => {
                beep(
                    160,
                    0.3,
                    0.08,
                    "square"
                );
            }, 120);


            createBossUI();
        }


        function attackBoss() {
            if (!bossActive) {
                return;
            }

            if (bossHP <= 0) {
                return;
            }


            let damage;


            if (bossNumber === 1) {
                damage =
                    2 +
                    Math.floor(
                        Math.random() * 3
                    );
            } else {
                damage =
                    1 +
                    Math.floor(
                        Math.random() * 3
                    );
            }


            bossHP -= damage;


            damageFlash = 7;


            beep(
                250 +
                damage * 100,
                0.08,
                0.07
            );


            updateBossUI();


            if (bossHP <= 0) {
                defeatBoss();
            }
        }


        function defeatBoss() {
            bossHP = 0;

            updateBossUI();


            const message =
                document.getElementById(
                    "pixelBossMessage"
                );


            if (message) {
                message.textContent =
                    bossNumber === 1
                        ? "BOSS 1 DEFEATED!"
                        : "BOSS 2 DEFEATED!";
            }


            if (attackButton) {
                attackButton.disabled =
                    true;

                attackButton.style.opacity =
                    "0.45";
            }


            burstSound();


            setTimeout(
                createContinueButton,
                250
            );
        }


        function createContinueButton() {
            if (continueButton) {
                return;
            }


            continueButton =
                document.createElement("button");


            continueButton.type =
                "button";


            continueButton.textContent =
                "CONTINUE";


            Object.assign(
                continueButton.style,
                {
                    display: "block",
                    margin:
                        "10px auto 0",
                    fontFamily:
                        '"Pixel", monospace',
                    fontSize: "10px",
                    padding:
                        "8px 14px",
                    cursor: "pointer",
                    touchAction:
                        "manipulation"
                }
            );


            continueButton.addEventListener(
                "click",
                () => {

                    removeBossUI();

                    bossActive = false;

                    gameRunning = true;


                    if (bossNumber === 1) {
                        nextBoss = 1000;
                    } else {
                        nextBoss =
                            Infinity;
                    }


                    beep(
                        650,
                        0.1,
                        0.06
                    );
                }
            );


            const ui =
                document.getElementById(
                    "pixelBossUI"
                );


            if (ui) {
                ui.appendChild(
                    continueButton
                );
            }
        }


        /* =====================================================
           RESET
        ===================================================== */

        function resetGame() {
            removeBossUI();


            gameRunning = false;
            gameOver = false;


            score = 0;
            speed = 4;


            lastTime = 0;


            lives = 3;


            invincibleTimer = 0;


            speedPotionTimer = 0;
            slowPotionTimer = 0;


            bossActive = false;
            bossNumber = 0;


            bossHP = 0;
            bossMaxHP = 0;


            nextBoss = 500;


            damageFlash = 0;


            dino.y =
                groundY() -
                dino.height;


            dino.velocityY = 0;
            dino.grounded = true;


            cactus.x =
                gameWidth() + 120;


            cactus.width = 16;
            cactus.height = 28;


            cactus.y =
                groundY() -
                cactus.height;


            crow.active = false;
            crow.x =
                gameWidth() + 500;


            potion.active = false;
            potion.type = null;
            potion.x =
                gameWidth() + 800;


            scoreDisplay.textContent =
                "00000";
        }


        /* =====================================================
           JUMP
        ===================================================== */

        function jump() {

            if (gameOver) {
                resetGame();

                gameRunning = true;

                beep(
                    330,
                    0.08,
                    0.04
                );

                return;
            }


            if (bossActive) {
                return;
            }


            if (!gameRunning) {
                gameRunning = true;
            }


            if (dino.grounded) {

                dino.velocityY =
                    dino.jumpPower;

                dino.grounded = false;


                beep(
                    420,
                    0.08,
                    0.045
                );
            }
        }


        /* =====================================================
           DRAW DINO
        ===================================================== */

        function drawDino() {

            const brown =
                cssVar(
                    "--brown",
                    "#5b4636"
                );


            const bg =
                cssVar(
                    "--background",
                    "#ffffff"
                );


            ctx.fillStyle =
                brown;


            const x =
                dino.x;

            const y =
                dino.y;


            ctx.fillRect(
                x,
                y + 10,
                20,
                13
            );


            ctx.fillRect(
                x + 7,
                y,
                15,
                17
            );


            ctx.fillRect(
                x + 20,
                y + 5,
                7,
                6
            );


            ctx.fillRect(
                x + 3,
                y + 21,
                5,
                7
            );


            ctx.fillRect(
                x + 14,
                y + 21,
                5,
                7
            );


            ctx.fillRect(
                x - 5,
                y + 13,
                7,
                5
            );


            ctx.fillStyle =
                bg;


            ctx.fillRect(
                x + 16,
                y + 4,
                3,
                3
            );
        }


        /* =====================================================
           DRAW CACTUS
        ===================================================== */

        function drawCactus() {

            const orange =
                cssVar(
                    "--orange-dark",
                    "#c87941"
                );


            ctx.fillStyle =
                orange;


            const x =
                cactus.x;

            const y =
                cactus.y;


            ctx.fillRect(
                x + 5,
                y,
                6,
                cactus.height
            );


            ctx.fillRect(
                x,
                y + 8,
                5,
                6
            );


            ctx.fillRect(
                x + 11,
                y + 12,
                5,
                6
            );
        }


        /* =====================================================
           DRAW CROW
        ===================================================== */

        function drawCrow() {

            if (!crow.active) {
                return;
            }


            const brown =
                cssVar(
                    "--brown",
                    "#5b4636"
                );


            const bg =
                cssVar(
                    "--background",
                    "#ffffff"
                );


            ctx.fillStyle =
                brown;


            const x =
                crow.x;

            const y =
                crow.y;


            /* BODY */
            ctx.fillRect(
                x + 7,
                y + 6,
                18,
                9
            );


            /* HEAD */
            ctx.fillRect(
                x + 20,
                y + 2,
                8,
                9
            );


            /* BEAK */
            ctx.fillRect(
                x + 28,
                y + 6,
                5,
                3
            );


            /* WING */
            if (
                Math.floor(
                    crow.wing
                ) % 2 === 0
            ) {
                ctx.fillRect(
                    x + 7,
                    y + 1,
                    12,
                    6
                );
            } else {
                ctx.fillRect(
                    x + 7,
                    y + 10,
                    12,
                    6
                );
            }


            /* TAIL */
            ctx.fillRect(
                x + 1,
                y + 5,
                8,
                3
            );


            /* EYE */
            ctx.fillStyle =
                bg;


            ctx.fillRect(
                x + 24,
                y + 4,
                2,
                2
            );
        }


        /* =====================================================
           DRAW POTION
        ===================================================== */

        function drawPotion() {

            if (!potion.active) {
                return;
            }


            const x =
                potion.x;

            const y =
                potion.y;


            let bottleColor;


            if (
                potion.type ===
                "speed"
            ) {
                bottleColor =
                    "#ff9f43";
            } else if (
                potion.type ===
                "slow"
            ) {
                bottleColor =
                    "#6c9cff";
            } else {
                bottleColor =
                    "#ff6b8a";
            }


            ctx.fillStyle =
                bottleColor;


            /* BOTTLE */
            ctx.fillRect(
                x + 3,
                y + 6,
                10,
                14
            );


            /* NECK */
            ctx.fillRect(
                x + 5,
                y + 1,
                6,
                6
            );


            /* CAP */
            ctx.fillRect(
                x + 4,
                y,
                8,
                3
            );


            /* HIGHLIGHT */
            ctx.fillStyle =
                "rgba(255,255,255,0.75)";


            ctx.fillRect(
                x + 5,
                y + 8,
                2,
                5
            );
        }


        /* =====================================================
           DRAW GROUND
        ===================================================== */

        function drawGround() {

            const brown =
                cssVar(
                    "--brown",
                    "#5b4636"
                );


            ctx.fillStyle =
                brown;


            ctx.fillRect(
                0,
                groundY(),
                gameWidth(),
                2
            );
        }


        /* =====================================================
           DRAW LIVES
        ===================================================== */

        function drawLives() {

            const brown =
                cssVar(
                    "--brown",
                    "#5b4636"
                );


            ctx.fillStyle =
                brown;


            ctx.textAlign =
                "left";


            ctx.font =
                '8px "Pixel", monospace';


            ctx.fillText(
                "LIVES: " +
                "♥".repeat(lives),
                8,
                13
            );
        }


        /* =====================================================
           DRAW POTION STATUS
        ===================================================== */

        function drawPotionStatus() {

            const brown =
                cssVar(
                    "--brown",
                    "#5b4636"
                );


            ctx.fillStyle =
                brown;


            ctx.textAlign =
                "right";


            ctx.font =
                '7px "Pixel", monospace';


            let text = "";


            if (
                speedPotionTimer >
                0
            ) {
                text +=
                    "SPEED " +
                    Math.ceil(
                        speedPotionTimer /
                        60
                    ) +
                    "s";
            }


            if (
                slowPotionTimer >
                0
            ) {
                if (text) {
                    text += " | ";
                }

                text +=
                    "SLOW " +
                    Math.ceil(
                        slowPotionTimer /
                        60
                    ) +
                    "s";
            }


            if (text) {
                ctx.fillText(
                    text,
                    gameWidth() - 8,
                    13
                );
            }
        }


        /* =====================================================
           COLLISION
        ===================================================== */

        function overlap(a, b) {
            return (
                a.x <
                b.x + b.width &&

                a.x + a.width >
                b.x &&

                a.y <
                b.y + b.height &&

                a.y + a.height >
                b.y
            );
        }


        function cactusCollision() {

            const hitbox = {
                x:
                    dino.x + 4,

                y:
                    dino.y + 3,

                width:
                    dino.width - 7,

                height:
                    dino.height - 4
            };


            return overlap(
                hitbox,
                cactus
            );
        }


        function crowCollision() {

            if (!crow.active) {
                return false;
            }


            const hitbox = {
                x:
                    dino.x + 3,

                y:
                    dino.y + 3,

                width:
                    dino.width - 5,

                height:
                    dino.height - 5
            };


            return overlap(
                hitbox,
                crow
            );
        }


        function potionCollision() {

            if (!potion.active) {
                return false;
            }


            return overlap(
                dino,
                potion
            );
        }


        /* =====================================================
           PLAYER DAMAGE
        ===================================================== */

        function playerHit() {

            if (
                invincibleTimer >
                0
            ) {
                return;
            }


            lives--;


            invincibleTimer =
                90;


            damageFlash =
                10;


            beep(
                120,
                0.18,
                0.08,
                "sawtooth"
            );


            if (lives <= 0) {

                lives = 0;

                gameOver = true;

                gameRunning = false;

                gameOverSound();
            }
        }


        /* =====================================================
           CROW SPAWN
        ===================================================== */

        function spawnCrow() {

            if (score < 100) {
                return;
            }


            if (crow.active) {
                return;
            }


            /*
             * Chance increases as score increases.
             * It is still limited so the screen doesn't
             * become impossible.
             */

            const difficulty =
                Math.min(
                    Math.floor(
                        score / 100
                    ),
                    12
                );


            const chance =
                0.018 +
                difficulty * 0.003;


            if (
                Math.random() >
                chance
            ) {
                return;
            }


            crow.active = true;


            crow.x =
                gameWidth() + 45;


            const minimumY =
                Math.max(
                    30,
                    groundY() - 95
                );


            const maximumY =
                Math.max(
                    minimumY + 1,
                    groundY() - 38
                );


            crow.y =
                minimumY +
                Math.random() *
                (
                    maximumY -
                    minimumY
                );


            crow.wing = 0;
        }


        /* =====================================================
           POTION SPAWN
        ===================================================== */

        function spawnPotion() {

            if (potion.active) {
                return;
            }


            /*
             * Don't spawn potions before score 100.
             */

            if (score < 100) {
                return;
            }


            if (
                Math.random() >
                0.006
            ) {
                return;
            }


            potion.active = true;


            potion.x =
                gameWidth() + 70;


            potion.y =
                groundY() -
                70 -
                Math.random() *
                50;


            const types = [
                "speed",
                "slow",
                "life"
            ];


            potion.type =
                types[
                    Math.floor(
                        Math.random() *
                        types.length
                    )
                ];
        }


        /* =====================================================
           COLLECT POTION
        ===================================================== */

        function collectPotion() {

            if (
                !potionCollision()
            ) {
                return;
            }


            const collected =
                potion.type;


            potion.active = false;

            potion.type = null;


            if (
                collected ===
                "speed"
            ) {

                speedPotionTimer =
                    60 * 6;


                beep(
                    850,
                    0.12,
                    0.07
                );

            } else if (
                collected ===
                "slow"
            ) {

                slowPotionTimer =
                    60 * 5;


                beep(
                    350,
                    0.12,
                    0.07
                );

            } else {

                lives =
                    Math.min(
                        lives + 1,
                        5
                    );


                beep(
                    1000,
                    0.15,
                    0.08
                );
            }
        }


        /* =====================================================
           BOSS CHECK
        ===================================================== */

        function checkBoss() {

            if (bossActive) {
                return;
            }


            if (
                nextBoss === 500 &&
                score >= 500
            ) {

                score = 500;

                startBoss(1);

                return;
            }


            if (
                nextBoss === 1000 &&
                score >= 1000
            ) {

                score = 1000;

                startBoss(2);
            }
        }


        /* =====================================================
           GAME UPDATE
        ===================================================== */

        function update(delta) {

            if (
                !gameRunning ||
                gameOver ||
                bossActive
            ) {
                return;
            }


            /* DINO PHYSICS */

            dino.velocityY +=
                dino.gravity *
                delta;


            dino.y +=
                dino.velocityY *
                delta;


            const floor =
                groundY() -
                dino.height;


            if (
                dino.y >=
                floor
            ) {

                dino.y =
                    floor;

                dino.velocityY =
                    0;

                dino.grounded =
                    true;
            }


            /* SCORE */

            score +=
                0.08 *
                delta;


            scoreDisplay.textContent =
                String(
                    Math.floor(score)
                ).padStart(
                    5,
                    "0"
                );


            /* DIFFICULTY */

            const difficulty =
                Math.floor(
                    score / 100
                );


            speed =
                4 +
                difficulty *
                0.55;


            /* SPEED POTION */

            if (
                speedPotionTimer >
                0
            ) {

                speedPotionTimer -=
                    delta;


                speed *=
                    1.6;
            }


            /* SLOW POTION */

            if (
                slowPotionTimer >
                0
            ) {

                slowPotionTimer -=
                    delta;


                speed *=
                    0.55;
            }


            /* INVINCIBILITY */

            if (
                invincibleTimer >
                0
            ) {

                invincibleTimer -=
                    delta;
            }


            if (
                damageFlash >
                0
            ) {

                damageFlash -=
                    delta;
            }


            /* =================================================
               CACTUS
            ================================================= */

            cactus.x -=
                speed *
                delta;


            if (
                cactus.x +
                cactus.width <
                0
            ) {

                const minimumGap =
                    Math.max(
                        100,
                        260 -
                        difficulty *
                        12
                    );


                cactus.x =
                    gameWidth() +
                    minimumGap +
                    Math.random() *
                    180;


                cactus.height =
                    22 +
                    Math.random() *
                    15;


                cactus.width =
                    13 +
                    Math.random() *
                    7;


                cactus.y =
                    groundY() -
                    cactus.height;


                beep(
                    700 +
                    Math.min(
                        score,
                        500
                    ),
                    0.045,
                    0.025
                );
            }


            /* =================================================
               CROW
            ================================================= */

            spawnCrow();


            if (
                crow.active
            ) {

                crow.x -=
                    speed *
                    1.15 *
                    delta;


                crow.wing +=
                    0.3 *
                    delta;


                if (
                    crow.x +
                    crow.width <
                    0
                ) {

                    crow.active =
                        false;
                }
            }


            /* =================================================
               POTION
            ================================================= */

            spawnPotion();


            if (
                potion.active
            ) {

                potion.x -=
                    speed *
                    0.8 *
                    delta;


                if (
                    potion.x +
                    potion.width <
                    0
                ) {

                    potion.active =
                        false;

                    potion.type =
                        null;
                }
            }


            /* =================================================
               COLLISIONS
            ================================================= */

            if (
                cactusCollision()
            ) {

                playerHit();

                cactus.x +=
                    80;
            }


            if (
                crowCollision()
            ) {

                playerHit();

                crow.active =
                    false;
            }


            collectPotion();


            /* =================================================
               BOSS
            ================================================= */

            checkBoss();
        }


        /* =====================================================
           DRAW
        ===================================================== */

        function draw() {

            const width =
                gameWidth();

            const height =
                gameHeight();


            ctx.clearRect(
                0,
                0,
                width,
                height
            );


            drawGround();

            drawDino();

            drawCactus();

            drawCrow();

            drawPotion();

            drawLives();

            drawPotionStatus();


            /* DAMAGE FLASH */

            if (
                damageFlash >
                0
            ) {

                ctx.fillStyle =
                    "rgba(255,0,0,0.12)";


                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );
            }


            /* GAME OVER */

            if (
                gameOver
            ) {

                const brown =
                    cssVar(
                        "--brown",
                        "#5b4636"
                    );


                ctx.fillStyle =
                    brown;


                ctx.textAlign =
                    "center";


                ctx.font =
                    '12px "Pixel", monospace';


                ctx.fillText(
                    "GAME OVER",
                    width / 2,
                    55
                );


                ctx.font =
                    '8px "Pixel", monospace';


                ctx.fillText(
                    "TAP TO RESTART",
                    width / 2,
                    75
                );
            }


            /* BOSS BATTLE TEXT */

            if (
                bossActive
            ) {

                const brown =
                    cssVar(
                        "--brown",
                        "#5b4636"
                    );


                ctx.fillStyle =
                    brown;


                ctx.textAlign =
                    "center";


                ctx.font =
                    '10px "Pixel", monospace';


                ctx.fillText(
                    "BOSS BATTLE",
                    width / 2,
                    35
                );
            }
        }


        /* =====================================================
           GAME LOOP
        ===================================================== */

        function gameLoop(timestamp) {
            if (canvas.closest(".pixel-game").hidden) { lastTime=0; requestAnimationFrame(gameLoop); return; }

            if (!lastTime) {
                lastTime =
                    timestamp;
            }


            let delta =
                (
                    timestamp -
                    lastTime
                ) / 16.67;


            delta =
                Math.min(
                    delta,
                    2
                );


            lastTime =
                timestamp;


            update(delta);

            draw();


            requestAnimationFrame(
                gameLoop
            );
        }


        /* =====================================================
           START GAME
        ===================================================== */

        resetGame();

        draw();


        requestAnimationFrame(
            gameLoop
        );


        /* =====================================================
           CONTROLS
        ===================================================== */

        canvas.addEventListener(
            "pointerdown",
            (event) => {

                event.preventDefault();

                jump();
            }
        );


        document.addEventListener(
            "keydown",
            (event) => {
                if (canvas.closest(".pixel-game").hidden) return;

                if (
                    event.code ===
                    "Space" ||
                    event.code ===
                    "ArrowUp"
                ) {

                    event.preventDefault();

                    jump();
                }
            }
        );


        /* =====================================================
           FIRST INTERACTION = AUDIO READY
        ===================================================== */

        canvas.addEventListener(
            "pointerdown",
            () => {
                getAudio();
            },
            {
                once: true
            }
        );

    } catch (error) {

        console.error(
            "Pixel Run failed:",
            error
        );

        /*
         * IMPORTANT:
         * If Pixel Run has an error, other website
         * features are still allowed to continue.
         */
    }

});
