'use client';

import { useState } from 'react';

type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [input, setInput] = useState('');

    const addTodo = () => {
        if (!input.trim()) return;
        setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);
        setInput('');
    };

    const toggleTodo = (id: number) => {
        setTodos(todos => todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
    };

    const removeTodo = (id: number) => {
        setTodos(todos => todos.filter(todo => todo.id !== id));
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
                />
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={addTodo}
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
                            onClick={() => toggleTodo(todo.id)}
                        >
                            {todo.text}
                        </div>
                        <button
                            className="ml-4 text-red-500 hover:text-red-700"
                            onClick={() => removeTodo(todo.id)}
                            aria-label="Delete"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
