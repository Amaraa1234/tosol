import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userEmailEl = document.getElementById("user-email");
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && userEmailEl) {
            userEmailEl.textContent = user.email;
        } else {
            window.location.href = "index.html";
            return;
        }
    } catch (err) {
        console.error(err);
    }

    const dateInput = document.getElementById("tx-date");
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = today;

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    const transactionForm = document.getElementById("transaction-form");
    const transactionList = document.getElementById("transaction-list");
    const totalBalanceEl = document.getElementById("total-balance");
    const totalIncomeEl = document.getElementById("total-income");
    const totalExpenseEl = document.getElementById("total-expense");
    const btnLogout = document.getElementById("btn-logout");


    const budgetForm = document.getElementById('budget-form');
    const budgetCategoryInput = document.getElementById('budget-category');
    const budgetAmountInput = document.getElementById('budget-amount');
    const budgetMonthInput = document.getElementById('budget-month');

    function updateDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount);
            if (tx.type === "income") {
                totalIncome += amount;
            } else if (tx.type === "expense") {
                totalExpense += amount;
            }
        });

        const totalBalance = totalIncome - totalExpense;

        if (totalBalanceEl) totalBalanceEl.textContent = `${totalBalance.toLocaleString()} ₮`;
        if (totalIncomeEl) totalIncomeEl.textContent = `${totalIncome.toLocaleString()} ₮`;
        if (totalExpenseEl) totalExpenseEl.textContent = `${totalExpense.toLocaleString()} ₮`;

        renderTransactions();
        checkBudgetStatus(); 
    }

    function renderTransactions() {
        if (!transactionList) return;
        transactionList.innerHTML = "";

        if (transactions.length === 0) {
            transactionList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4 small">
                        Одоогоор гүйлгээ бүртгэгдээгүй байна.
                    </td>
                </tr>`;
            return;
        }

        transactions.forEach((tx, index) => {
            const row = document.createElement("tr");

            const typeBadge = tx.type === "income" 
                ? '<span class="badge bg-success-subtle text-success">Орлого</span>' 
                : '<span class="badge bg-danger-subtle text-danger">Зарлага</span>';
            
            const amountText = tx.type === "income" 
                ? `+${parseFloat(tx.amount).toLocaleString()} ₮` 
                : `-${parseFloat(tx.amount).toLocaleString()} ₮`;

            const amountClass = tx.type === "income" ? "text-success fw-bold" : "text-danger fw-bold";

            row.innerHTML = `
                <td>${tx.date}</td>
                <td><span class="badge bg-light text-dark border">${tx.category}</span></td>
                <td>${tx.desc}</td>
                <td>${typeBadge}</td>
                <td class="text-end ${amountClass}">${amountText}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-link text-danger btn-delete" data-index="${index}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            transactionList.appendChild(row);
        });

        const deleteButtons = document.querySelectorAll(".btn-delete");
        deleteButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const indexToDelete = e.currentTarget.getAttribute("data-index");
                deleteTransaction(indexToDelete);
            });
        });
    }

    function deleteTransaction(index) {
        if (confirm("Та энэ гүйлгээг устгахдаа итгэлтэй байна уу?")) {
            transactions.splice(index, 1);
            localStorage.setItem("transactions", JSON.stringify(transactions));
            updateDashboard();
        }
    }

    
    async function checkBudgetStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        
        const currentMonthYear = new Date().toISOString().substring(0, 7);

      
        const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_year', currentMonthYear);

        const badgeContainer = document.getElementById("reward-badge-container");
        if (!badgeContainer) return;

        if (!budgets || budgets.length === 0) {
            badgeContainer.innerHTML = `
                <div class="alert alert-light text-center border-0 shadow-sm py-2">
                    <small class="text-muted"><i class="fa-solid fa-circle-info me-1"></i> Энэ сард төсөв тогтоосон үед цол, шагнал бодогдоно.</small>
                </div>`;
            return;
        }

        let isAllBudgetsSafe = true;
        let totalBudgetLimit = 0;
        let totalBudgetExpense = 0;

       
        budgets.forEach(b => {
            totalBudgetLimit += b.limit_amount;
            let categoryExpense = 0;

            transactions.forEach(tx => {
                if (tx.type === 'expense' && tx.category === b.category && tx.date && tx.date.substring(0, 7) === currentMonthYear) {
                    categoryExpense += parseFloat(tx.amount);
                }
            });

            totalBudgetExpense += categoryExpense;

            if (categoryExpense > b.limit_amount) {
                isAllBudgetsSafe = false; 
            }
        });

        if (isAllBudgetsSafe && transactions.length > 0) {
           
            let rewardAmount = localStorage.getItem(`reward_${currentMonthYear}`);
            if (!rewardAmount) {
                rewardAmount = Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000;
                localStorage.setItem(`reward_${currentMonthYear}`, rewardAmount);
            } else {
                rewardAmount = parseInt(rewardAmount);
            }

            // Хэрэглэгчийн зарцуулалтын хувиас хамаарч цол олгох
            let title = "Санхүүгийн Хөтөч";
            let alertClass = "alert-success";
            let icon = "fa-medal text-warning";
            const percentUsed = (totalBudgetExpense / totalBudgetLimit) * 100;

            if (percentUsed <= 50) {
                title = "(Хэт хэмнэлттэй)";
                alertClass = "alert-info";
            } else if (percentUsed <= 80) {
                title = "Санхүүгийн Төгс Мастер";
                alertClass = "alert-success";
            } else {
                title = "Эрсдэлийг Хазаарлагч";
                alertClass = "alert-warning";
            }

            badgeContainer.innerHTML = `
                <div class="alert ${alertClass} d-flex align-items-center justify-content-between border-0 shadow-sm p-3 mb-0">
                    <div>
                        <div class="fw-bold fs-6"><i class="fa-solid ${icon} me-2 fs-5"></i>Идэвхтэй цол: <span class="badge bg-dark ms-1">${title}</span></div>
                        <small class="text-dark opacity-75">Та энэ сарын төсвөө маш сайн барьж байна! Төлөвлөгөөт шагнал: <strong>${rewardAmount.toLocaleString()} ₮</strong></small>
                    </div>
                    <span class="badge bg-success fs-6 shadow-sm">+${rewardAmount.toLocaleString()} ₮</span>
                </div>
            `;
        } else if (!isAllBudgetsSafe) {
            badgeContainer.innerHTML = `
                <div class="alert alert-danger border-0 shadow-sm p-3 mb-0">
                    <div class="fw-bold"><i class="fa-solid fa-circle-exclamation me-2"></i>Цол цуцлагдсан (Төсөв хэтэрсэн)</div>
                    <small>Таны зарим ангиллын зарлага тогтоосон лимитээс давсан тул энэ сарын урамшуулал идэвхгүй боллоо.</small>
                </div>
            `;
        } else {
            badgeContainer.innerHTML = `
                <div class="alert alert-light text-center border-0 shadow-sm py-2">
                    <small class="text-muted"><i class="fa-solid fa-chart-line me-1"></i> Төсвийн гүйцэтгэл хэвийн байна. Гүйлгээ бүртгэгдэхэд цол шинэчлэгдэнэ.</small>
                </div>`;
        }
    }

    if (transactionForm) {
        transactionForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const type = document.getElementById("tx-type").value;
            const category = document.getElementById("tx-category").value;
            const amount = parseFloat(document.getElementById("tx-amount").value);
            const date = document.getElementById("tx-date").value;
            const desc = document.getElementById("tx-desc").value;

            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                alert("Сешн дууссан байна. Дахин нэвтэрнэ үү!");
                window.location.href = 'index.html';
                return;
            }

            if (type === 'expense') {
                const currentMonthYear = date.substring(0, 7);

                const { data: budgetData } = await supabase
                    .from('budgets')
                    .select('limit_amount')
                    .eq('user_id', user.id)
                    .eq('category', category)
                    .eq('month_year', currentMonthYear)
                    .maybeSingle();

                if (budgetData) {
                    const limitAmount = budgetData.limit_amount;

                    let totalPastExpense = 0;
                    transactions.forEach(tx => {
                        if (tx.type === 'expense' && tx.category === category && tx.date && tx.date.substring(0, 7) === currentMonthYear) {
                            totalPastExpense += parseFloat(tx.amount);
                        }
                    });

                    if (totalPastExpense + amount > limitAmount) {
                        const currentTotal = totalPastExpense + amount;
                        const proceed = confirm(
                            `АНХААРУУЛГА!\n\nТаны ${currentMonthYear} сарын "${category}" ангиллын төсвийн хязгаар: ${limitAmount.toLocaleString()} ₮\nОдоогийн нийт зарцуулалт: ${currentTotal.toLocaleString()} ₮ болох гэж байна.\n\nТөсөв хэтрүүлж гүйлгээг үргэлжлүүлэх үү?`
                        );
                        
                        if (!proceed) {
                            return;
                        }
                    }
                }
            }

            const newTx = {
                type: type,
                category: category,
                amount: amount,
                date: date,
                desc: desc
            };

            transactions.push(newTx);
            localStorage.setItem("transactions", JSON.stringify(transactions));

            transactionForm.reset();
            if (dateInput) dateInput.value = today;

            updateDashboard();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            if (confirm("Системээс гарах уу?")) {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    alert(`Гарахад алдаа гарлаа: ${error.message}`);
                } else {
                    window.location.href = "index.html";
                }
            }
        });
    }

    if (budgetForm) {
        budgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const category = budgetCategoryInput.value;
            const limitAmount = parseFloat(budgetAmountInput.value);
            const monthYear = budgetMonthInput.value; 

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Сешн дууссан байна!");
                return;
            }

            const { error } = await supabase
                .from('budgets')
                .insert([
                    {
                        user_id: user.id,
                        category: category,
                        limit_amount: limitAmount,
                        month_year: monthYear
                    }
                ]);

            if (error) {
                alert("Төсөв тогтооход алдаа гарлаа: " + error.message);
            } else {
                alert(`${monthYear} сарын ${category} ангилалд төсөв амжилттай тогтоогдлоо!`);
                budgetForm.reset();
                
                const instance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasBudget'));
                if (instance) instance.hide();
                
                updateDashboard(); // Төсөв нэмэгдсэн тул самбарыг дахин шинэчилнэ (шагнал бодох логикийг ажиллуулна)
                fetchBudgets();
            }
        });
    }

    async function fetchBudgets() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: budgets, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .order('month_year', { ascending: false });

        if (error) {
            console.error("Төсөв уншихад алдаа гарлаа:", error.message);
            return;
        }

        const budgetsContainer = document.getElementById('current-budgets-list');
        if (!budgetsContainer) return;
        
        if (!budgets || budgets.length === 0) {
            budgetsContainer.innerHTML = `
                <h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>
                <div class="text-center py-3 text-muted small bg-light rounded">Одоогоор төсөв тогтоогоогүй байна.</div>
            `;
            return;
        }

        let htmlContent = `<h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>`;
        
         budgets.forEach(b => {
            htmlContent += `
                <div class="card p-2 mb-2 bg-light border-0 shadow-sm">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="fw-bold small text-dark">${b.category}</span>
                            <span class="text-muted mx-1">•</span>
                            <span class="small text-secondary">${b.month_year}</span>
                        </div>
                        <span class="fw-bold text-primary small">${b.limit_amount.toLocaleString()} ₮</span>
                    </div>
                </div>
            `;
        });

        budgetsContainer.innerHTML = htmlContent;
    }

    updateDashboard();
    fetchBudgets();
});