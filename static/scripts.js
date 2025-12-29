function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("open");
}

function openModal() {
    document.getElementById("productModal").style.display = "block";
}

function closeModal() {
    document.getElementById("productModal").style.display = "none";
}


function sellItem(productId, category, name, size) {
    const qty = document.getElementById(`qty-${productId}`).value;
    

    let message = `Selling: ${name}`;
    if (category.toLowerCase() === 'uniform') {
        message += ` (Size: ${size})`;
    }

    const assignee = prompt(`${message}\n\nEnter your name (Assigned Seller):`);
    
    if (!assignee || assignee.trim() === "") {
        alert("Transaction cancelled. A seller name is required for the report.");
        return;
    }

    const fd = new FormData();
    fd.append('quantity', qty);
    fd.append('assignee', assignee);

    fetch(`/sell_product/${productId}`, { 
        method: 'POST', 
        body: fd 
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {

            document.querySelector('a[href="#products"]').click();
        } else {
            alert(data.message);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');


    document.querySelectorAll('#sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('href').replace('#', '');
            fetch(`/get_content/${section}`)
                .then(r => r.text())
                .then(html => {
                    contentArea.innerHTML = html;
                    document.getElementById("sidebar").classList.remove("open");
                });
        });
    });


    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'addProductForm') {
            e.preventDefault();
            const fd = new FormData(e.target);
            const category = fd.get('category').toLowerCase();

            if (category === 'uniform') {
                const size = prompt("Uniform category detected. What is the size? (S, M, L, XL)");
                if (!size) {
                    alert("Size is mandatory for uniforms.");
                    return;
                }
                fd.append('size', size);
            }

            fetch('/add_product', { 
                method: 'POST', 
                body: fd 
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) { 
                    closeModal(); 
                    document.querySelector('a[href="#products"]').click(); 
                } 

                else if (data.exists) {
                    const confirmRestock = confirm(
                        `${data.name} (Size: ${data.size}) already exists.\n\n` +
                        `Current stock: ${data.stock}\n` +
                        `Would you like to restock by adding ${fd.get('stock')} units?`
                    );

                    if (confirmRestock) {
                        const rfd = new FormData();
                        rfd.append('name', data.name);
                        rfd.append('size', data.size);
                        rfd.append('stock', fd.get('stock'));

                        fetch('/restock_product', { 
                            method: 'POST', 
                            body: rfd 
                        }).then(() => {
                            closeModal();
                            document.querySelector('a[href="#products"]').click();
                        });
                    }
                }
            });
        }
    });

   
    fetch('/get_content/dashboard')
        .then(r => r.text())
        .then(h => contentArea.innerHTML = h);
});