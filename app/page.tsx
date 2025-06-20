'use client';

import { useEffect, useState } from 'react';

type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch todos from backend
    useEffect(() => {
        fetch('/api/todos')
            .then(res => res.json())
            .then(setTodos);
    }, []);

    const addTodo = async () => {
        if (!input.trim()) return;
        setLoading(true);
        const res = await fetch('/api/todos', {
            method: 'POST',
            body: JSON.stringify({ text: input.trim() }),
            headers: { 'Content-Type': 'application/json' },
        });
        const newTodo = await res.json();
        setTodos(todos => [...todos, newTodo]);
        setInput('');
        setLoading(false);
    };

    const toggleTodo = async (id: number, completed: boolean) => {
        setLoading(true);
        await fetch('/api/todos', {
            method: 'PATCH',
            body: JSON.stringify({ id, completed: !completed }),
            headers: { 'Content-Type': 'application/json' },
        });
        setTodos(todos => todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
        setLoading(false);
    };

    const removeTodo = async (id: number) => {
        setLoading(true);
        await fetch('/api/todos', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' },
        });
        setTodos(todos => todos.filter(todo => todo.id !== id));
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">My Todo List</h1>
            <div className="flex gap-2 mb-6 w-full max-w-md">
                <input
                    className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    type="text"
                    placeholder="Add a new task..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    disabled={loading}
                />
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={addTodo}
                    disabled={loading}
                >
                    Add
                </button>
            </div>
            <ul className="w-full max-w-md space-y-2">
                {todos.length === 0 && <li className="text-gray-400 text-center">No todos yet!</li>}
                {todos.map(todo => (
                    <li key={todo.id} className="flex items-center justify-between bg-white rounded shadow px-4 py-2">
                        <div
                            className={`flex-1 cursor-pointer select-none ${
                                todo.completed ? 'line-through text-gray-400' : ''
                            }`}
                            onClick={() => toggleTodo(todo.id, todo.completed)}
                        >
                            {todo.text}
                        </div>
                        <button
                            className="ml-4 text-red-500 hover:text-red-700"
                            onClick={() => removeTodo(todo.id)}
                            aria-label="Delete"
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
