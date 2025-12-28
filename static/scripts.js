function toggleMenu() {
    const menu = document.getElementById("sidebar");
    menu.classList.toggle("open");
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector('.menu-toggle');
    
    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        sidebar.classList.remove("open");
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('tbody');

    if (tableBody) {
        tableBody.addEventListener('click', function(event) {
            const target = event.target;
            const row = target.closest('tr');
            if (!row) return;

            const productId = row.cells[0].textContent;
            const productName = row.cells[1].textContent;

            if (target.textContent.trim() === 'Edit') {
                alert(`Editing: ${productName} (ID: ${productId})`);
            }

            if (target.textContent.trim() === 'Delete') {
                if (confirm(`Are you sure you want to delete ${productName}?`)) {
                    row.remove();
                }
            }
        });
    }
});