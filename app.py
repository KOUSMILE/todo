import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, g

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'todos.db')


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            title    TEXT    NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


@app.route('/')
def index():
    f = request.args.get('filter', 'all')
    db = get_db()

    if f == 'active':
        todos = db.execute(
            'SELECT * FROM todos WHERE completed = 0 ORDER BY id DESC'
        ).fetchall()
    elif f == 'completed':
        todos = db.execute(
            'SELECT * FROM todos WHERE completed = 1 ORDER BY id DESC'
        ).fetchall()
    else:
        todos = db.execute('SELECT * FROM todos ORDER BY id DESC').fetchall()

    total = db.execute('SELECT COUNT(*) FROM todos').fetchone()[0]
    active_count = db.execute(
        'SELECT COUNT(*) FROM todos WHERE completed = 0'
    ).fetchone()[0]
    completed_count = total - active_count

    return render_template(
        'index.html',
        todos=todos,
        filter=f,
        total=total,
        active_count=active_count,
        completed_count=completed_count,
    )


@app.route('/add', methods=['POST'])
def add():
    title = request.form.get('title', '').strip()
    f = request.form.get('filter', 'all')
    if title:
        db = get_db()
        db.execute('INSERT INTO todos (title) VALUES (?)', (title,))
        db.commit()
    return redirect(url_for('index', filter=f))


@app.route('/toggle/<int:todo_id>', methods=['POST'])
def toggle(todo_id):
    f = request.form.get('filter', 'all')
    db = get_db()
    db.execute(
        'UPDATE todos SET completed = 1 - completed WHERE id = ?', (todo_id,)
    )
    db.commit()
    return redirect(url_for('index', filter=f))


@app.route('/edit/<int:todo_id>', methods=['POST'])
def edit(todo_id):
    title = request.form.get('title', '').strip()
    f = request.form.get('filter', 'all')
    if title:
        db = get_db()
        db.execute('UPDATE todos SET title = ? WHERE id = ?', (title, todo_id))
        db.commit()
    return redirect(url_for('index', filter=f))


@app.route('/delete/<int:todo_id>', methods=['POST'])
def delete(todo_id):
    f = request.form.get('filter', 'all')
    db = get_db()
    db.execute('DELETE FROM todos WHERE id = ?', (todo_id,))
    db.commit()
    return redirect(url_for('index', filter=f))


@app.route('/clear-completed', methods=['POST'])
def clear_completed():
    f = request.form.get('filter', 'all')
    db = get_db()
    db.execute('DELETE FROM todos WHERE completed = 1')
    db.commit()
    return redirect(url_for('index', filter=f))


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
