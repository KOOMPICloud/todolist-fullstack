'use client';

import { useEffect, useState } from 'react';
import { login, getToken, getUser, isAuthenticated, logout } from '@/lib/auth';

interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check auth status on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
      fetchTodos();
    }
  }, []);

  const fetchTodos = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/todos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos([data.todo, ...todos]);
        setTitle('');
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(todos.map((t) => (t.id === id ? data.todo : t)));
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTodos(todos.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <h1 style={styles.title}>Todo App</h1>
          <p style={styles.subtitle}>Manage your tasks efficiently</p>
          <button onClick={login} style={styles.loginButton}>
            Login with KOOMPI ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.appTitle}>My Todos</h1>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.fullname || user.email}</span>
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={addTodo} style={styles.form}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new todo..."
            style={styles.input}
            disabled={loading}
          />
          <button type="submit" style={styles.addButton} disabled={loading || !title.trim()}>
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        <ul style={styles.todoList}>
          {todos.map((todo) => (
            <li key={todo.id} style={styles.todoItem}>
              <div style={styles.todoLeft}>
                <input
                  type="checkbox"
                  checked={todo.completed === 1}
                  onChange={() => toggleTodo(todo.id, todo.completed === 0)}
                  style={styles.checkbox}
                />
                <span style={{
                  ...styles.todoTitle,
                  textDecoration: todo.completed === 1 ? 'line-through' : 'none',
                  opacity: todo.completed === 1 ? 0.6 : 1,
                }}>
                  {todo.title}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                style={styles.deleteButton}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div style={styles.emptyState}>
            <p>No todos yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  authCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px',
  },
  loginButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  },
  appTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#666',
  },
  logoutButton: {
    background: '#f3f4f6',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  todoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  todoTitle: {
    fontSize: '16px',
    color: '#1f2937',
  },
  deleteButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#9ca3af',
  },
} as const;
