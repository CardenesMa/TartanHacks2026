// app.js — All game logic, page routing, state management (vanilla JS)
const LOADING_TIME = 2000; // Simulated loading time for processing image and generating mosaic
(function () {
    // ---- Utility: Image processing ----
    function cropAndResize(dataUrl, tw, th, cb) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            var c = document.createElement('canvas'), ctx = c.getContext('2d');
            c.width = tw; c.height = th;
            var sa = img.width / img.height, ta = tw / th;
            var cx, cy, cw, ch;
            if (sa > ta) { ch = img.height; cw = ch * ta; cx = (img.width - cw) / 2; cy = 0; }
            else { cw = img.width; ch = cw / ta; cx = 0; cy = (img.height - ch) / 2; }
            ctx.drawImage(img, cx, cy, cw, ch, 0, 0, tw, th);
            var id = ctx.getImageData(0, 0, tw, th);
            cb({ width: tw, height: th, pixels: id.data });
        };
        img.onerror = function () { cb(null); };
        img.src = dataUrl;
    }

    function getScrambledVersion(cells) {
        var scrambled = cells.map(function (c) {
            return { vertices: c.vertices.map(function (v) { return { x: v.x, y: v.y }; }), color: c.color };
        });
        var n = scrambled.length, swapped = {};
        for (var i = n - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = scrambled[i].color; scrambled[i].color = scrambled[j].color; scrambled[j].color = tmp;
            swapped[i] = true; swapped[j] = true;
        }
        for (var i = 0; i < n; i++) {
            if (!swapped[i]) {
                var j = (i + 1) % n;
                var tmp = scrambled[i].color; scrambled[i].color = scrambled[j].color; scrambled[j].color = tmp;
            }
        }
        return scrambled;
    }

    function checkIfSolved(scrambled, original) {
        for (var i = 0; i < scrambled.length; i++)
            if (scrambled[i].color !== original[i].color) return false;
        return true;
    }

    // ---- Page helpers ----
    var pages = ['home', 'game', 'win'];
    function showPage(id) {
        pages.forEach(function (p) {
            document.getElementById(p).classList.toggle('hidden', p !== id);
        });
    }

    // ---- State ----
    var state = {
        imageData: null,
        difficulty: 'medium',
        originalCells: [],
        scrambledCells: [],
        selectedIndex: null,
        showHint: false,
        gamePhase: 'intro' // intro | playing
    };

    // ---- SVG helpers ----
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function pointsStr(vertices) {
        return vertices.map(function (v) { return v.x + ',' + v.y; }).join(' ');
    }

    function renderOriginal() {
        var svg = document.getElementById('original-svg');
        svg.innerHTML = '';
        state.originalCells.forEach(function (cell) {
            var p = document.createElementNS(SVG_NS, 'polygon');
            p.setAttribute('points', pointsStr(cell.vertices));
            p.setAttribute('fill', cell.color);
            p.setAttribute('stroke', 'none');
            svg.appendChild(p);
        });
    }

    function renderScrambled() {
        var svg = document.getElementById('scrambled-svg');
        svg.innerHTML = '';
        var diff = state.showHint ? state.scrambledCells.map(function (c, i) {
            return c.color !== state.originalCells[i].color;
        }) : [];

        state.scrambledCells.forEach(function (cell, i) {
            var g = document.createElementNS(SVG_NS, 'g');
            g.classList.add('cell-g');
            if (state.gamePhase === 'playing') g.classList.add('interactive');
            if (state.selectedIndex === i) g.classList.add('selected');

            var p = document.createElementNS(SVG_NS, 'polygon');
            p.setAttribute('points', pointsStr(cell.vertices));
            p.setAttribute('fill', cell.color);

            if (state.selectedIndex === i) {
                p.setAttribute('stroke', 'var(--secondary)');
                p.setAttribute('stroke-width', '2');
            } else if (state.showHint && diff[i]) {
                p.setAttribute('stroke', '#FFD700');
                p.setAttribute('stroke-width', '1.5');
                p.style.filter = 'drop-shadow(0 0 4px #FFD700)';
            } else {
                p.setAttribute('stroke', 'none');
            }

            p.addEventListener('click', function () {
                if (state.gamePhase === 'playing') handleCellClick(i);
            });

            g.appendChild(p);
            svg.appendChild(g);
        });
    }

    // ---- Game logic ----
    function handleCellClick(index) {
        state.showHint = false;
        if (state.selectedIndex === null) {
            state.selectedIndex = index;
        } else if (state.selectedIndex === index) {
            state.selectedIndex = null;
        } else {
            // swap
            var a = state.selectedIndex, b = index;
            var tmp = state.scrambledCells[a].color;
            state.scrambledCells[a].color = state.scrambledCells[b].color;
            state.scrambledCells[b].color = tmp;
            state.selectedIndex = null;

            if (checkIfSolved(state.scrambledCells, state.originalCells)) {
                renderScrambled();
                setTimeout(showWin, 500);
                return;
            }
        }
        renderScrambled();
    }

    function toggleHint() {
        state.showHint = !state.showHint;
        document.getElementById('hint-btn').textContent = (state.showHint ? 'Hide' : 'Show') + ' Differences';
        renderScrambled();
    }

    // ---- Intro animation sequence ----
    function runIntro() {
        var origWrap = document.getElementById('original-wrap');
        var scramWrap = document.getElementById('scrambled-wrap');
        var hintBtn = document.getElementById('hint-btn');

        origWrap.style.display = 'none';
        scramWrap.style.display = 'none';
        hintBtn.classList.add('hidden');

        renderOriginal();

        // Step 1: show original with pop
        setTimeout(function () {
            origWrap.style.display = '';
            origWrap.classList.add('pop-in');
        }, 100);

        // Step 2: glide up
        setTimeout(function () {
            origWrap.classList.add('glide-up');
        }, 800);

        // Step 3: show scrambled, fade in tiles
        var n = state.scrambledCells.length;
        setTimeout(function () {
            scramWrap.style.display = '';
            scramWrap.classList.add('fade-in');
            renderScrambled();

            // Animate opacity per polygon
            var svg = document.getElementById('scrambled-svg');
            var gs = svg.querySelectorAll('.cell-g');
            gs.forEach(function (g, i) {
                var poly = g.querySelector('polygon');
                poly.style.opacity = '0';
                poly.style.transition = 'opacity 0.3s ease ' + (i * 15) + 'ms';
                requestAnimationFrame(function () { poly.style.opacity = '1'; });
            });
        }, 1500);

        // Step 4: transition to playing
        setTimeout(function () {
            state.gamePhase = 'playing';
            hintBtn.classList.remove('hidden');
            renderScrambled();
        }, 1500 + n * 15 + 500);
    }

    // ---- Win ----
    function showWin() {
        showPage('win');
        createConfetti();
    }

    function createConfetti() {
        var colors = ['#5E3023', '#F3E9DC', '#FFD700', '#C08552'];
        var container = document.getElementById('confetti');
        container.innerHTML = '';
        for (var i = 0; i < 50; i++) {
            var d = document.createElement('div');
            d.className = 'confetti';
            d.style.left = (Math.random() * 100) + '%';
            d.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            d.style.animationDelay = (Math.random() * 3) + 's';
            d.style.animationDuration = (2 + Math.random() * 2) + 's';
            container.appendChild(d);
            (function (el) { setTimeout(function () { el.remove(); }, 5000); })(d);
        }
    }

    function handleDownload() {
        var canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 600;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        state.originalCells.forEach(function (cell) {
            ctx.fillStyle = cell.color;
            ctx.beginPath();
            cell.vertices.forEach(function (v, i) {
                if (i === 0) ctx.moveTo(v.x * 3, v.y * 3); else ctx.lineTo(v.x * 3, v.y * 3);
            });
            ctx.closePath();
            ctx.fill();
        });
        canvas.toBlob(function (blob) {
            if (!blob) return;
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'mosaic-puzzle.png'; a.click();
            URL.revokeObjectURL(url);
        });
    }

    // ---- Start game from home page ----
    function startGame(difficulty) {
        state.difficulty = difficulty;
        state.selectedIndex = null;
        state.showHint = false;
        state.gamePhase = 'intro';

        // show loading screen
        document.getElementById('loading').style.display = 'flex';

        cropAndResize(state.imageData, 200, 200, function (processed) {
            if (!processed) { showPage('home'); return; }

            var size = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 200 : 50;
            state.originalCells = MosaicGen.generateVoronoiMosaic(processed, size);
            state.scrambledCells = getScrambledVersion(state.originalCells);

            setTimeout(function () {
                document.getElementById('loading').style.display = 'none';
                showPage('game');
                runIntro();
            }, LOADING_TIME);
        });
    }

    // ---- Wire up DOM events ----
    function init() {
        var fileInput = document.getElementById('file-input');
        var uploadArea = document.getElementById('upload-area');
        var previewArea = document.getElementById('preview-area');
        var previewImg = document.getElementById('preview-img');
        var changeBtn = document.getElementById('change-btn');
        var btnEasy = document.getElementById('btn-easy');
        var btnMedium = document.getElementById('btn-medium');
        var btnHard = document.getElementById('btn-hard');
        var hintBtn = document.getElementById('hint-btn');
        var downloadBtn = document.getElementById('download-btn');
        var playAgainBtn = document.getElementById('play-again-btn');

        function setImage(dataUrl) {
            state.imageData = dataUrl;
            previewImg.src = dataUrl;
            uploadArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
            btnEasy.disabled = false;
            btnMedium.disabled = false;
            btnHard.disabled = false;
        }

        function clearImage() {
            state.imageData = null;
            fileInput.value = '';
            uploadArea.classList.remove('hidden');
            previewArea.classList.add('hidden');
            btnEasy.disabled = true;
            btnMedium.disabled = true;
            btnHard.disabled = true;
        }

        fileInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () { setImage(reader.result); };
            reader.readAsDataURL(file);
        });

        changeBtn.addEventListener('click', clearImage);
        btnEasy.addEventListener('click', function () { startGame('easy'); });
        btnMedium.addEventListener('click', function () { startGame('medium'); });
        btnHard.addEventListener('click', function () { startGame('hard'); });
        hintBtn.addEventListener('click', toggleHint);
        downloadBtn.addEventListener('click', handleDownload);
        playAgainBtn.addEventListener('click', function () { showPage('home'); });

        showPage('home');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
