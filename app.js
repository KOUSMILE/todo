(function () {
    'use strict';

    let todos = JSON.parse(localStorage.getItem('todos') || '[]');
    let nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    let currentFilter = 'all';

    function save() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getFiltered() {
        if (currentFilter === 'active')    return todos.filter(t => !t.completed);
        if (currentFilter === 'completed') return todos.filter(t => t.completed);
        return todos;
    }

    function render() {
        const total          = todos.length;
        const activeCount    = todos.filter(t => !t.completed).length;
        const completedCount = total - activeCount;
        const filtered       = getFiltered();

        document.getElementById('total-badge').textContent    = total;
        document.getElementById('count-all').textContent      = total;
        document.getElementById('count-active').textContent   = activeCount;
        document.getElementById('count-completed').textContent = completedCount;

        const footer       = document.getElementById('card-footer');
        const clearBtn     = document.getElementById('clear-btn');
        const activeText   = document.getElementById('active-count-text');

        if (total > 0) {
            footer.style.display   = 'flex';
            activeText.textContent  = `残り ${activeCount} 件`;
            clearBtn.style.display  = completedCount > 0 ? 'inline-block' : 'none';
        } else {
            footer.style.display = 'none';
        }

        const list = document.getElementById('todo-list');

        if (filtered.length === 0) {
            const msgs = {
                all:       'タスクを追加してみましょう！',
                active:    'すべてのタスクが完了しています 🎉',
                completed: '完了したタスクはありません',
            };
            list.innerHTML = `<li class="empty-state">${msgs[currentFilter]}</li>`;
            return;
        }

        list.innerHTML = filtered.map(todo => `
            <li class="todo-item${todo.completed ? ' completed' : ''}" data-id="${todo.id}">
                <button class="toggle-btn" data-action="toggle" title="完了/未完了を切替">
                    ${todo.completed
                        ? `<svg viewBox="0 0 24 24" fill="none">
                               <circle cx="12" cy="12" r="11" fill="#667eea"/>
                               <path d="M7 12l4 4 6-7" stroke="white" stroke-width="2.2"
                                     stroke-linecap="round" stroke-linejoin="round"/>
                           </svg>`
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                               <circle cx="12" cy="12" r="11"/>
                           </svg>`
                    }
                </button>
                <span class="todo-label" data-action="label">${escapeHtml(todo.title)}</span>
                <input type="text" class="edit-input" value="${escapeHtml(todo.title)}" data-action="edit-input">
                <button class="delete-btn" data-action="delete" title="削除">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </li>
        `).join('');

        list.querySelectorAll('.todo-item').forEach(li => {
            const id = parseInt(li.dataset.id, 10);

            li.querySelector('[data-action="toggle"]').addEventListener('click', () => {
                toggleTodo(id);
            });

            li.querySelector('[data-action="label"]').addEventListener('dblclick', () => {
                li.classList.add('editing');
                const input = li.querySelector('.edit-input');
                input.focus();
                input.select();
            });

            const editInput = li.querySelector('[data-action="edit-input"]');
            editInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    editTodo(id, editInput.value.trim());
                } else if (e.key === 'Escape') {
                    li.classList.remove('editing');
                }
            });
            editInput.addEventListener('blur', () => {
                li.classList.remove('editing');
            });

            li.querySelector('[data-action="delete"]').addEventListener('click', () => {
                deleteTodo(id);
            });
        });
    }

    function addTodo(title) {
        todos.unshift({ id: nextId++, title, completed: false });
        save();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) { todo.completed = !todo.completed; save(); render(); }
    }

    function editTodo(id, title) {
        if (!title) return;
        const todo = todos.find(t => t.id === id);
        if (todo) { todo.title = title; save(); render(); }
    }

    function deleteTodo(id) {
        todos = todos.filter(t => t.id !== id);
        save();
        render();
    }

    function clearCompleted() {
        todos = todos.filter(t => !t.completed);
        save();
        render();
    }

    // Init
    const addInput = document.getElementById('add-input');
    const addBtn   = document.getElementById('add-btn');

    addInput.focus();

    function submitAdd() {
        const title = addInput.value.trim();
        if (title) { addTodo(title); addInput.value = ''; addInput.focus(); }
    }

    addBtn.addEventListener('click', submitAdd);
    addInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitAdd(); });

    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    document.getElementById('clear-btn').addEventListener('click', clearCompleted);

    render();
})();
