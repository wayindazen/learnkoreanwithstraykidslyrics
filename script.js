// ==========================================
// === ТВОИ ОРИГИНАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
// ==========================================
let grammarData = {};
let allSongsData = [];
let currentSongId = "";
let currentSongObject = null; // ДОБАВИЛ: Глобальная переменная для квиза
let userAnswers = [];
let debugAnswerCount = 0;
let debugNextCount = 0;
let questionAnswered = false;


// === 1. ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    currentSongId = params.get("id");
    if (!currentSongId) {
        console.warn("No song ID found in URL.");
    }
    loadData();
    initQuizEvents(); 
    initSearch();
    
    // 1. Находим элементы
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobileMenu'); // Проверь ID в HTML!
    const mobileClose = document.querySelector('.mobile-menu-close');
    
    // 2. Если кнопка и меню существуют — вешаем событие "КЛИК"
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Чтобы клик не ушел дальше
            mobileMenu.classList.toggle('active');
            console.log("Toggle clicked!"); // Для проверки в консоли
        });
    }

    // 3. Если есть крестик закрытия — вешаем закрытие
    if (mobileClose && mobileMenu) {
        mobileClose.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
        });
    }

    // 4. Закрываем меню, если кликнули на пункт меню (Quiz или Grammar)
    const menuItems = document.querySelectorAll('.mobile-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if(mobileMenu) mobileMenu.classList.remove('active');
        });
    });
});

  function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (!menu) return; // безопасно выходим, если элемента нет
  menu.classList.toggle("active");
}
// === 2. ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    try {
        // Timestamp чтобы избежать кеширования
        allSongsData = await fetch("songs.json?" + Date.now()).then(r => r.json());
        grammarData = await fetch("grammar.json?" + Date.now()).then(r => r.json());
        
        let currentSong = currentSongId
            ? allSongsData.find(s => s.id === currentSongId)
            : allSongsData[0];

        if (currentSong) {
            renderSong(currentSong);
        } else {
            const el = document.getElementById("song-title");
            if(el) el.textContent = "Song not found 😢";
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

// === 3. ОТРИСОВКА ПЕСНИ ===
function renderSong(song) {
    currentSongId = song.id;
    currentSongObject = song; // ВАЖНО: Сохраняем для квиза

    document.getElementById("song-title").textContent = song.title;
    const artistEl = document.getElementById("artist-name") || document.getElementById("song-artist");
    if (artistEl) artistEl.textContent = song.artist || "";
    const albumEl = document.getElementById("album-name") || document.getElementById("song-album");
    if (albumEl) albumEl.textContent = song.album || "";
    const coverImg = document.getElementById("album-cover");
    if (coverImg) {
        coverImg.src = song.cover || "";
        coverImg.style.display = song.cover ? "block" : "none";
    }
    // === YOUTUBE ===
    const linkBtn = document.getElementById("song-link");
    if (linkBtn) {
        if (song.youtube && song.youtube.trim() !== "") {
            linkBtn.href = song.youtube;
            linkBtn.style.display = "inline";
        } else {
            linkBtn.style.display = "none";
        }
    }
    // === LYRICS ===
    const lyricsContainer = document.getElementById("lyrics") || document.getElementById("lyrics-container");
    if (!lyricsContainer) return;
    lyricsContainer.innerHTML = "";
    
    song.lines.forEach((line, lineIdx) => {
        if (line.type === "accordion") {
            const details = document.createElement("details");
            details.className = "english-accordion";
            details.innerHTML = `
                <summary>English Verse (Click to read)</summary>
                <div class="accordion-content">${line.content}</div>
            `;
            lyricsContainer.appendChild(details);
            return;
        }

        const blockDiv = document.createElement("div");
        const lineDiv = document.createElement("div");

        lineDiv.className = "line";
        lineDiv.id = `line-${song.id}-${lineIdx}`;

        if (line.segments) {
            line.segments.forEach((seg, index) => {
                if (seg.type === "english") {
                    const eng = document.createElement("span");
                    eng.className = "english-inline";
                    eng.textContent = seg.text;
                    lineDiv.appendChild(eng);
                    return;
                }
                if (seg.type === "text") {
                    lineDiv.appendChild(document.createTextNode(seg.text));
                    return;
                }
                const span = document.createElement("span");
                span.className = `segment ${seg.type}`;
                span.textContent = seg.text;
                span.onclick = e => createSticker(seg.id, seg.type, e);
                lineDiv.appendChild(span);

                const next = line.segments[index + 1];
                if (next && next.type === "lexicon") {
                    lineDiv.appendChild(document.createTextNode(" "));
                }
            });
        }
        blockDiv.appendChild(lineDiv);

        if (line.translation) {
            const tr = document.createElement("div");
            tr.className = "translation";
            tr.textContent = line.translation;
            blockDiv.appendChild(tr);
        }
        lyricsContainer.appendChild(blockDiv);
    });
}

// === 4. СТИКЕРЫ ===
window.createSticker = function(id, type, event) {
    const data = grammarData[id];
    if (!data) return;
    const board = document.getElementById("sticker-board");
    if (!board) return;

    const sticker = document.createElement("div");
    sticker.style.zIndex = 400;
    // Логика цветов (как была раньше)
    if (data.types && data.types.length === 2) {
        const t1 = data.types[0];
        const t2 = data.types[1];
        if (t1 === "lexicon" && t2 === "grammar") {
            sticker.className = "sticker sticker-split";
        } else if (t1 === "grammar" && t2 === "grammar") {
            sticker.className = "sticker sticker-pink";
        } else {
            sticker.className = "sticker sticker-green";
        }
    } else {
        const colorClass = (type === "grammar") ? "sticker-pink" : "sticker-green";
        sticker.className = `sticker ${colorClass}`;
    }
    sticker.innerHTML = `
        <span class="close-sticker" onclick="this.parentElement.remove()">✖</span> 
        <h3 style="cursor:help; border-bottom:1px dotted #000; display:inline-block;" onclick="showContext('${id}', event)"> ${data.word || id} </h3> 
        ${(data.meanings || []).map(m => `<p>${m}</p>`).join("")}
    `;
    
    // ПРАВКА ДЛЯ КВИЗА: Если нет event.pageY (вызов из квиза), берем дефолт
    const pageY = event.pageY || 300; 
    
    const randomY = (Math.random() * 20) - 10;
    let topPos = pageY - 50 + randomY;
    if (topPos < 10) topPos = 10;
    sticker.style.top = `${topPos}px`;
    
    // Логика сторон
    let isLexiconStart = (data.types) ? data.types[0] === "lexicon" : type === "lexicon";
    if (isLexiconStart) {
        const randomLeft = 4 + Math.random() * 2;
        sticker.style.left = `${randomLeft}%`;
    } else {
        const randomLeft = 52 + Math.random() * 2;
        sticker.style.left = `${randomLeft}%`;
    }
    board.appendChild(sticker);
    makeDraggable(sticker);
};



// === 5. CROSS-LYRICS ===
window.showContext = function(targetId, event) {
    event.stopPropagation();
    closeContext(); // Закрываем старое
    const bubble = document.createElement("div");
    bubble.id = "context-bubble";
    // 1. Собираем ID и его "родителей"
    let idsToSearch = [targetId];
    for (let key in grammarData) {
        const item = grammarData[key];
        if (item.contains && item.contains.includes(targetId)) {
            idsToSearch.push(key);
        }
    }
    
    let resultsHTML = `<span class="close-ctx" onclick="closeContext()">✖</span> <div class="ctx-header">Cross-Lyrics Examples</div>`;
    let totalFoundCount = 0;
    // 2. Ищем по ВСЕМ песням
    allSongsData.forEach(song => {
        let songMatchesHTML = "";
        song.lines.forEach((line, lineIdx) => {
            if (!line.segments) return;
            const hasMatch = line.segments.some(s => idsToSearch.includes(s.id));
            if (hasMatch) {
                totalFoundCount++;
                let lineTextHTML = "";
                line.segments.forEach((s, index) => {
                    if (idsToSearch.includes(s.id)) {
                        lineTextHTML += `<span class="highlight-match">${s.text}</span>`;
                    } else {
                        lineTextHTML += s.text;
                    }
                    const next = line.segments[index + 1];
                    if (next && (next.type === "lexicon" || next.type === "english") && s.id !== "gap") {
                        lineTextHTML += " ";
                    }
                });
                // Добавляем строку
                songMatchesHTML += `
                    <div class="ctx-item" onclick="scrollToLineIfPresent('${song.id}', ${lineIdx})">
                        <div class="ctx-line-text">${lineTextHTML}</div>
                    </div>
                `;
            }
        });
        if (songMatchesHTML !== "") {
            resultsHTML += `
                <div class="ctx-song-group">
                    <div class="ctx-song-title">🎵 ${song.title}</div>
                    ${songMatchesHTML}
                </div>
            `;
        }
    });
    if (totalFoundCount === 0) {
        resultsHTML += `<div style="padding:10px;">No usages found.<br><small>ID: ${targetId}</small></div>`;
    }
    bubble.innerHTML = resultsHTML;
    document.body.appendChild(bubble);
    // Позиционируем окно
    const x = event.pageX;
    const y = event.pageY;
    let leftPos = x - 320;
    if (leftPos < 10) leftPos = 10;
    bubble.style.left = leftPos + "px";
    bubble.style.top = (y - 20) + "px";
    setTimeout(() => {
        document.addEventListener('click', closeBubbleOutside);
    }, 0);
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
window.closeContext = function() {
    const bubble = document.getElementById("context-bubble");
    if (bubble) {
        bubble.remove();
    }
    document.removeEventListener('click', closeBubbleOutside);
};
function closeBubbleOutside(e) {
    const bubble = document.getElementById("context-bubble");
    if (bubble && !bubble.contains(e.target)) {
        closeContext();
    }
}
// Переход к строке
window.scrollToLineIfPresent = function(songId, lineIdx) {
    if (currentSongId === songId) {
        const element = document.getElementById(`line-${songId}-${lineIdx}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.style.background = "#333";
            setTimeout(() => { element.style.background = "transparent"; }, 1000);
        }
    } else {
        if(confirm("This line is in another song. Go to that song?")) {
            window.location.href = `song.html?id=${songId}`; 
        }
    }
};

/* ========================================================= */
/* ===  ЛОГИКА КВИЗА (ДОБАВЛЕНО ВНИЗУ, НЕ ТРОГАЯ ВЕРХ)   === */
/* ========================================================= */

let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let currentQuizMode = 'words';
let isGlobalQuiz = false; // Флаг: true если запущен с главной, false если с песни

function initQuizEvents() {
    // 1. Кнопка на странице песни (Локальный квиз)
    const openBtn = document.querySelector('.quiz-button');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            isGlobalQuiz = false; // Включаем режим песни (со стикерами)
            openQuizWindow();
        });
    }

    // 2. Кнопка на главной странице (Глобальный квиз)
    const globalBtn = document.getElementById('start-global-quiz');
    if (globalBtn) {
        globalBtn.addEventListener('click', () => {
            isGlobalQuiz = true; // Включаем глобальный режим (без стикеров)
            openQuizWindow();
        });
    }

    // Закрытие квиза
    const closeGlobal = document.getElementById('quiz-global-close');
    if (closeGlobal) closeGlobal.addEventListener('click', () => {
        document.getElementById('quiz-overlay').classList.add('hidden');
        const toggle = document.getElementById('mobile-menu-toggle');
        if (toggle) toggle.classList.remove('hidden');
    });

    // Переключение режимов
    const modeButtons = document.querySelectorAll('.quiz-mode');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentQuizMode = btn.getAttribute('data-mode');
        });
    });

    // Кнопка СТАРТ внутри квиза
    const startBtn = document.getElementById('btn-start-quiz');
    if (startBtn) startBtn.addEventListener('click', startQuizAlgorithm);

    // Кнопка ДАЛЕЕ
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) nextBtn.addEventListener('click', goToNextQuestion);

    // Ввод ответа (клик)
    const inputSubmit = document.getElementById('quiz-input-submit');
    if (inputSubmit) inputSubmit.addEventListener('click', handleInputAnswer);

    // Ввод ответа (Enter)
    const inputField = document.getElementById('quiz-input-field');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleInputAnswer();
        });
    }

    // Закрытие результатов
    const closeRes = document.getElementById('quiz-result-close');
    if (closeRes) closeRes.addEventListener('click', () => {
        document.getElementById('quiz-overlay').classList.add('hidden');
        const toggle = document.getElementById('mobile-menu-toggle');
        if (toggle) toggle.classList.remove('hidden');
    });
}

function openQuizWindow() {
    document.getElementById('quiz-overlay').classList.remove('hidden');
    document.getElementById('quiz-start-screen').classList.remove('hidden');
    document.getElementById('quiz-game-screen').classList.add('hidden');
    document.getElementById('quiz-result-screen').classList.add('hidden');

    // --- НОВОЕ: Скрываем кнопку меню на телефоне ---
    const toggle = document.getElementById('mobile-menu-toggle');
    if (toggle) toggle.classList.add('hidden');

}

function startQuizAlgorithm() {
    // Чистим стикеры (если они есть)
    const stickers = document.querySelectorAll('.sticker');
    stickers.forEach(s => s.remove()); 

    let pool = [];

    // === ЛОГИКА ВЫБОРА: ПЕСНЯ ИЛИ ВСЯ БАЗА ===
    if (isGlobalQuiz) {
        // Если база еще не загрузилась
        if (!grammarData || Object.keys(grammarData).length === 0) {
            alert("Database is loading... please wait a second."); return;
        }
        pool = createGlobalPool(grammarData);
    } else {
        // Локальный режим: нужна песня
        if (!currentSongObject) return;
        pool = createPoolFromSong(currentSongObject, grammarData);
    }

    // Проверка, хватит ли слов
    if (pool.length < 8) { 
        alert("Not enough words found for this mode! (Need at least 8)"); 
        return; 
    }

    currentQuizQuestions = generateQuestions(pool, grammarData);
    currentQuestionIndex = 0;
    quizScore = 0;

    document.getElementById('quiz-start-screen').classList.add('hidden');
    document.getElementById('quiz-game-screen').classList.remove('hidden');
    renderQuestion();
}

// === НОВАЯ ФУНКЦИЯ: Сбор слов из всей базы ===
function createGlobalPool(db) {
    let items = [];
    Object.keys(db).forEach(key => {
        const item = db[key];
        const entry = { id: key, ...item }; // Добавляем ID внутрь
        
        const isLex = item.category === 'lexicon';
        const isGram = item.category === 'grammar';
        
        if (currentQuizMode === 'words' && isLex) items.push(entry);
        else if (currentQuizMode === 'grammar' && isGram) items.push(entry);
        else if (currentQuizMode === 'mixed' && (isLex || isGram)) items.push(entry);
    });
    console.log("GLOBAL POOL SIZE:", items.length);
    return items;
}

function createPoolFromSong(song, db) {
    let items = [];
    song.lines.forEach(line => {
        if (!line.segments) return;
        line.segments.forEach(seg => {
            if (seg.id && db[seg.id]) {
                const dbItem = db[seg.id];
                const isLex = dbItem.category === 'lexicon';
                const isGram = dbItem.category === 'grammar';
                
                if (currentQuizMode === 'words' && isLex) items.push({ id: seg.id, ...dbItem });
                else if (currentQuizMode === 'grammar' && isGram) items.push({ id: seg.id, ...dbItem });
                else if (currentQuizMode === 'mixed' && (isLex || isGram)) items.push({ id: seg.id, ...dbItem });
            }
        });
    });
    const unique = [];
    const map = new Map();
    items.forEach(item => {
        if(!map.has(item.id)) { map.set(item.id, true); unique.push(item); }
    });
    console.log("QUIZ SONG:", song.id);
    return unique;
}

function generateQuestions(pool, db) {
    const questions = [];
    const count = 8;
    const shuffled = pool.sort(() => 0.5 - Math.random());

    for (let i = 0; i < count; i++) {
        let target = shuffled[i % shuffled.length];

        // --- Логика режима grammar ---
        if (currentQuizMode === 'grammar') {
            const direction = Math.random() < 0.5 ? 'en_kr' : 'kr_en';
            const distractors = Object.values(db)
                .filter(x => x.category === 'grammar' && x.word !== target.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 5);
            
            questions.push({
                type: 'mc',
                target: target,
                direction: direction,
                options: [target, ...distractors].sort(() => 0.5 - Math.random())
            });
            continue;
        }

        // --- Логика режимов words / mixed ---
        const isLastTwo = i >= 6; // 7 и 8 вопросы

        if (isLastTwo) {
            // Input, только лексика
            const lexPool = pool.filter(x => x.category === 'lexicon');
            if (lexPool.length === 0) continue;
            target = lexPool[Math.floor(Math.random() * lexPool.length)];

            questions.push({
                type: 'input',
                target: target,
                direction: 'en_kr' // всегда вопрос англ → ответ кор
            });
        } else {
            // MC вопросы
            let categoryFilter = [];
            if (currentQuizMode === 'words') categoryFilter = ['lexicon'];
            else if (currentQuizMode === 'mixed') categoryFilter = ['lexicon', 'grammar'];

            // Если target не подходит по категории, берем случайный из подходящей категории
            if (!categoryFilter.includes(target.category)) {
                const filteredPool = pool.filter(x => categoryFilter.includes(x.category));
                if (filteredPool.length > 0) target = filteredPool[Math.floor(Math.random() * filteredPool.length)];
            }

            const direction = Math.random() < 0.5 ? 'en_kr' : 'kr_en';
            const distractors = Object.values(db)
                .filter(x => categoryFilter.includes(x.category) && x.word !== target.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 5);

            questions.push({
                type: 'mc',
                target: target,
                direction: direction,
                options: [target, ...distractors].sort(() => 0.5 - Math.random())
            });
        }
    }

    return questions;
}

function renderQuestion() {
    questionAnswered = false;
    const q = currentQuizQuestions[currentQuestionIndex];
    const textField = document.getElementById('quiz-question-text');
    const optionsCont = document.getElementById('quiz-options-container');
    const inputCont = document.getElementById('quiz-input-container');
    const nextBtn = document.getElementById('quiz-next-btn');
    const inputField = document.getElementById('quiz-input-field');

nextBtn.classList.remove('hidden');
    nextBtn.style.display = 'block';
    
    optionsCont.classList.add('hidden');
    inputCont.style.display = 'none';
    
    inputField.className = 'quiz-input';
    inputField.value = '';
    
    

    // ВАЖНО: Используем innerHTML вместо textContent
    if (q.type === 'mc') {
        optionsCont.classList.remove('hidden');
        optionsCont.style.display = 'grid';
        
        if (q.direction === 'en_kr') textField.innerHTML = q.target.meanings.join(', ');
        else textField.innerHTML = q.target.word;

        optionsCont.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'quiz-answer';
            
            // ВАЖНО: innerHTML для вариантов ответа
            if (q.direction === 'en_kr') btn.innerHTML = opt.word;
            else btn.innerHTML = opt.meanings.join(', ');
            
            btn.onclick = () => handleMCAnswer(btn, opt, q.target);
            optionsCont.appendChild(btn);
        });
    } else {
        inputCont.style.display = 'flex';
        // ВАЖНО: innerHTML для вопроса
        textField.innerHTML = q.target.meanings.join(', ');
        setTimeout(() => inputField.focus(), 100);
    }
}

function handleMCAnswer(btn, selected, correct) {
    if (questionAnswered) return;
questionAnswered = true;
  debugAnswerCount++;
console.log("ANSWER CLICK:", debugAnswerCount, " | currentQuestionIndex =", currentQuestionIndex);
    const nextBtn = document.getElementById('quiz-next-btn');
    

    if (selected.word === correct.word) {
        btn.style.border = "2px solid #00ff00";
        quizScore++;
    } else {

    // выбранный неправильный — красная рамка
    btn.style.border = "2px solid #ff0000";

    // остальные затемняем + правильный делаем зелёным
    Array.from(btn.parentElement.children).forEach(child => {
        if (
            child.textContent === correct.word || 
            child.textContent === correct.meanings.join(', ')
        ) {
            child.style.border = "2px solid #00ff00";
        } 
        else if (child !== btn) {
            child.style.opacity = "0.3";
        }
    });
}

// Создаем стикер ТОЛЬКО если это режим песни (не глобальный)
    if (!isGlobalQuiz) {
        createSticker(correct.id, correct.category, { pageY: 0 });
    }
    nextBtn.classList.remove('hidden');
}

function handleInputAnswer() {
    if (questionAnswered) return;
questionAnswered = true;
    const nextBtn = document.getElementById('quiz-next-btn');
    

    const field = document.getElementById('quiz-input-field');
    const q = currentQuizQuestions[currentQuestionIndex];
    const userVal = field.value.replace(/\s/g, '').toLowerCase();
    // разбиваем правильный ответ по / и чистим каждый вариант
const corrVariants = q.target.word
    .split('/')
    .map(v => v.replace(/\s/g, '').toLowerCase());

// проверяем: совпал ли пользовательский ввод с любым вариантом
if (corrVariants.includes(userVal)) {
        field.classList.add('correct');
        quizScore++;
    } else {
        field.classList.add('wrong');
    }
// Создаем стикер ТОЛЬКО если это режим песни
    if (!isGlobalQuiz) {
        createSticker(q.target.id, q.target.category, { pageY: 0 });
    }
    nextBtn.classList.remove('hidden');
}

function goToNextQuestion() {
  debugNextCount++;
console.log("NEXT CLICK:", debugNextCount, " | currentQuestionIndex BEFORE =", currentQuestionIndex);
    // Убираем все стикеры
    document.querySelectorAll('.sticker').forEach(s => s.remove());

    // Идём к следующему вопросу
    currentQuestionIndex++;
console.log("INDEX AFTER =", currentQuestionIndex);
    // Если вопросов больше нет — показываем результаты
    if (currentQuestionIndex >= currentQuizQuestions.length) {
        showResults();
    } else {
        renderQuestion();
    }
}


function showResults() {

    document.getElementById('quiz-game-screen').classList.add('hidden');
    document.getElementById('quiz-result-screen').classList.remove('hidden');

    // счёт
    document.getElementById('quiz-final-score').textContent = `${quizScore} / 8`;

    // случайная картинка
    const img = document.getElementById('quiz-result-img');
    const randomNum = Math.floor(Math.random() * 4) + 1;
    img.src = `images/quizresults/${randomNum}.png`;

    // цитата по баллам
    let quote = "";

    if (quizScore <= 2) {
        quote = "천천히 달려도 괜찮아~\n(Stray Kids ‘My Pace’)";
    } 
    else if (quizScore <= 4) {
        quote = "넌 잘 하고 있어!\n(Stray Kids ‘Grow Up’)";
    } 
    else if (quizScore <= 6) {
        quote = "Mountain! Mountains! I’m walking on the Mountains!\n(Stray Kids ‘Mountains’)";
    } 
    else {
        quote = "We did it! 소리 질려 와 Ceremony!!!~\n(Stray Kids ‘Ceremony’)";
    }

    document.getElementById('quiz-result-quote').textContent = quote;
}

/*conjugation*/
// ======== Портянка ========
const rulesContent = `
<h2 style="text-decoration: underline;">General rule:</h2>

<div class="boxed">
  If the last syllable of the stem contains 1 of these 2 vowels: ㅗ, ㅏ &rarr; + 아<br>
  In all other cases &rarr; + 어
</div>

<h3><strong>'Normal' batchim (regular verbs/adjectives) &rarr; add the ending:</strong></h3>
<div class="two-column">
  <div class="column">
    살다 &rarr; 살(다) &rarr; 살 + 아 &rarr; 살아<br>
    놀다 &rarr; 놀(다) &rarr; 놀 + 아 &rarr; 놀아
  </div>
  <div class="column">
    먹다 &rarr; 먹(다) &rarr; 먹 + 어 &rarr; 먹어<br>
    읽다 &rarr; 읽(다) &rarr; 읽 + 어 &rarr; 읽어
  </div>
</div>

<h3><strong>No batchim and vowels ㅏㅗ ㅓㅜ ㅐ = contraction with the ending:</strong></h3>
<div class="two-column">
  <div class="column">
    가다 &rarr; 가(다) &rarr; 가 + 아 &rarr; 가<br>
    오다 &rarr; 오(다) &rarr; 오 + 아 &rarr; 와<br>
    보내다 &rarr; 보내(다) &rarr; 보내 + 어 &rarr; 보내
  </div>
  <div class="column">
    서다 &rarr; 서(다) &rarr; 서 + 어 &rarr; 서<br>
    주다 &rarr; 주(다) &rarr; 주 + 어 &rarr; 줘
  </div>
</div>

<h3><strong>Special case (sometimes segregated as 여)</strong></h3>
<div>하다 &rarr; 해 / 하여</div>

<h3><strong>Common cases of optional contraction / no contraction (more formal):</strong></h3>
<div class="two-column">
  <div class="column">
    하다 &rarr; 해 / 하여<br>
    되다 &rarr; 돼 / 되어<br>
    주다 &rarr; 줘 / 주어
  </div>
  <div class="column">
    두다 &rarr; 둬 / 두어<br>
    보다 &rarr; 봐 / 보아
  </div>
</div>

<hr class="divider">

<h3><strong>Special cases of ㅣ and ㅡ without batchim:</strong></h3>

<div class="red-bold">ㅣ &rarr; ㅕ</div>
<div>마시다 &rarr; 마셔</div>

<div class="red-bold">ㅡ &rarr; ㅓ (if it’s the only syllable in the word)</div>
<div>쓰다 &rarr; 써</div>

<div class="red-bold">ㅡ &rarr; ㅏ/ㅓ (if there are several syllables, ㅡ &rarr; ㅏ/ㅓ based on the previous syllable)</div>
<div>모으다 &rarr; 모아</div>

<div class="red-bold">르 &rarr; 라/러 (ㅡ &rarr; ㅏ/ㅓ based on the previous syllable, and an additional ㄹ is added in batchim of that previous syllable)</div>
<div>모르다 &rarr; 몰라</div>
<div>부르다 &rarr; 불러 &nbsp;<a href="#" class="rule-link" data-exception="re">+exceptions</a></div>

<hr class="divider">

<h3><strong>Irregular verbs / adjectives:</strong></h3>

<div class="red-bold">-ㅂ &rarr; 우 + 어</div>
<div>춥다 &rarr; 추우 + 어 &rarr; 추워</div>
<div>덥다 &rarr; 더우 + 어 &rarr; 더워</div>

<div class="red-bold">2 special cases: -ㅂ &rarr; 오 + 아</div>
<div>돕다 &rarr; 도오 + 아 &rarr; 도와</div>
<div>곱다 &rarr; 고오 + 아 &rarr; 고와</div>
<div><a href="#" class="rule-link" data-exception="b">+ exceptions with a stable ㅂ</a></div>

<div class="red-bold">-ㅅ &rarr; (X) + 아/어 based on the general rule</div>
<div>짓다 &rarr; 지어</div>
<div>낫다 &rarr; 나아</div>
<div><a href="#" class="rule-link" data-exception="s">+ exceptions with a stable ㅅ</a></div>

<div class="red-bold">-ㄷ &rarr; -ㄹ + 아/어 based on the general rule</div>
<div>듣다 &rarr; 들어</div>
<div><a href="#" class="rule-link" data-exception="d">+ exceptions with a stable ㄷ</a></div>
`;

// ======== Объект с модалками ========
const irregularExceptions = {
  s: {
    title: "-ㅅ Exceptions",
    words: [
      "씻다 — to wash",
      "빗다 — to comb (hair)",
      "웃다 — to laugh",
      "솟다 — to rise, to spring up",
      "벗다 — to take off (clothes)",
      "빼앗다 — to take away, to snatch"
    ]
  },
  d: {
    title: "-ㄷ Exceptions",
    words: [
      "받다 — to receive",
      "믿다 — to believe, to trust",
      "닫다 — to close",
      "얻다 — to get, to obtain",
      "묻다 — to bury",
      "쏟다 — to pour, to spill",
      "벋다 / 뻗다 — to stretch out, to extend",
      "돋다 — to rise (sun), to sprout",
      "뜯다 — to tear off, to rip out",
      "걷다 — to roll up (sleeves, pants), to fold up",
      "곧다 — to be straight",
      "굳다 — to be hard, to become firm"
    ]
  },
  b: {
    title: "-ㅂ Exceptions",
    words: [
      "입다 — to wear (clothes)",
      "집다 — to pick up, to grab",
      "좁다 — to be narrow",
      "잡다 / 붙잡다 / 다잡다 — to catch, to grab, to seize",
      "뽑다 — to pull out, to pick, to select",
      "접다 — to fold",
      "씹다 — to chew",
      "업다 — to carry on one’s back",
      "뵙다 — to meet, to see (honorific)",
      "굽다 — to bend, to roast/bake",
      "꼬집다 / 비집다 — to pinch",
      "꼽다 — to count on one’s fingers",
      "수줍다 — to be shy, to be modest",
      "헤집다 — to rummage through, to tear apart"
    ]
  },
  existTime: {
    title: "Except for time (rare)",
    words: [
      "(으)ㄴ 후 &rarr; 있은 후 / 없은 후",
      "(으)ㄴ 지 &rarr; 있은 지 / 없은 지"
    ]
  },
  re: {
    title: "-르 Exceptions",
    words: [
      "따르다 (따라) — to follow",
      "치르다 (치러) — to carry out, to pay (expenses)",
      "이르다 (이르러) — to reach, to arrive at",
      "푸르다 (푸르러) — to be blue, to be green"
    ]
  }
};

// ======== ХРАНИЛИЩЕ ТЕКСТОВ ГРАММАТИКИ ========
const grammarTabsContent = {
  aoRules: rulesContent, 
levelPlain: `
    <h2 style="text-decoration: underline; margin-bottom: 15px;">PLAIN FORM</h2>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V-ending with batchim</td><td rowspan="3">았/었다</td><td>는다</td><td rowspan="3">(으)ㄹ 것이다 / 겠다</td></tr>
      <tr><td>V-ending w/o batchim / -ㄹ*</td><td>ㄴ다</td></tr>
      <tr><td>Adj</td><td>다</td></tr>
      <tr><td>이다</td><td>이었다 / 였다</td><td>(이)다</td><td>일 것이다 / (이)겠다</td></tr>
      <tr><td>아니다</td><td>아니었다</td><td>아니다</td><td>아닐 것이다 / 아니겠다</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">PLAIN (NEGATIVE)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V</td><td rowspan="2">-지 않았다</td><td>-지 않는다</td><td>-지 않을 것이다 /</td></tr>
      <tr><td>Adj</td><td>-지 않다</td><td>-지 않겠다</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">PLAIN (QUESTIONS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V</td><td rowspan="2">았/었는가?</td><td>는가?</td><td rowspan="2">(으)ㄹ 것인가? / 겠는가?</td></tr>
      <tr><td>Adj</td><td>(으)ㄴ가?</td></tr>
      <tr><td>이다</td><td>이었는가? /<br>였는가?</td><td>인가?</td><td>일 것인가? / (이)겠는가?</td></tr>
      <tr><td>아니다</td><td>아니었는가?</td><td>아닌가?</td><td>아닐 것인가? /<br>아니겠는가?</td></tr>
    </table>
        <hr class="divider">
    <h3 style="margin-top: 20px;"><strong>Special verbs -ㄹ</strong></h3>
    <div class="red-bold">-ㄹ &rarr; (X) before affixes/endings starting with ㄴ, ㅂ, ㅅ *(No Bull Shit)* </div>
    <div>만들다 + 는 &rarr; 만드는 (것)</div>
    <div>만들다 + (으)ㄴ &rarr; 만든 (것)</div>
    <div>만들다 + ㅂ니다 &rarr; 만듭니다</div>
    <div>만들다 + (으)세요 &rarr; 만드세요</div>
    
    <div class="red-bold" style="margin-top: 15px;">-ㄹ + (으)ㄹ &rarr; merges in one -ㄹ</div>
    <div>만들다 + (으)ㄹ &rarr; 만들 (것)</div>

    <div class="red-bold" style="margin-top: 15px;">-ㄹ + affixes/endings starting with (으)ㅁ, (으)ㄹ &rarr; doesn’t take the (으)</div>
    <div>만들다 + (으)면 &rarr; 만들면</div>
    <div>만들다 + (으)려고 &rarr; 만들려고</div>
  `,

  levelPanmal: `
    <h2 style="text-decoration: underline; margin-bottom: 15px;">PANMAL</h2>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V</td><td rowspan="2">았/었어</td><td rowspan="2">아/어</td><td rowspan="2">(으)ㄹ 거야 / 겠어</td></tr>
      <tr><td>Adj</td></tr>
      <tr><td>이다</td><td>이었어 / 였어</td><td>(이)야</td><td>일 거야 / (이)겠어</td></tr>
      <tr><td>아니다</td><td>아니었어</td><td>아니야</td><td>아닐 거야 / 아니겠어</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">PANMAL (QUESTIONS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V</td><td>았/었어?<br>았/었나?<br>았/었는가?<br>았/었니?<br>았/었냐?</td><td>아/어?<br>나?<br>는가?<br>니?<br>냐?</td><td>(으)ㄹ 거야? / 겠어?<br>(으)ㄹ 건가? / 겠나? / 겠는가?<br>(으)ㄹ 거니? / 겠니?<br>(으)ㄹ 거냐? / 겠냐?</td></tr>
      <tr><td>Adj</td><td>았/었어?<br>았/었나?<br>았/었는가?<br>았/었니?<br>았/었냐?</td><td>아/어?<br>나?<br>(으)ㄴ가?<br>니?<br>냐?</td><td>(으)ㄹ 거야? / 겠어?<br>(으)ㄹ 건가? / 겠나? / 겠는가?<br>(으)ㄹ 거니? / 겠니?<br>(으)ㄹ 거냐? / 겠냐?</td></tr>
      <tr><td>이다</td><td>이었어? / 였어?<br>이었나? / 였나?<br>이었니? / 였니?<br>이었냐? / 였냐?</td><td>(이)야?<br>인가?<br>이니?<br>이냐?</td><td>일 거야? / (이)겠어?<br>일 건가? / (이)겠나? / (이)겠는가?<br>일 거니? / (이)겠니?<br>일 거냐? / (이)겠냐?</td></tr>
      <tr><td>아니다</td><td>아니었어?<br>아니었나?<br>아니었니?<br>아니었냐?</td><td>아니야?<br>아닌가?<br>아니니?<br>아니냐?</td><td>아닐 거야? / 아니겠어?<br>아닐 건가? / 아니겠나? / 아니겠는가?<br>아닐 거니? / 아니겠니?<br>아닐 거냐? / 아니겠냐?</td></tr>
    </table>

    <ul style="margin: 10px 0 15px 0; padding-left: 20px; line-height: 1.6; font-size: 0.95em;">
      <li><strong>-아/어?</strong> : Standard casual.</li>
      <li><strong>-나? / -(으)ㄴ가?</strong> : Soft, gentle, or talking to oneself ("I wonder...").</li>
      <li><strong>-니?</strong> : Friendly, affectionate.</li>
      <li><strong>-냐?</strong> : Direct, blunt, or slightly rough.</li>
    </ul>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">PANMAL (OTHER FORMS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Verbs</th></tr>
      <tr><td>Order, command</td><td>아/어<br>아/어라<br>렴</td></tr>
      <tr><td>Proposition to do together</td><td>자</td></tr>
    </table>
        <hr class="divider">
    <h3 style="margin-top: 20px;"><strong>Special verbs -ㄹ</strong></h3>
    <div class="red-bold">-ㄹ &rarr; (X) before affixes/endings starting with ㄴ, ㅂ, ㅅ *(No Bull Shit)* </div>
    <div>만들다 + 는 &rarr; 만드는 (것)</div>
    <div>만들다 + (으)ㄴ &rarr; 만든 (것)</div>
    <div>만들다 + ㅂ니다 &rarr; 만듭니다</div>
    <div>만들다 + (으)세요 &rarr; 만드세요</div>
    
    <div class="red-bold" style="margin-top: 15px;">-ㄹ + (으)ㄹ &rarr; merges in one -ㄹ</div>
    <div>만들다 + (으)ㄹ &rarr; 만들 (것)</div>

    <div class="red-bold" style="margin-top: 15px;">-ㄹ + affixes/endings starting with (으)ㅁ, (으)ㄹ &rarr; doesn’t take the (으)</div>
    <div>만들다 + (으)면 &rarr; 만들면</div>
    <div>만들다 + (으)려고 &rarr; 만들려고</div>
  `,

  levelUnofficial: `
    <h2 style="text-decoration: underline; margin-bottom: 15px;">POLITE UNOFFICIAL</h2>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V / Adj</td><td>았/었어요</td><td>아/어요</td><td>(으)ㄹ 거예요 /<br>겠어요</td></tr>
      <tr><td>이다</td><td>이었어요 /<br>였어요</td><td>이에요 /<br>예요</td><td>일 거예요/<br>(이)겠어요</td></tr>
      <tr><td>아니다</td><td>아니었어요</td><td>아니에요</td><td>아닐 거예요 /<br>아니겠어요</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">POLITE UNOFFICIAL (QUESTIONS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V</td><td>았/었어요?<br>았/었나요?<br>았/었는가요?</td><td>아/어요?<br>나요?<br>는가요?</td><td>(으)ㄹ 거예요? / 겠어요?<br>(으)ㄹ 건가요? / 겠나요? / 겠는가요?</td></tr>
      <tr><td>Adj</td><td>았/었어요?<br>았/었나요?<br>았/었는가요?</td><td>아/어요?<br>나요?<br>(으)ㄴ가요?</td><td>(으)ㄹ 거예요? / 겠어요?<br>(으)ㄹ 건가요? / 겠나요? / 겠는가요?</td></tr>
      <tr><td>이다</td><td>이었어요? / 였어요?<br>이었나요? / 였나요?</td><td>이에요? /<br>예요?<br>인가요?</td><td>일 거예요? / (이)겠어요?<br>일 건가요? / (이)겠나요? / (이)겠는가요?</td></tr>
      <tr><td>아니다</td><td>아니었어요?<br>아니었나요?</td><td>아니에요?<br>아닌가요?</td><td>아닐 거예요? / 아니겠어요?<br>아닐 건가요? / 아니겠나요? / 아니겠는가요?</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">POLITE UNOFFICIAL (OTHER FORMS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Verbs</th></tr>
      <tr><td>Order, command</td><td>아/어요<br>(으)세요</td></tr>
      <tr><td>Proposition to do together</td><td>아/어요</td></tr>
    </table>
        <hr class="divider">
    <h3 style="margin-top: 20px;"><strong>Special verbs -ㄹ</strong></h3>
    <div class="red-bold">-ㄹ &rarr; (X) before affixes/endings starting with ㄴ, ㅂ, ㅅ *(No Bull Shit)* </div>
    <div>만들다 + 는 &rarr; 만드는 (것)</div>
    <div>만들다 + (으)ㄴ &rarr; 만든 (것)</div>
    <div>만들다 + ㅂ니다 &rarr; 만듭니다</div>
    <div>만들다 + (으)세요 &rarr; 만드세요</div>
    
    <div class="red-bold" style="margin-top: 15px;">-ㄹ + (으)ㄹ &rarr; merges in one -ㄹ</div>
    <div>만들다 + (으)ㄹ &rarr; 만들 (것)</div>

    <div class="red-bold" style="margin-top: 15px;">-ㄹ + affixes/endings starting with (으)ㅁ, (으)ㄹ &rarr; doesn’t take the (으)</div>
    <div>만들다 + (으)면 &rarr; 만들면</div>
    <div>만들다 + (으)려고 &rarr; 만들려고</div>
  `,

  levelOfficial: `
    <h2 style="text-decoration: underline; margin-bottom: 15px;">POLITE OFFICIAL</h2>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V / Adj</td><td>았/었습니다</td><td>습니다/ㅂ니다</td><td>(으)ㄹ 것입니다 /<br>겠습니다</td></tr>
      <tr><td>이다</td><td>였습니다 /<br>이었습니다</td><td>입니다</td><td>일 것입니다/<br>(이)겠습니다</td></tr>
      <tr><td>아니다</td><td>아니었습니다</td><td>아닙니다</td><td>아닐 것입니다 /<br>아니겠습니다</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">POLITE OFFICIAL (QUESTIONS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Past</th><th>Present</th><th>Future / Assumption</th></tr>
      <tr><td>V / Adj</td><td>았/었습니까</td><td>습니까/ㅂ니까</td><td>(으)ㄹ 것입니까 /<br>겠습니까</td></tr>
      <tr><td>이다</td><td>이었습니까 /<br>였습니까</td><td>입니까</td><td>일 것입니까/<br>(이)겠습니까</td></tr>
      <tr><td>아니다</td><td>아니었습니까</td><td>아닙니다</td><td>아닐 것입니까 /<br>아니겠습니까</td></tr>
    </table>

    <h4 style="margin-top: 15px; margin-bottom: 5px;">POLITE OFFICIAL (OTHER FORMS)</h4>
    <table class="grammar-table">
      <tr><th></th><th>Verbs</th></tr>
      <tr><td>Order, command</td><td>(으)십시오</td></tr>
      <tr><td>Proposition to do together</td><td>(으)ㅂ시다</td></tr>
    </table>

    <hr class="divider">
    <h3 style="margin-top: 20px;"><strong>Special verbs -ㄹ</strong></h3>
    <div class="red-bold">-ㄹ &rarr; (X) before affixes/endings starting with ㄴ, ㅂ, ㅅ *(No Bull Shit)* </div>
    <div>만들다 + 는 &rarr; 만드는 (것)</div>
    <div>만들다 + (으)ㄴ &rarr; 만든 (것)</div>
    <div>만들다 + ㅂ니다 &rarr; 만듭니다</div>
    <div>만들다 + (으)세요 &rarr; 만드세요</div>
    
    <div class="red-bold" style="margin-top: 15px;">-ㄹ + (으)ㄹ &rarr; merges in one -ㄹ</div>
    <div>만들다 + (으)ㄹ &rarr; 만들 (것)</div>

    <div class="red-bold" style="margin-top: 15px;">-ㄹ + affixes/endings starting with (으)ㅁ, (으)ㄹ &rarr; doesn’t take the (으)</div>
    <div>만들다 + (으)면 &rarr; 만들면</div>
    <div>만들다 + (으)려고 &rarr; 만들려고</div>
  `,

  nunGeot: `
    <h2 style="text-decoration: underline;">Noun Modifiers (는 것)</h2>
    
    <!-- ГЛАВНАЯ ТАБЛИЦА (в обертке для скролла на телефонах) -->
    <div class="table-responsive">
      <table class="grammar-table" style="min-width: 500px;">
        <tr>
          <th></th>
          <th>past</th>
          <th>past</th>
          <th>past</th>
          <th>present</th>
          <th>future</th>
        </tr>
        <tr>
          <td>V (+<a href="#" class="rule-link" data-exception="existTime">있다/없다</a>)</td>
          <td>았/었던</td>
          <td class="pad-left-for-badge">
            <span class="vs-badge vs-pink vs-on-border">vs</span> 던
          </td>
          <td class="pad-left-for-badge">
            <span class="vs-badge vs-green vs-on-border">vs</span> (으)ㄴ
          </td>
          <td>는</td>
          <td>(으)ㄹ</td>
        </tr>
        <tr>
          <td>A (+이다, 아니다)</td>
          <td>았/었던</td>
          <td class="pad-left-for-badge">
            <span class="vs-badge vs-red vs-on-border">vs</span> 던
          </td>
          <td></td>
          <td>(으)ㄴ</td>
          <td>(으)ㄹ</td>
        </tr>
      </table>
    </div>

    <!-- ПРАВИЛО 1 (ЗЕЛЕНЫЙ VS) -->
    <div class="vs-heading"><span class="vs-badge vs-green">vs</span> Verbs</div>
    <table class="grammar-table">
      <tr>
        <th>Modifier Form</th>
        <th>Meaning & Nuance</th>
        <th>Example</th>
      </tr>
      <tr>
        <td><strong>V-던</strong></td>
        <td><strong>Incomplete Action.</strong><br>The action was happening in the past but was not finished.</td>
        <td>읽던 책<br>(The book I was reading / left unfinished)</td>
      </tr>
      <tr>
        <td><strong>V-(으)ㄴ</strong></td>
        <td><strong>Completed Action.</strong><br>The action was fully completed in the past.</td>
        <td>읽은 책<br>(The book I read / finished reading)</td>
      </tr>
    </table>

    <!-- ПРАВИЛО 2 (РОЗОВЫЙ VS) -->
    <div class="vs-heading"><span class="vs-badge vs-pink">vs</span> Verbs</div>
    <table class="grammar-table">
      <tr>
        <th>Modifier Form</th>
        <th>Frequency of Action</th>
        <th>Connection to the Present</th>
      </tr>
      <tr>
        <td><strong>V-던</strong></td>
        <td><strong>Repeated / Habitual.</strong><br>An action you did regularly or multiple times.</td>
        <td><strong>Current state is unknown/irrelevant.</strong><br>Focus is only on recalling the past. The action started in the past and might or might not be continuing now.</td>
      </tr>
      <tr>
        <td><strong>V-았/었던</strong></td>
        <td><strong>Single Occurrence.</strong><br>An action performed once on a specific occasion.</td>
        <td><strong>Total contrast with the present.</strong><br>The action started and ended in the past. Emphasizes that the current situation is completely different now.</td>
      </tr>
    </table>

    <!-- ПРАВИЛО 3 (КРАСНЫЙ VS) -->
    <div class="vs-heading"><span class="vs-badge vs-red">vs</span> Adjectives</div>
    <table class="grammar-table">
      <tr>
        <th>Modifier Form</th>
        <th>Nuance & Connection to the Present</th>
      </tr>
      <tr>
        <td><strong>A-던</strong></td>
        <td><strong>Simple Past Memory.</strong><br>Recalling a past state. The speaker only talks about how it was in the past; the present state is unknown or unimportant.</td>
      </tr>
      <tr>
        <td><strong>A-았/었던</strong></td>
        <td><strong>Completely Changed State.</strong><br>Strongly emphasizes that the state has completely changed. The speaker believes things are totally different now compared to that past state.</td>
      </tr>
    </table>

    <hr class="divider">

    <!-- СПЕЦИАЛЬНЫЕ ГЛАГОЛЫ -ㄹ -->
    <h3 style="margin-top: 20px;"><strong>Special verbs -ㄹ</strong></h3>
    
    <div class="red-bold">-ㄹ &rarr; (X) before affixes/endings starting with ㄴ, ㅂ, ㅅ *(No Bull Shit)* </div>
    <div>만들다 + 는 &rarr; 만드는 (것)</div>
    <div>만들다 + (으)ㄴ &rarr; 만든 (것)</div>
    <div>만들다 + ㅂ니다 &rarr; 만듭니다</div>
    <div>만들다 + (으)세요 &rarr; 만드세요</div>
    
    <div class="red-bold" style="margin-top: 15px;">-ㄹ + (으)ㄹ &rarr; merges in one -ㄹ</div>
    <div>만들다 + (으)ㄹ &rarr; 만들 (것)</div>

    <div class="red-bold" style="margin-top: 15px;">-ㄹ + affixes/endings starting with (으)ㅁ, (으)ㄹ &rarr; doesn’t take the (으)</div>
    <div>만들다 + (으)면 &rarr; 만들면</div>
    <div>만들다 + (으)려고 &rarr; 만들려고</div>
`
};

const board = document.getElementById("sticker-board");

// ======== ГЛОБАЛЬНАЯ ФУНКЦИЯ ОТКРЫТИЯ ВКЛАДОК ========
window.openGrammarTab = function(tabKey) {
  // 1. Закрыть все стикеры
  board.querySelectorAll(".sticker").forEach(s => s.remove());

  // НОВОЕ: Прячем картинку SKZOO, чтобы освободить место для текста
  const skzoo = document.querySelector('.board-image');
  if (skzoo) skzoo.style.display = 'none';

  // 2. Найти или создать окно (портянку)
  let port = document.getElementById("grammar-portion");
  if (!port) {
    port = document.createElement("div");
    port.id = "grammar-portion";
    board.appendChild(port);
  }

  // 3. Загружаем нужный текст + КРЕСТИК для закрытия окна (с возвратом картинки)
  port.innerHTML = `
    <div style="text-align: right; cursor: pointer; color: #ff2a2a; font-size: 28px; font-weight: bold; margin-top: -10px; margin-bottom: 5px; user-select: none;" 
         onclick="document.getElementById('grammar-portion').style.display='none'; const skzoo = document.querySelector('.board-image'); if(skzoo) skzoo.style.display='block';">
      ×
    </div>
    ${grammarTabsContent[tabKey]}
  `;

  // 4. Заново навешиваем слушатели для модалок исключений 아/어
  port.querySelectorAll("a[data-exception]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault(); 
      const key = link.getAttribute("data-exception");
      openExceptionModal(key, e); 
    });
  });

  // 5. Показываем портянку
  port.style.display = "block";
};

// ======== СЛУШАТЕЛИ ДЛЯ ДЕСКТОПА (Кнопки внутри Grrr) ========
// 1. Главные табы (у которых есть data-target)
document.querySelectorAll('.g-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const topic = this.getAttribute('data-target');
    if (topic) openGrammarTab(topic); // Проверяем, что это не просто слово "Levels"
  });
});

// 2. Новые маленькие кнопки в выпадающем меню
document.querySelectorAll('.g-sub-tab').forEach(tab => {
  tab.addEventListener('click', function(e) {
    e.stopPropagation(); // Чтобы меню не схлопывалось криво
    const topic = this.getAttribute('data-target');
    if (topic) openGrammarTab(topic);
  });
});

// ======== Функция открытия модалок ========
function openExceptionModal(key, event) {
  const data = irregularExceptions[key];
  if (!data) return;

  let modal = document.getElementById("modal-" + key);
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-" + key;
    modal.className = "grammar-modal";

    const wordsList = Array.isArray(data.words) ? data.words : [];

    modal.innerHTML = '<span class="close-modal">\u00D7</span>' +
      '<h2>' + data.title + '</h2>' +
      (wordsList.length 
        ? '<ul>' + wordsList.map(w => '<li>' + w + '</li>').join('') + '</ul>'
        : '<p>No examples</p>');

    board.appendChild(modal);

    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.style.display = "none";
    });

    // Делаем модалку перетаскиваемой
    makeDraggable(modal);
  }

  modal.style.display = "block";
  modal.style.visibility = "hidden"; // временно невидимо
  modal.style.right = "10px";

  const linkRect = event.target.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const modalHeight = modal.offsetHeight;

  modal.style.top = (linkRect.top - boardRect.top + linkRect.height / 2 - modalHeight / 2) + "px";
  modal.style.visibility = "visible";
}

// ======== Функция для перетаскивания (Исправлена скобка!) ========
function makeDraggable(el) {
  let isDragging = false;
  let offsetX, offsetY;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const boardRect = board.getBoundingClientRect();
    let left = e.clientX - boardRect.left - offsetX;
    let top = e.clientY - boardRect.top - offsetY;

    left = Math.max(0, Math.min(left, board.offsetWidth - el.offsetWidth));
    top = Math.max(0, Math.min(top, board.offsetHeight - el.offsetHeight));

    el.style.left = left + "px";
    el.style.top = top + "px";
    el.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    el.style.cursor = "default";
  });
} // <- ВОТ ТУТ ТЕПЕРЬ ПРАВИЛЬНО ЗАКРЫТА ФУНКЦИЯ

// ======== Глобальные утилиты ========
window.toggleMobileMenu = function() {
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.classList.toggle("active");
};

// Prevent copying lyrics via keyboard (Ctrl/Cmd + C)
document.addEventListener('keydown', function (e) {
  const lyrics = document.getElementById('lyrics-container');
  if (!lyrics) return;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    const selection = window.getSelection();
    if (lyrics.contains(selection.anchorNode)) {
      e.preventDefault();
    }
  }
});

// ==========================================
// === ЖИВОЙ ПОИСК ПЕСЕН НА ГЛАВНОЙ ===
// ==========================================
function initSearch() {
    const searchInput = document.getElementById('song-search-input');
    if (!searchInput) return; // Если мы не на главной странице, ничего не делаем

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const albums = document.querySelectorAll('.album-column');

        albums.forEach(album => {
            const songs = album.querySelectorAll('.song-list li');
            let hasVisibleSongs = false;

            songs.forEach(li => {
                const link = li.querySelector('.song-link');
                const songName = link.textContent.toLowerCase();

                // Если имя песни содержит введенный текст
                if (songName.includes(query)) {
                    li.style.display = 'list-item'; // Показываем песню
                    hasVisibleSongs = true;
                    
                    // Если строка поиска не пустая, включаем подсветку ховера
                    if (query !== "") {
                        link.classList.add('search-highlight');
                    } else {
                        link.classList.remove('search-highlight');
                    }
                } else {
                    // Если не совпадает, прячем песню
                    li.style.display = 'none';
                    link.classList.remove('search-highlight');
                }
            });

            // Если в альбоме вообще нет подходящих песен — прячем весь блок альбома,
            // чтобы на экране не оставалось пустых черных дыр.
            if (hasVisibleSongs) {
                album.style.display = 'flex';
            } else {
                album.style.display = 'none';
            }
        });
    });
}