import { useEffect, useState } from 'react';
import { handleCallback, isAuthenticated, getUser, logout } from './auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're on the callback page
    if (window.location.pathname === '/auth/callback') {
      const result = handleCallback();
      if (result?.user) {
        setUser(result.user);
        window.location.href = '/';
      }
      return;
    }

    // Check for existing user
    if (isAuthenticated()) {
      const storedUser = getUser();
      setUser(storedUser);
      fetchTodos();
    }
    setLoading(false);
  }, []);

  const fetchTodos = async () => {
    try {
      const { api } = await import('./auth');
      const data = await api.get('/api/todos');
      setTodos(data.todos || []);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const { api } = await import('./auth');
      const data = await api.post('/api/todos', { title: newTodo });
      setTodos([...todos, data.todo]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { api } = await import('./auth');
      await api.put(`/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { api } = await import('./auth');
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo App</h1>
            <p className="text-gray-500">A simple full-stack todo list with KConsole OAuth</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              This app uses <strong>KOOMPI ID</strong> for authentication.
              Your data is stored securely with your account.
            </p>
          </div>

          <button
            onClick={() => {
              (window as any).login?.();
            }}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Login with KOOMPI ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Todo App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.fullname || user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Add Todo */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={addTodo}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No todos yet. Add one above!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
        <p>Powered by <a href="https://kconsole.koompi.cloud" className="text-primary-600 hover:underline">KConsole</a></p>
      </footer>
    </div>
  );
}

export default App;
