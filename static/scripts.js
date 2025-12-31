function toggleMenu() { document.getElementById("sidebar").classList.toggle("open"); }
function openModal() { document.getElementById("productModal").style.display = "block"; }
function closeModal() { document.getElementById("productModal").style.display = "none"; }

function confirmReset() {
    if (prompt("Type 'DELETE ALL' to confirm reset:") === "DELETE ALL") {
        fetch('/reset_database', { method: 'POST' }).then(() => window.location.reload());
    }
}

function redirectToReports() {
    const link = document.querySelector('a[href="#reports"]');
    if (link) link.click();
}

function redirectToProducts() {
    const link = document.querySelector('a[href="#products"]');
    if (link) link.click();
}

function liveSearch() {
    const filter = document.getElementById("tableSearch").value.toLowerCase();
    const tr = document.querySelectorAll("table tbody tr");
    tr.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

function restockItem(name, size) {
    const qty = prompt(`Restocking ${name} (${size})\nEnter Quantity to Add:`);
    if (!qty || isNaN(qty)) return;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('size', size);
    fd.append('quantity', qty);
    fetch('/restock_product', { method: 'POST', body: fd }).then(() => {
        document.querySelector('a[href="#reports"]').click();
    });
}

function sellItem(productId, category, name, size) {
    const qty = document.getElementById(`qty-${productId}`).value;
    const assignee = prompt(`Selling ${name}\nEnter Seller Name:`);
    if (!assignee) return;
    const fd = new FormData();
    fd.append('quantity', qty);
    fd.append('assigned_to', assignee);
    fetch(`/sell_product/${productId}`, { method: 'POST', body: fd }).then(r => r.json()).then(data => {
        if (data.success) document.querySelector('a[href="#products"]').click();
        else alert(data.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    document.querySelectorAll('#sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('href').replace('#', '');
            fetch(`/get_content/${section}`).then(r => r.text()).then(h => {
                contentArea.innerHTML = h;
                document.getElementById("sidebar").classList.remove("open");
            });
        });
    });

    document.addEventListener('submit', function(e) {
        const fd = new FormData(e.target);
        if (e.target.id === 'settingsForm') {
            e.preventDefault();
            fetch('/update_settings', { method: 'POST', body: fd }).then(() => {
                alert("Settings Saved!");
                document.querySelector('a[href="#dashboard"]').click();
            });
        }
        if (e.target.id === 'addProductForm') {
            e.preventDefault();
            if (fd.get('category').toLowerCase() === 'uniform') {
                const s = prompt("Uniform Size? (S, M, L, XL)");
                if (!s) return;
                fd.append('size', s);
            }
            fetch('/add_product', { method: 'POST', body: fd }).then(() => {
                closeModal();
                document.querySelector('a[href="#products"]').click();
            });
        }
    });
    fetch('/get_content/dashboard').then(r => r.text()).then(h => contentArea.innerHTML = h);
});