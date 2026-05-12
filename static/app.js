document.addEventListener('DOMContentLoaded', function () {

    // Double-click on a label to enter edit mode
    document.querySelectorAll('.todo-label').forEach(function (label) {
        label.addEventListener('dblclick', function () {
            const li = this.closest('.todo-item');
            li.classList.add('editing');
            const input = li.querySelector('.edit-input');
            input.focus();
            input.select();
        });
    });

    // Escape cancels the edit without submitting
    document.querySelectorAll('.edit-input').forEach(function (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                this.closest('.todo-item').classList.remove('editing');
            }
        });
    });

});
