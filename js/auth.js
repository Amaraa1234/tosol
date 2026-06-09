import { supabase } from "./supabase.js";

const authForm = document.getElementById('auth-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const btnRegister = document.getElementById('btn-register')
const messageDiv = document.getElementById('message')

// ========================================================
// 1. ШИНЭЭР БҮРТГҮҮЛЭХ ЛОГИК (Бүртгүүлэх товч дарагдах үед)
// ========================================================
btnRegister.addEventListener('click', async (e) => {
    e.preventDefault(); // Хуудас дахин ачаалагдахаас сэргийлнэ
    
    console.log("Бүртгүүлэх товч дарагдлаа.");
    
    // Утгуудыг авч, хоосон зайг арилгах (.trim())
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Имэйл болон нууц үг гүйцэд эсэхийг шалгах
    if (!email || !password) {
        showMessage("Имэйл болон нууц үгээ гүйцэд оруулна уу!", "text-danger");
        return; 
    }

    // Нууц үгийн уртыг шалгах
    if (password.length < 6) {
        showMessage("Нууц үг доод тал нь 6 тэмдэгт байх ёстой!", "text-danger");
        return;
    }

    try {
        // Supabase руу бүртгүүлэх өгөгдөл илгээх
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            showMessage(`Бүртгэл амжилтгүй: ${error.message}`, "text-danger");
        } else {
            showMessage("Бүртгэл амжилттай! Та нэвтрэх товчийг дарж орно уу.", "text-success");
            
            // Оролтын талбаруудыг цэвэрлэх
            emailInput.value = "";
            passwordInput.value = "";
        }
    } catch (err) {
        showMessage("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.", "text-danger");
    }
});

// ========================================================
// 2. НЭВТРЭХ ЛОГИК (Form дээр Enter дарах эсвэл Нэвтрэх товч дарагдах үед)
// ========================================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    console.log("Нэвтрэх хүсэлт илгээгдлээ.");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showMessage("Имэйл болон нууц үгээ оруулна уу!", "text-danger");
        return;
    }

    try {
        // ЗАСВАР: Ижил нэртэй функцийг том жижиг үсгийн дүрмээр зөв бичив (signInWithPassword)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showMessage(`Нэвтрэх алдаа: ${error.message}`, "text-danger");
        } else {
            showMessage("Амжилттай нэвтэрлээ! Шилжиж байна...", "text-success");

            // Оролтын талбаруудыг цэвэрлэх
            emailInput.value = "";
            passwordInput.value = "";

            // 1.5 секундын дараа дашбоард руу үсрэх
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    } catch (err) {
        showMessage("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.", "text-danger");
    }
});

// ========================================================
// 3. МЭДЭГДЭЛ ХАРУУЛАХ ТУСЛАХ ФУНКЦ
// ========================================================
function showMessage(text, bootstrapColorclass) {
    messageDiv.innerText = text;
    messageDiv.className = `text-center small mt-3 fw-medium ${bootstrapColorclass}`;
}