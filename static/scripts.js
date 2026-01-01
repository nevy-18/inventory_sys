function redirectToReports() {
    const link = document.querySelector('a[href="#reports"]');
    if (link) link.click();
}

function redirectToProducts() {
    const link = document.querySelector('a[href="#products"]');
    if (link) link.click();
}
let incomingSupplies = [];
let supplyTimer;

function toggleMenu() { document.getElementById("sidebar").classList.toggle("open"); }
function openVerifyModal() { document.getElementById("verifyModal").style.display = "block"; }
function closeVerifyModal() { document.getElementById("verifyModal").style.display = "none"; }

function toggleOrderInterface() {
    const btn = document.getElementById("showOrderFormBtn");
    const card = document.getElementById("orderRequestCard");
    const isVisible = card.style.display === "block";
    card.style.display = isVisible ? "none" : "block";
    btn.style.display = isVisible ? "block" : "none";
}

function startSupplyTimer() {
    if (supplyTimer) return;
    supplyTimer = setInterval(() => {
        const itemPool = [
            { name: "A4 Paper", category: "Stationery", price: "80" },
            { name: "Spiral Notebook", category: "Stationery", price: "20" },
            { name: "Gel Pen", category: "Writing", price: "50" },
            { name: "HB Pencil", category: "Writing", price: "20" },
            { name: "Eraser", category: "Writing", price: "12" },
            { name: "School Polo", category: "Uniform", price: "500" },
            { name: "Department shirt", category: "Uniform", price: "500" },
            { name: "Academic Pants", category: "Uniform", price: "500" },
            { name: "P.e Shorts", category: "Uniform", price: "500" }
        ];
        const selected = itemPool[Math.floor(Math.random() * itemPool.length)];
        incomingSupplies.push({
            ...selected,
            stock: Math.floor(Math.random() * 100) + 1,
            size: selected.category === "Uniform" ? ["S", "M", "L", "XL"][Math.floor(Math.random() * 4)] : "N/A",
            id: Date.now()
        });
        renderSupplies();
    }, 10000);
}

function renderSupplies() {
    const container = document.getElementById("shipment-list");
    if (!container) return;
    container.innerHTML = incomingSupplies.length === 0 ? '<p>Waiting for shipments...</p>' : "";
    incomingSupplies.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "shipment-card-row"; // Added class for search
        div.innerHTML = `<div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border-left:5px solid #3498db; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <div><strong>${item.name}</strong> (${item.size})<br><small>${item.category} | Qty: ${item.stock} | ₱${item.price}</small></div>
            <button onclick="verifyShipment(${index})" style="background:#3498db; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer;">Accept & Verify</button>
        </div>`;
        container.appendChild(div);
    });
}

function liveSearch() {
    const filter = document.getElementById("tableSearch").value.toLowerCase();
    const rows = document.querySelectorAll("table tbody tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

function liveSearchShipments() {
    const filter = document.getElementById("shipmentSearch").value.toLowerCase();
    const cards = document.querySelectorAll(".shipment-card-row");
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(filter) ? "" : "none";
    });
}

function verifyShipment(index) {
    const item = incomingSupplies[index];
    const form = document.getElementById("verifyForm");
    form.name.value = item.name; form.category.value = item.category;
    form.stock.value = item.stock; form.price.value = item.price;
    form.size.value = item.size; form.dataset.index = index;
    openVerifyModal();
}

function checkOrderAvailability() {
    const form = document.getElementById("orderPostForm");
    const statusDiv = document.getElementById("stockStatusDisplay");
    const postBtn = document.getElementById("postOrderBtn");
    const fd = new FormData(form);

    if (!fd.get('name') || !fd.get('quantity')) {
        statusDiv.innerHTML = "Waiting for input...";
        postBtn.style.display = "none";
        return;
    }

    fetch('/check_stock', { method: 'POST', body: fd }).then(r => r.json()).then(data => {
        if (data.success && data.stock >= parseInt(fd.get('quantity'))) {
            statusDiv.innerHTML = `<span style="color:#38a169;">Stock Ready: ${data.stock} available</span>`;
        } else {
            statusDiv.innerHTML = `<span style="color:#e53e3e;">Waiting for stocks...</span>`;
        }
        postBtn.style.display = "block";
    });
}

function restockItem(name, size) {
    const qty = prompt(`Restock ${name} (${size})\nEnter Quantity:`);
    if (!qty || isNaN(qty)) return;
    const fd = new FormData();
    fd.append('name', name); fd.append('size', size); fd.append('stock', qty);
    fetch('/add_product', { method: 'POST', body: fd }).then(() => {
        const section = document.querySelector('a.active')?.getAttribute('href')?.replace('#', '') || 'reports';
        document.querySelector(`a[href="#${section}"]`).click();
    });
}

function sellItem(productId, category, name, size) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = qtyInput ? qtyInput.value : 1;
    const seller = prompt(`Selling ${name}\nEnter Seller Name:`);
    if (!seller) return;
    const fd = new FormData();
    fd.append('quantity', qty); fd.append('assigned_to', seller);
    fetch(`/sell_product/${productId}`, { method: 'POST', body: fd }).then(r => r.json()).then(data => {
        if (data.success) document.querySelector('a[href="#products"]').click();
        else alert(data.message);
    });
}

function finishOrder(order_id) {
    fetch(`/complete_order/${order_id}`, { method: 'POST' }).then(r => r.json()).then(data => {
        if (data.success) document.querySelector('a[href="#orders"]').click();
        else alert(data.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startSupplyTimer();
    document.querySelectorAll('#sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('href').replace('#', '');
            fetch(`/get_content/${section}`).then(r => r.text()).then(h => {
                document.getElementById('content-area').innerHTML = h;
                if (section === 'suppliers') renderSupplies();
            });
        });
    });
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'verifyForm') {
            e.preventDefault();
            fetch('/add_product', { method: 'POST', body: new FormData(e.target) }).then(() => {
                incomingSupplies.splice(e.target.dataset.index, 1);
                closeVerifyModal(); renderSupplies();
            });
        }
        if (e.target.id === 'orderPostForm') {
            e.preventDefault();
            fetch('/post_order', { method: 'POST', body: new FormData(e.target) }).then(() => {
                document.querySelector('a[href="#orders"]').click();
            });
        }
        if (e.target.id === 'settingsForm') {
            e.preventDefault();
            fetch('/update_settings', { method: 'POST', body: new FormData(e.target) }).then(() => {
                alert("Settings Saved!");
                document.querySelector('a[href="#dashboard"]').click();
            });
        }
    });
    fetch('/get_content/dashboard').then(r => r.text()).then(h => document.getElementById('content-area').innerHTML = h);
});