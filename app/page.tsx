'use client';

import { useEffect, useState } from 'react';
import { login, getToken, getUser, isAuthenticated, logout } from '@/lib/auth';

interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // 1. Get upload token
      const tokenRes = await fetch('/api/upload/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      });

      if (!tokenRes.ok) throw new Error('Failed to get upload token');
      const { uploadUrl, key, objectId } = await tokenRes.json();

      // 2. Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      // 3. Complete upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId })
      });

      if (!completeRes.ok) throw new Error('Failed to complete upload');

      return key;
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
      return null;
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      let imageKey = null;
      if (selectedFile) {
        imageKey = await uploadImage(selectedFile);
        if (!imageKey && selectedFile) {
          // If upload failed, stop (alert already shown)
          setLoading(false);
          return;
        }
      }

      const token = getToken();
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          imageUrl: imageKey
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos([data.todo, ...todos]);
        setTitle('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(todos.map((t) => (t.id === id ? data.todo : t)));
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const toggleTodo = (id: string, completed: boolean) => {
    updateTodo(id, { completed: completed ? 1 : 0 });
  };

  const removeImage = async (id: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return;
    await updateTodo(id, { image_url: undefined }); // 'undefined' won't work with JSON.stringify, API needs null or specific key check
    // Actually our API checks for imageUrl property in body.
    // Let's pass imageUrl: null explicitly.
    try {
      const token = getToken();
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: null }), // Send null to remove
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(todos.map((t) => (t.id === id ? data.todo : t)));
      }
    } catch (error) {
      console.error('Failed to remove image:', error);
    }
  };

  const replaceImage = async (id: string, file: File) => {
    // Show loading state for specific todo? simpler to just use global loading for now or optimistically update ui
    const key = await uploadImage(file);
    if (key) {
      await updateTodo(id, { image_url: key, imageUrl: key } as any);
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
      {previewImage && (
        <div style={styles.modalOverlay} onClick={() => setPreviewImage(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={previewImage} style={styles.modalImage} alt="Preview" />
            <button onClick={() => setPreviewImage(null)} style={styles.closeModal}>✕</button>
          </div>
        </div>
      )}

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

        <form onSubmit={addTodo} style={styles.formColumn}>
          <div style={styles.inputGroup}>
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
          </div>

          <div style={styles.uploadGroup}>
            <label style={styles.fileLabel}>
              <span style={{ marginRight: '8px' }}>📸</span>
              {selectedFile ? selectedFile.name : 'Attach Image (Optional)'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </label>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                style={styles.clearFileButton}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        <ul style={styles.todoList}>
          {todos.map((todo) => (
            <li key={todo.id} style={styles.todoItem}>
              <div style={styles.todoContent}>
                <div style={styles.todoHeader}>
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
                  <div style={styles.actions}>
                    {todo.image_url && (
                      <button
                        onClick={() => removeImage(todo.id)}
                        style={styles.actionButton}
                        title="Remove Image"
                      >
                        🗑️ Img
                      </button>
                    )}
                    <label style={{ cursor: 'pointer', display: 'flex' }} title="Replace Image">
                      <span style={styles.actionButton}>🔄 Img</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) replaceImage(todo.id, file);
                        }}
                      />
                    </label>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      style={styles.deleteButton}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {todo.image_url && (
                  <div style={styles.imageContainer}>
                    <img
                      src={`https://api-kconsole.koompi.cloud/storage/${todo.image_url}`} // TODO: Use dynamic bucket domain if possible, or proxy
                      // Actually based on previous steps we used a specific domain. Let's revert to generic or the one user likely has.
                      // Ideally this domain comes from env or config. 
                      // For now let's assume standard format: https://<bucket>.koompi.cloud/<key> or similar
                      // Based on previous code: src={`https://storage.koompi.cloud/${todo.image_url}`}
                      // Let's stick to what was there: https://storage.koompi.cloud/${todo.image_url} 
                      // Wait, previous code had: src={`https://kconsole-storage.koompi.cloud/${todo.image_url}`} in one version.
                      // Let's use relative path if we have a proxy, or the storage URL. 
                      // Reverting to previous: https://storage.koompi.cloud/${todo.image_url} assuming that's the public URL.
                      // Actually, let's use the one from previous read: https://storage.koompi.cloud/${todo.image_url}
                      alt="Todo attachment"
                      style={styles.todoImage}
                      loading="lazy"
                      onClick={() => setPreviewImage(`https://storage.koompi.cloud/${todo.image_url}`)}
                    />
                  </div>
                )}
              </div>
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
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    position: 'relative' as const,
    maxWidth: '90%',
    maxHeight: '90vh',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  closeModal: {
    position: 'absolute' as const,
    top: '-40px',
    right: 0,
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  authCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
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
  formColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
  },
  inputGroup: {
    display: 'flex',
    gap: '8px',
  },
  uploadGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fileLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4b5563',
    cursor: 'pointer',
    border: '1px dashed #d1d5db',
    transition: 'all 0.2s',
  },
  clearFileButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
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
  todoContent: {
    width: '100%',
  },
  todoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '12px',
  },
  todoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionButton: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
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
  imageContainer: {
    marginTop: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
    maxWidth: '100%',
    cursor: 'pointer' as const,
  },
  todoImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    objectFit: 'contain' as const,
    display: 'block',
    transition: 'transform 0.2s',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: '#9ca3af',
  },
} as const;
