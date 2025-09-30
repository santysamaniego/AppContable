// Variables para almacenar datos y contadores de IDs
let personalExpenses = [];
let businessInventory = [];
let businessSales = [];

let productIdCounter = 1;
let personalIdCounter = 1;
let salesIdCounter = 1;

// Referencias DOM
const personalForm = document.getElementById('personal-form');
const personalTableBody = document.querySelector('#personal-table tbody');
const personalTotalSpan = document.getElementById('personal-total');

const businessInvForm = document.getElementById('business-inventory-form');
const businessInvTableBody = document.querySelector('#business-inventory-table tbody');
const businessTotalInvestmentSpan = document.getElementById('business-total-investment');

const businessSalesForm = document.getElementById('business-sales-form');
const businessSalesTableBody = document.querySelector('#business-sales-table tbody');
const businessTotalSalesSpan = document.getElementById('business-total-sales');
const businessTotalProfitSpan = document.getElementById('business-total-profit');

const summaryPersonalExpenses = document.getElementById('summary-personal-expenses');
const summaryBusinessExpenses = document.getElementById('summary-business-expenses');
const summaryBusinessInvestment = document.getElementById('summary-business-investment');
const summaryBusinessSales = document.getElementById('summary-business-sales');
const summaryBusinessProfit = document.getElementById('summary-business-profit');
const summaryBalance = document.getElementById('summary-balance');

const businessSaleProductSelect = document.getElementById('business-sale-product');

const businessTotalExpensesSpan = document.getElementById('business-total-expenses');

const monthlyArchivesList = document.getElementById('monthly-archives-list');

const modal30Days = document.getElementById('modal-30days');
const closeModalBtn = document.getElementById('close-modal-btn');

const modalContent = modal30Days.querySelector('.modal-content');

// --- Funciones auxiliares ---

function formatMoney(num) {
    return num.toFixed(2);
}

function createRow(data, isBusinessInventory = false, isSale = false) {
    const tr = document.createElement('tr');
    let categoryClass = '';
    if (data.category) {
        categoryClass = 'category-' + data.category.replace(/\s/g, '\\ ');
        tr.classList.add(categoryClass);
    }

    if (!isBusinessInventory && !isSale) {
        // Gastos personales
        tr.innerHTML = `
            <td>${data.date}</td>
            <td>${data.category}</td>
            <td>${data.description}</td>
            <td>$${formatMoney(data.amount)}</td>
            <td><button class="btn-delete" data-type="personal" data-id="${data.id}">Eliminar</button></td>
        `;
    } else if (isBusinessInventory) {
        // Inventario negocio
        tr.innerHTML = `
            <td>${data.id}</td>
            <td>${data.date}</td>
            <td>${data.category}</td>
            <td>${data.name}</td>
            <td>${data.quantity}</td>
            <td>$${formatMoney(data.unitPrice)}</td>
            <td>${data.contactName || '-'}</td>
            <td>${data.contactInfo || '-'}</td>
            <td>$${formatMoney(data.unitPrice * data.initialQuantity)}</td>
            <td><button class="btn-delete" data-type="inventory" data-id="${data.id}">Eliminar</button></td>
        `;
    } else if (isSale) {
        // Ventas negocio
        tr.innerHTML = `
            <td>${data.date}</td>
            <td>${data.productName}</td>
            <td>${data.quantity}</td>
            <td>$${formatMoney(data.salePrice)}</td>
            <td>$${formatMoney(data.salePrice * data.quantity)}</td>
            <td>$${formatMoney(data.profit)}</td>
            <td><button class="btn-delete" data-type="sale" data-id="${data.id}">Eliminar</button></td>
        `;
    }

    return tr;
}

function sortByDateAndCategory(arr, dateKey = 'date', categoryKey = 'category') {
    return arr.slice().sort((a, b) => {
        if (a[dateKey] < b[dateKey]) return -1;
        if (a[dateKey] > b[dateKey]) return 1;
        if (a[categoryKey] && b[categoryKey]) {
            if (a[categoryKey] < b[categoryKey]) return -1;
            if (a[categoryKey] > b[categoryKey]) return 1;
        }
        return 0;
    });
}

// --- Guardar y cargar datos persistentes ---

function saveData() {
    localStorage.setItem('personalExpenses', JSON.stringify(personalExpenses));
    localStorage.setItem('businessInventory', JSON.stringify(businessInventory));
    localStorage.setItem('businessSales', JSON.stringify(businessSales));
    localStorage.setItem('productIdCounter', productIdCounter.toString());
    localStorage.setItem('personalIdCounter', personalIdCounter.toString());
    localStorage.setItem('salesIdCounter', salesIdCounter.toString());
    if (personalExpenses.length > 0) {
        localStorage.setItem('firstExpenseDate', personalExpenses[0].date);
    } else {
        localStorage.removeItem('firstExpenseDate');
    }
}

function loadData() {
    const pe = localStorage.getItem('personalExpenses');
    const bi = localStorage.getItem('businessInventory');
    const bs = localStorage.getItem('businessSales');
    const pid = localStorage.getItem('productIdCounter');
    const pidPersonal = localStorage.getItem('personalIdCounter');
    const pidSales = localStorage.getItem('salesIdCounter');

    personalExpenses = pe ? JSON.parse(pe) : [];
    businessInventory = bi ? JSON.parse(bi) : [];
    businessSales = bs ? JSON.parse(bs) : [];
    productIdCounter = pid ? parseInt(pid) : 1;
    personalIdCounter = pidPersonal ? parseInt(pidPersonal) : 1;
    salesIdCounter = pidSales ? parseInt(pidSales) : 1;
}

// --- Actualizaciones de tablas y totales ---

function updatePersonalTable() {
    personalTableBody.innerHTML = '';
    let total = 0;
    const sorted = sortByDateAndCategory(personalExpenses);
    sorted.forEach(item => {
        personalTableBody.appendChild(createRow(item));
        total += item.amount;
    });
    personalTotalSpan.textContent = formatMoney(total);
    summaryPersonalExpenses.textContent = formatMoney(total);
    updateSummary();
    saveData();
}

function updateBusinessInventoryTable() {
    businessInvTableBody.innerHTML = '';
    const sorted = sortByDateAndCategory(businessInventory);
    sorted.forEach(item => {
        businessInvTableBody.appendChild(createRow(item, true));
    });
    const totalInvestment = businessInventory.reduce((acc, item) => acc + (item.unitPrice * item.initialQuantity), 0);
    businessTotalInvestmentSpan.textContent = formatMoney(totalInvestment);
    summaryBusinessInvestment.textContent = formatMoney(totalInvestment);
    updateSummary();
    updateBusinessSaleProductOptions();
    saveData();
}

function updateBusinessSaleProductOptions() {
    businessSaleProductSelect.innerHTML = '<option value="" disabled selected>Selecciona producto</option>';
    businessInventory.forEach(item => {
        if (item.quantity > 0) {
            businessSaleProductSelect.innerHTML += `<option value="${item.id}">${item.name} (Disponible: ${item.quantity})</option>`;
        }
    });
}

function updateBusinessSalesTable() {
    businessSalesTableBody.innerHTML = '';
    let totalSales = 0;
    let totalProfit = 0;
    const sorted = sortByDateAndCategory(businessSales, 'date', 'productName');
    sorted.forEach(sale => {
        businessSalesTableBody.appendChild(createRow(sale, false, true));
        totalSales += sale.salePrice * sale.quantity;
        totalProfit += sale.profit;
    });
    businessTotalSalesSpan.textContent = formatMoney(totalSales);
    businessTotalProfitSpan.textContent = formatMoney(totalProfit);
    summaryBusinessSales.textContent = formatMoney(totalSales);
    summaryBusinessProfit.textContent = formatMoney(totalProfit);
    updateSummary();
    saveData();
}

function updateSummary() {
    const businessExpenses = businessInventory
        .filter(item => item.category !== 'Inversión')
        .reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    summaryBusinessExpenses.textContent = formatMoney(businessExpenses);
    businessTotalExpensesSpan.textContent = formatMoney(businessExpenses);

    const personalTotal = personalExpenses.reduce((acc, item) => acc + item.amount, 0);
    const totalInvestment = businessInventory.reduce((acc, item) => acc + (item.unitPrice * item.initialQuantity), 0);
    const totalSales = businessSales.reduce((acc, sale) => acc + sale.salePrice * sale.quantity, 0);
    const totalProfit = businessSales.reduce((acc, sale) => acc + sale.profit, 0);

    const balance = totalProfit - personalTotal - businessExpenses;

    summaryBalance.textContent = formatMoney(balance);
}

// --- Manejo formularios ---

personalForm.addEventListener('submit', e => {
    e.preventDefault();

    const date = document.getElementById('personal-date').value;
    const category = document.getElementById('personal-category').value;
    const description = document.getElementById('personal-description').value.trim();
    const amount = parseFloat(document.getElementById('personal-amount').value);

    if (!date || !category || !description || isNaN(amount) || amount <= 0) {
        alert('Por favor completa todos los campos correctamente.');
        return;
    }

    personalExpenses.push({ id: personalIdCounter++, date, category, description, amount });
    updatePersonalTable();

    personalForm.reset();
    setTodayDateInputs();

    check30DaysAlert();
});

businessInvForm.addEventListener('submit', e => {
    e.preventDefault();

    const date = document.getElementById('business-inv-date').value;
    const category = document.getElementById('business-inv-category').value;
    const name = document.getElementById('business-inv-name').value.trim();
    const quantity = parseInt(document.getElementById('business-inv-quantity').value);
    const unitPrice = parseFloat(document.getElementById('business-inv-price').value);
    const contactName = document.getElementById('business-inv-contact-name').value.trim();
    const contactInfo = document.getElementById('business-inv-contact-info').value.trim();

    if (!date || !category || !name || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
        alert('Por favor completa todos los campos correctamente.');
        return;
    }

    const newProduct = {
        id: productIdCounter++,
        date,
        category,
        name,
        quantity,
        initialQuantity: quantity,
        unitPrice,
        contactName,
        contactInfo
    };

    businessInventory.push(newProduct);
    updateBusinessInventoryTable();

    businessInvForm.reset();
    setTodayDateInputs();
});

businessSalesForm.addEventListener('submit', e => {
    e.preventDefault();

    const date = document.getElementById('business-sale-date').value;
    const productId = parseInt(document.getElementById('business-sale-product').value);
    const quantitySold = parseInt(document.getElementById('business-sale-quantity').value);
    const salePrice = parseFloat(document.getElementById('business-sale-price').value);

    if (!date || isNaN(productId) || isNaN(quantitySold) || quantitySold <= 0 || isNaN(salePrice) || salePrice < 0) {
        alert('Por favor completa todos los campos correctamente.');
        return;
    }

    const product = businessInventory.find(p => p.id === productId);
    if (!product) {
        alert('Producto no encontrado.');
        return;
    }

    if (quantitySold > product.quantity) {
        alert(`No hay suficiente stock. Disponible: ${product.quantity}`);
        return;
    }

    const profit = (salePrice - product.unitPrice) * quantitySold;

    const saleRecord = {
        id: salesIdCounter++,
        date,
        productId,
        productName: product.name,
        quantity: quantitySold,
        salePrice,
        profit
    };

    businessSales.push(saleRecord);

    product.quantity -= quantitySold;

    updateBusinessInventoryTable();
    updateBusinessSalesTable();

    businessSalesForm.reset();
    setTodayDateInputs();
});

// --- Botones eliminar (delegación) ---

document.body.addEventListener('click', e => {
    if (e.target.classList.contains('btn-delete')) {
        const type = e.target.getAttribute('data-type');
        const id = parseInt(e.target.getAttribute('data-id'));
        if (type === 'personal') {
            personalExpenses = personalExpenses.filter(item => item.id !== id);
            updatePersonalTable();
        } else if (type === 'inventory') {
            if (confirm('Eliminar producto del inventario eliminará también las ventas asociadas. ¿Continuar?')) {
                businessSales = businessSales.filter(sale => sale.productId !== id);
                businessInventory = businessInventory.filter(item => item.id !== id);
                updateBusinessInventoryTable();
                updateBusinessSalesTable();
            }
        } else if (type === 'sale') {
            businessSales = businessSales.filter(sale => sale.id !== id);
            updateBusinessSalesTable();
        }
        saveData();
    }
});

// --- Fechas y alertas 30 días ---

function setTodayDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    if (!document.getElementById('personal-date').value) {
        document.getElementById('personal-date').value = today;
    }
    if (!document.getElementById('business-inv-date').value) {
        document.getElementById('business-inv-date').value = today;
    }
    if (!document.getElementById('business-sale-date').value) {
        document.getElementById('business-sale-date').value = today;
    }
}

function check30DaysAlert() {
    const firstDateStr = localStorage.getItem('firstExpenseDate');
    if (!firstDateStr) return;

    const firstDate = new Date(firstDateStr);
    const now = new Date();
    const diffMs = now - firstDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 30 && !localStorage.getItem('monthClosed')) {
        modal30Days.classList.remove('hidden');
    }
}

closeModalBtn.addEventListener('click', () => {
    modal30Days.classList.add('hidden');
    closeMonth();
});

// --- Cierre y guardado mensual ---

function closeMonth() {
    const now = new Date();
    const monthYear = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const key = `monthlyArchive-${monthYear}`;

    const archive = {
        monthYear,
        personalExpenses: [...personalExpenses],
        businessInventory: [...businessInventory],
        businessSales: [...businessSales],
        summary: {
            personalTotal: personalExpenses.reduce((acc, e) => acc + e.amount, 0),
            businessExpenses: businessInventory.filter(i => i.category !== 'Inversión').reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
            businessInvestment: businessInventory.reduce((acc, i) => acc + i.unitPrice * i.initialQuantity, 0),
            businessSalesTotal: businessSales.reduce((acc, s) => acc + s.salePrice * s.quantity, 0),
            businessProfit: businessSales.reduce((acc, s) => acc + s.profit, 0),
            balance: 0
        }
    };
    archive.summary.balance = archive.summary.businessProfit - archive.summary.personalTotal - archive.summary.businessExpenses;

    localStorage.setItem(key, JSON.stringify(archive));
    localStorage.setItem('monthClosed', 'true');

    personalExpenses = [];
    businessInventory = [];
    businessSales = [];
    productIdCounter = 1;
    personalIdCounter = 1;
    salesIdCounter = 1;
        localStorage.removeItem('firstExpenseDate');

    updatePersonalTable();
    updateBusinessInventoryTable();
    updateBusinessSalesTable();
    updateSummary();
    loadMonthlyArchives();

    alert(`Resumen mensual "${monthYear}" guardado correctamente.`);
}

// --- Mostrar y descargar archivos mensuales ---

function loadMonthlyArchives() {
    monthlyArchivesList.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('monthlyArchive-')) {
            const monthYear = key.replace('monthlyArchive-', '');
            const li = document.createElement('li');
            const viewBtn = document.createElement('button');
            viewBtn.textContent = `Ver resumen ${monthYear}`;
            viewBtn.addEventListener('click', () => {
                showArchive(monthYear);
            });
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Descargar JSON';
            downloadBtn.style.marginLeft = '10px';
            downloadBtn.addEventListener('click', () => {
                downloadArchive(monthYear);
            });
            li.appendChild(viewBtn);
            li.appendChild(downloadBtn);
            monthlyArchivesList.appendChild(li);
        }
    }
}

function showArchive(monthYear) {
    const key = `monthlyArchive-${monthYear}`;
    const archiveStr = localStorage.getItem(key);
    if (!archiveStr) {
        alert('Archivo no encontrado.');
        return;
    }
    const archive = JSON.parse(archiveStr);

    modalContent.innerHTML = `
        <h2>Resumen de ${archive.monthYear}</h2>
        <div style="max-height: 400px; overflow-y: auto; text-align: left; margin-bottom: 1rem; white-space: pre-wrap; font-family: monospace; font-size: 0.9rem;">
            <strong>Gastos Personales:</strong>\n${archive.personalExpenses.map(e => `- ${e.date} | ${e.category} | ${e.description} | $${formatMoney(e.amount)}`).join('\n')}
            \n\n<strong>Inventario / Inversiones:</strong>\n${archive.businessInventory.map(i => `- ${i.date} | ${i.category} | ${i.name} | Cant: ${i.initialQuantity} | Precio Unit: $${formatMoney(i.unitPrice)}`).join('\n')}
            \n\n<strong>Ventas:</strong>\n${archive.businessSales.map(s => `- ${s.date} | ${s.productName} | Cant: ${s.quantity} | Precio Venta: $${formatMoney(s.salePrice)} | Ganancia: $${formatMoney(s.profit)}`).join('\n')}
            \n\n<strong>Resumen:</strong>
            \n- Total Gastos Personales: $${formatMoney(archive.summary.personalTotal)}
            \n- Total Gastos Negocio: $${formatMoney(archive.summary.businessExpenses)}
            \n- Total Inversión: $${formatMoney(archive.summary.businessInvestment)}
            \n- Total Ventas: $${formatMoney(archive.summary.businessSalesTotal)}
            \n- Ganancia Total: $${formatMoney(archive.summary.businessProfit)}
            \n- Balance General: $${formatMoney(archive.summary.balance)}
        </div>
        <button id="close-modal-btn">Cerrar</button>
    `;

    modal30Days.classList.remove('hidden');

    const newCloseBtn = modalContent.querySelector('#close-modal-btn');
    newCloseBtn.addEventListener('click', () => {
        modal30Days.classList.add('hidden');
        // Restaurar contenido original para alerta 30 días
        modalContent.innerHTML = `
            <h2>¡Se cumplió un mes!</h2>
            <p>Han pasado 30 días desde el primer gasto registrado. Se almacenará el resumen mensual.</p>
            <button id="close-modal-btn">Cerrar</button>
        `;
        const origCloseBtn = modalContent.querySelector('#close-modal-btn');
        origCloseBtn.addEventListener('click', () => {
            modal30Days.classList.add('hidden');
            closeMonth();
        });
    });
}

function downloadArchive(monthYear) {
    const key = `monthlyArchive-${monthYear}`;
    const archiveStr = localStorage.getItem(key);
    if (!archiveStr) {
        alert('Archivo no encontrado.');
        return;
    }
    const blob = new Blob([archiveStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contaduria_general_${monthYear.replace(/\s/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Inicialización ---

function init() {
    loadData();
    setTodayDateInputs();
    loadMonthlyArchives();
    updatePersonalTable();
    updateBusinessInventoryTable();
    updateBusinessSalesTable();
    updateSummary();
    check30DaysAlert();
}

init();