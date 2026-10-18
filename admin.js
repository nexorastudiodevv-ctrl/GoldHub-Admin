import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getDatabase,
    get,
    onValue,
    ref,
    remove,
    set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const ADMIN_EMAIL = "alfaydahmd02@gmail.com";
const OUNCE_TO_GRAM = 31.1034768;
const firebaseConfig = {
    apiKey: "AIzaSyBLHuPTH3RhwDTdxTDcgFRYPfvXZM3gco8",
    authDomain: "goldhub-1fdb1.firebaseapp.com",
    projectId: "goldhub-1fdb1",
    storageBucket: "goldhub-1fdb1.firebasestorage.app",
    messagingSenderId: "646245822812",
    appId: "1:646245822812:web:547fa4c76449a0d1391199",
    measurementId: "G-JRLE7E5JH7",
    databaseURL: "https://goldhub-1fdb1-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const pricesRef = ref(db, "market_prices");
const articlesRef = ref(db, "articles");
const priceFields = [
    { id: "manualGoldPrice", label: "سعر أوقية الذهب (USD)", group: "المعادن" },
    { id: "manualSilverPrice", label: "سعر أوقية الفضة (USD)", group: "المعادن" },
    { id: "manualCopperPrice", label: "سعر أوقية النحاس (USD)", group: "المعادن" },
    { id: "manualPlatinumPrice", label: "سعر أوقية البلاتين (USD)", group: "المعادن" },
    { id: "manualIronEzzPrice", label: "حديد عز (EGP/Ton)", group: "المعادن" },
    { id: "manualIronEgyptiansPrice", label: "حديد المصريين (EGP/Ton)", group: "المعادن" },
    { id: "manualIronGarhyPrice", label: "حديد الجارحي (EGP/Ton)", group: "المعادن" },
    { id: "manualEGP", label: "USD / EGP", group: "أسعار الصرف" },
    { id: "manualSAR", label: "USD / SAR", group: "أسعار الصرف" },
    { id: "manualEUR", label: "USD / EUR", group: "أسعار الصرف" },
    { id: "manual24k", label: "ذهب عيار 24 (USD/gram)", group: "أسعار العيارات بالدولار" },
    { id: "manual21k", label: "ذهب عيار 21 (USD/gram)", group: "أسعار العيارات بالدولار" },
    { id: "manual18k", label: "ذهب عيار 18 (USD/gram)", group: "أسعار العيارات بالدولار" },
    { id: "manual14k", label: "ذهب عيار 14 (USD/gram)", group: "أسعار العيارات بالدولار" },
    { id: "manual12k", label: "ذهب عيار 12 (USD/gram)", group: "أسعار العيارات بالدولار" },
    { id: "manual24kEGP", label: "ذهب عيار 24 (EGP/gram)", group: "أسعار العيارات بالجنيه" },
    { id: "manual21kEGP", label: "ذهب عيار 21 (EGP/gram)", group: "أسعار العيارات بالجنيه" },
    { id: "manual18kEGP", label: "ذهب عيار 18 (EGP/gram)", group: "أسعار العيارات بالجنيه" },
    { id: "manual14kEGP", label: "ذهب عيار 14 (EGP/gram)", group: "أسعار العيارات بالجنيه" },
    { id: "manual12kEGP", label: "ذهب عيار 12 (EGP/gram)", group: "أسعار العيارات بالجنيه" },
    { id: "making24k", label: "مصنعية عيار 24 (EGP/gram)", group: "المصنعية" },
    { id: "making21k", label: "مصنعية عيار 21 (EGP/gram)", group: "المصنعية" },
    { id: "making18k", label: "مصنعية عيار 18 (EGP/gram)", group: "المصنعية" },
    { id: "making14k", label: "مصنعية عيار 14 (EGP/gram)", group: "المصنعية" },
    { id: "making12k", label: "مصنعية عيار 12 (EGP/gram)", group: "المصنعية" }
];

let currentPrices = {};
let articles = {};
let editingArticleId = null;
let quill;
let stopArticlesListener;

const byId = (id) => document.getElementById(id);

function setMessage(id, message, isError = false) {
    const element = byId(id);
    element.textContent = message;
    element.className = `mt-4 min-h-6 text-sm ${isError ? "text-red-400" : "text-emerald-400"}`;
}

function firebaseErrorMessage(error) {
    const messages = {
        "auth/invalid-credential": "بيانات الدخول غير صحيحة.",
        "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
        "auth/too-many-requests": "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
        "auth/user-disabled": "هذا الحساب معطّل.",
        "auth/network-request-failed": "تعذّر الاتصال. تحقق من الإنترنت ثم أعد المحاولة.",
        "auth/operation-not-allowed": "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase."
    };
    return messages[error.code] || `تعذّرت العملية (${error.code || "خطأ غير معروف"}): ${error.message}`;
}

function renderPriceFields() {
    const container = byId("priceFields");
    const groups = [...new Set(priceFields.map((field) => field.group))];
    container.replaceChildren();

    for (const group of groups) {
        const heading = document.createElement("h3");
        heading.className = "mt-4 border-b border-slate-800 pb-2 font-bold text-cyan-300 sm:col-span-2 lg:col-span-3";
        heading.textContent = group;
        container.appendChild(heading);

        for (const field of priceFields.filter((item) => item.group === group)) {
            const wrapper = document.createElement("label");
            wrapper.className = "space-y-2 text-sm text-slate-300";
            wrapper.textContent = field.label;
            const input = document.createElement("input");
            input.id = field.id;
            input.className = "field";
            input.type = "number";
            input.step = field.group === "المصنعية" ? "0.01" : "any";
            input.min = "0";
            input.inputMode = "decimal";
            input.placeholder = "اتركه فارغاً للإبقاء على القيمة الحالية";
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        }
    }
}

function readNumber(id, fallback) {
    const raw = byId(id).value.trim();
    if (!raw) {
        if (Number.isFinite(fallback)) return fallback;
        const label = priceFields.find((field) => field.id === id)?.label || id;
        throw new Error(`أدخل قيمة في الحقل: ${label}`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || (value === 0 && !id.startsWith("making"))) {
        throw new Error(`أدخل قيمة صحيحة في الحقل: ${priceFields.find((field) => field.id === id)?.label || id}`);
    }
    return value;
}

function fillPriceFields(prices) {
    const rate = Number(prices.rates?.EGP) || 48.5;
    const ounceGold = Number(prices.gold) || 2350.75;
    const gram24 = ounceGold / OUNCE_TO_GRAM;
    const defaultCarats = {
        k24: gram24,
        k21: gram24 * 0.875,
        k18: gram24 * 0.75,
        k14: gram24 * (14 / 24),
        k12: gram24 * 0.5
    };
    const values = {
        manualGoldPrice: prices.gold,
        manualSilverPrice: prices.silver,
        manualCopperPrice: prices.copper,
        manualPlatinumPrice: prices.platinum,
        manualIronEzzPrice: prices.ironEzz,
        manualIronEgyptiansPrice: prices.ironEgyptians,
        manualIronGarhyPrice: prices.ironGarhy,
        manualEGP: prices.rates?.EGP,
        manualSAR: prices.rates?.SAR,
        manualEUR: prices.rates?.EUR,
        manual24k: prices.carats?.k24 ?? defaultCarats.k24,
        manual21k: prices.carats?.k21 ?? defaultCarats.k21,
        manual18k: prices.carats?.k18 ?? defaultCarats.k18,
        manual14k: prices.carats?.k14 ?? defaultCarats.k14,
        manual12k: prices.carats?.k12 ?? defaultCarats.k12,
        manual24kEGP: (prices.carats?.k24 ?? defaultCarats.k24) * rate,
        manual21kEGP: (prices.carats?.k21 ?? defaultCarats.k21) * rate,
        manual18kEGP: (prices.carats?.k18 ?? defaultCarats.k18) * rate,
        manual14kEGP: (prices.carats?.k14 ?? defaultCarats.k14) * rate,
        manual12kEGP: (prices.carats?.k12 ?? defaultCarats.k12) * rate,
        making24k: prices.makingCharges?.k24,
        making21k: prices.makingCharges?.k21,
        making18k: prices.makingCharges?.k18,
        making14k: prices.makingCharges?.k14,
        making12k: prices.makingCharges?.k12
    };

    for (const [id, value] of Object.entries(values)) {
        byId(id).value = value == null ? "" : String(value);
    }
}

function updateCaratsFromOunce() {
    const ounce = Number(byId("manualGoldPrice").value);
    if (!Number.isFinite(ounce) || ounce <= 0) return;
    const gram24 = ounce / OUNCE_TO_GRAM;
    const carats = { 24: gram24, 21: gram24 * 0.875, 18: gram24 * 0.75, 14: gram24 * (14 / 24), 12: gram24 * 0.5 };
    for (const [karat, price] of Object.entries(carats)) {
        byId(`manual${karat}k`).value = price.toFixed(2);
        syncCaratEgp(karat);
    }
}

function syncCaratEgp(karat, sourceId) {
    const usdInput = byId(`manual${karat}k`);
    const egpInput = byId(`manual${karat}kEGP`);
    const rate = Number(byId("manualEGP").value) || Number(currentPrices.rates?.EGP) || 48.5;
    if (sourceId === egpInput.id && egpInput.value.trim()) {
        const egpPrice = Number(egpInput.value);
        if (Number.isFinite(egpPrice) && egpPrice > 0 && rate > 0) usdInput.value = (egpPrice / rate).toFixed(2);
        return;
    }
    if (usdInput.value.trim()) {
        const usdPrice = Number(usdInput.value);
        if (Number.isFinite(usdPrice) && usdPrice > 0) egpInput.value = (usdPrice * rate).toFixed(2);
    }
}

function updateArticlePreview() {
    const title = byId("articleTitle").value.trim();
    const imageUrl = byId("articleImage").value.trim();
    const previewImage = byId("previewImage");
    byId("previewTitle").textContent = title || "عنوان المقال";
    byId("previewText").textContent = quill?.getText().trim() || "محتوى المقال سيظهر هنا.";
    if (imageUrl) {
        previewImage.src = imageUrl;
        previewImage.alt = title || "صورة المقال";
        previewImage.classList.remove("hidden");
    } else {
        previewImage.removeAttribute("src");
        previewImage.alt = "";
        previewImage.classList.add("hidden");
    }
}

function renderArticles(filter = "") {
    const container = byId("articlesList");
    const normalizedFilter = filter.trim().toLocaleLowerCase();
    const entries = Object.entries(articles).filter(([, article]) =>
        String(article.title || "").toLocaleLowerCase().includes(normalizedFilter)
    ).reverse();
    container.replaceChildren();

    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "py-4 text-center text-sm text-slate-500";
        empty.textContent = "لا توجد مقالات.";
        container.appendChild(empty);
        return;
    }

    for (const [id, article] of entries) {
        const row = document.createElement("div");
        row.className = "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3";
        const title = document.createElement("span");
        title.className = "min-w-0 flex-1 truncate text-sm";
        title.textContent = article.title || "مقال بلا عنوان";
        const actions = document.createElement("div");
        actions.className = "flex gap-2";
        const editButton = document.createElement("button");
        editButton.className = "rounded-lg px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10";
        editButton.textContent = "تعديل";
        editButton.addEventListener("click", () => editArticle(id));
        const deleteButton = document.createElement("button");
        deleteButton.className = "rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10";
        deleteButton.textContent = "حذف";
        deleteButton.addEventListener("click", () => deleteArticle(id));
        actions.append(editButton, deleteButton);
        row.append(title, actions);
        container.appendChild(row);
    }
}

async function initializeEditor() {
    if (quill) return;
    await Promise.all([
        new Promise((resolve, reject) => {
            const style = document.createElement("link");
            style.rel = "stylesheet";
            style.href = "https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.snow.css";
            style.onload = resolve;
            style.onerror = () => reject(new Error("تعذّر تحميل تنسيق محرر المقالات."));
            document.head.appendChild(style);
        }),
        new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("تعذّر تحميل محرر المقالات."));
            document.head.appendChild(script);
        })
    ]);
    quill = new window.Quill("#editor", {
        theme: "snow",
        placeholder: "اكتب محتوى المقال هنا...",
        modules: {
            toolbar: [
                [{ header: [2, 3, false] }],
                ["bold", "italic", "underline"],
                ["link", "image"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ direction: "rtl" }]
            ]
        }
    });
    quill.on("text-change", updateArticlePreview);
    updateArticlePreview();
}

function clearArticleForm() {
    editingArticleId = null;
    byId("articleForm").reset();
    quill.setContents([]);
    byId("saveArticle").textContent = "نشر المقال";
    byId("cancelArticleEdit").classList.add("hidden");
    updateArticlePreview();
}

function editArticle(id) {
    const article = articles[id];
    if (!article) return;
    editingArticleId = id;
    byId("articleTitle").value = article.title || "";
    byId("articleImage").value = article.image || "";
    quill.root.innerHTML = article.content || "";
    byId("saveArticle").textContent = "حفظ التعديل";
    byId("cancelArticleEdit").classList.remove("hidden");
    updateArticlePreview();
    byId("articleForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteArticle(id) {
    if (!window.confirm("هل تريد حذف هذا المقال نهائياً؟")) return;
    try {
        await remove(ref(db, `articles/${id}`));
        setMessage("articleMessage", "تم حذف المقال.");
    } catch (error) {
        setMessage("articleMessage", firebaseErrorMessage(error), true);
    }
}

async function loadDashboard() {
    renderPriceFields();
    try {
        const snapshot = await get(pricesRef);
        currentPrices = snapshot.val() || {};
        fillPriceFields(currentPrices);
    } catch (error) {
        setMessage("pricesMessage", firebaseErrorMessage(error), true);
    }

    try {
        stopArticlesListener?.();
        await initializeEditor();
        stopArticlesListener = onValue(articlesRef, (articleSnapshot) => {
            articles = articleSnapshot.val() || {};
            renderArticles(byId("articleSearch").value);
        }, (error) => setMessage("articleMessage", firebaseErrorMessage(error), true));
    } catch (error) {
        byId("saveArticle").disabled = true;
        setMessage("articleMessage", firebaseErrorMessage(error), true);
    }
}

async function showDashboard(user) {
    byId("signedInAs").textContent = `تم تسجيل الدخول: ${user.email}`;
    await loadDashboard();
    byId("loginPanel").classList.add("hidden");
    byId("dashboard").classList.remove("hidden");
}

byId("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("loginMessage", "");
    const email = byId("loginEmail").value.trim().toLowerCase();
    if (email !== ADMIN_EMAIL) {
        setMessage("loginMessage", "هذا البريد غير مخوّل لإدارة الموقع.", true);
        return;
    }

    byId("loginButton").disabled = true;
    try {
        const persistence = byId("rememberMe").checked ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        await signInWithEmailAndPassword(auth, email, byId("loginPassword").value);
    } catch (error) {
        setMessage("loginMessage", firebaseErrorMessage(error), true);
    } finally {
        byId("loginButton").disabled = false;
    }
});

byId("forgotPassword").addEventListener("click", async () => {
    const email = byId("loginEmail").value.trim().toLowerCase();
    if (email !== ADMIN_EMAIL) {
        setMessage("loginMessage", "أدخل بريد المدير المعتمد أولاً.", true);
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        setMessage("loginMessage", "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المدير.");
    } catch (error) {
        setMessage("loginMessage", firebaseErrorMessage(error), true);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user && user.email?.toLowerCase() !== ADMIN_EMAIL) {
        try {
            await signOut(auth);
        } catch (error) {
            setMessage("loginMessage", firebaseErrorMessage(error), true);
            return;
        }
        byId("dashboard").classList.add("hidden");
        byId("loginPanel").classList.remove("hidden");
        setMessage("loginMessage", "هذا الحساب غير مخوّل لإدارة الموقع.", true);
        return;
    }

    if (!user) {
        stopArticlesListener?.();
        stopArticlesListener = undefined;
        byId("dashboard").classList.add("hidden");
        byId("loginPanel").classList.remove("hidden");
        return;
    }

    await showDashboard(user);
}, (error) => setMessage("loginMessage", firebaseErrorMessage(error), true));

byId("logoutButton").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        setMessage("pricesMessage", firebaseErrorMessage(error), true);
    }
});

byId("priceFields").addEventListener("input", (event) => {
    if (event.target.id === "manualGoldPrice") {
        updateCaratsFromOunce();
    } else if (event.target.id === "manualEGP") {
        for (const karat of [24, 21, 18, 14, 12]) syncCaratEgp(karat);
    } else {
        const match = event.target.id.match(/^manual(24|21|18|14|12)k(EGP)?$/);
        if (match) syncCaratEgp(match[1], event.target.id);
    }
});
byId("articleSearch").addEventListener("input", (event) => renderArticles(event.target.value));
byId("cancelArticleEdit").addEventListener("click", clearArticleForm);
byId("articleTitle").addEventListener("input", updateArticlePreview);
byId("articleImage").addEventListener("input", updateArticlePreview);

byId("pricesForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = byId("savePrices");
    button.disabled = true;
    setMessage("pricesMessage", "");

    try {
        const exchangeRates = currentPrices.rates || {};
        const gold = readNumber("manualGoldPrice", Number(currentPrices.gold));
        const egpRate = readNumber("manualEGP", Number(exchangeRates.EGP));
        const caratFallback = {
            k24: gold / OUNCE_TO_GRAM,
            k21: (gold / OUNCE_TO_GRAM) * 0.875,
            k18: (gold / OUNCE_TO_GRAM) * 0.75,
            k14: (gold / OUNCE_TO_GRAM) * (14 / 24),
            k12: (gold / OUNCE_TO_GRAM) * 0.5
        };
        const getCarat = (karat) => {
            const usdValue = byId(`manual${karat}k`).value.trim();
            const egpValue = byId(`manual${karat}kEGP`).value.trim();
            if (usdValue) return readNumber(`manual${karat}k`, caratFallback[`k${karat}`]);
            if (egpValue) return readNumber(`manual${karat}kEGP`, 0) / egpRate;
            return Number(currentPrices.carats?.[`k${karat}`]) || caratFallback[`k${karat}`];
        };
        const newPrices = {
            ...currentPrices,
            gold,
            silver: readNumber("manualSilverPrice", Number(currentPrices.silver)),
            copper: readNumber("manualCopperPrice", Number(currentPrices.copper) || 4.5),
            platinum: readNumber("manualPlatinumPrice", Number(currentPrices.platinum) || 980),
            ironEzz: readNumber("manualIronEzzPrice", Number(currentPrices.ironEzz) || 41000),
            ironEgyptians: readNumber("manualIronEgyptiansPrice", Number(currentPrices.ironEgyptians) || 40500),
            ironGarhy: readNumber("manualIronGarhyPrice", Number(currentPrices.ironGarhy) || 40200),
            carats: {
                k24: getCarat(24),
                k21: getCarat(21),
                k18: getCarat(18),
                k14: getCarat(14),
                k12: getCarat(12)
            },
            rates: {
                ...exchangeRates,
                EGP: egpRate,
                SAR: readNumber("manualSAR", Number(exchangeRates.SAR) || 3.75),
                EUR: readNumber("manualEUR", Number(exchangeRates.EUR) || 0.92)
            },
            makingCharges: {
                k24: readNumber("making24k", Number(currentPrices.makingCharges?.k24) || 0),
                k21: readNumber("making21k", Number(currentPrices.makingCharges?.k21) || 0),
                k18: readNumber("making18k", Number(currentPrices.makingCharges?.k18) || 0),
                k14: readNumber("making14k", Number(currentPrices.makingCharges?.k14) || 0),
                k12: readNumber("making12k", Number(currentPrices.makingCharges?.k12) || 0)
            },
            lastUpdated: Date.now()
        };
        await set(pricesRef, newPrices);
        currentPrices = newPrices;
        fillPriceFields(currentPrices);
        setMessage("pricesMessage", "تم حفظ الأسعار في Firebase بنجاح.");
    } catch (error) {
        setMessage("pricesMessage", error instanceof Error ? error.message : firebaseErrorMessage(error), true);
    } finally {
        button.disabled = false;
    }
});

byId("resetPrices").addEventListener("click", async () => {
    if (!window.confirm("سيتم حذف الأسعار اليدوية من Firebase ليعود الموقع إلى التحديث التلقائي. هل تريد المتابعة؟")) return;
    try {
        await remove(pricesRef);
        currentPrices = {};
        fillPriceFields(currentPrices);
        setMessage("pricesMessage", "تم حذف الأسعار اليدوية. عاد الموقع إلى التحديث التلقائي.");
    } catch (error) {
        setMessage("pricesMessage", firebaseErrorMessage(error), true);
    }
});

byId("articleForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = byId("articleTitle").value.trim();
    const content = quill.getText().trim();
    if (!title || !content) {
        setMessage("articleMessage", "أدخل عنوان المقال ومحتواه.", true);
        return;
    }

    const id = editingArticleId || Date.now().toString();
    const article = {
        title,
        image: byId("articleImage").value.trim(),
        content: quill.root.innerHTML,
        summary: content.slice(0, 150).trim() + (content.length > 150 ? "..." : ""),
        date: new Date().toLocaleDateString("ar-EG"),
        timestamp: Date.now()
    };

    try {
        await set(ref(db, `articles/${id}`), article);
        setMessage("articleMessage", editingArticleId ? "تم تحديث المقال." : "تم نشر المقال.");
        clearArticleForm();
    } catch (error) {
        setMessage("articleMessage", firebaseErrorMessage(error), true);
    }
});
