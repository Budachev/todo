'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

type TodoList = {
    id: string;
    title: string;
    isPublic: boolean;
    todos: Todo[];
};

type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

function Spinner() {
    return (
        <div className="flex justify-center items-center py-4">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
        </div>
    );
}

export default function Home() {
    const { data: session, status } = useSession();
    const [lists, setLists] = useState<TodoList[]>([]);
    const [selectedList, setSelectedList] = useState<TodoList | null>(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'created' | 'title'>('created');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch lists
    useEffect(() => {
        if (!session) return;
        fetch('/api/lists')
            .then(res => res.json())
            .then((data: TodoList[]) => {
                setLists(data);
                if (data.length > 0) setSelectedList(data[0]);
            });
    }, [session]);

    // Select list by id
    const selectList = (id: string) => {
        const list = lists.find(l => l.id === id) || null;
        setSelectedList(list);
    };

    // Create new list
    const createList = async () => {
        if (!newListTitle.trim()) return;
        setLoading(true);
        const res = await fetch('/api/lists', {
            method: 'POST',
            body: JSON.stringify({ title: newListTitle, isPublic }),
            headers: { 'Content-Type': 'application/json' },
        });
        const newList = await res.json();
        setLists(lists => [newList, ...lists]);
        setSelectedList(newList);
        setNewListTitle('');
        setIsPublic(false);
        setLoading(false);
    };

    // Add todo to selected list
    const addTodo = async () => {
        if (!input.trim() || !selectedList) return;
        setLoading(true);
        await fetch(`/api/lists/${selectedList.id}/todos`, {
            method: 'POST',
            body: JSON.stringify({ text: input.trim() }),
            headers: { 'Content-Type': 'application/json' },
        });
        // Получаем обновлённые списки
        const res = await fetch('/api/lists');
        const data: TodoList[] = await res.json();
        setLists(data);
        // Обновляем выбранный список
        const updated = data.find(l => l.id === selectedList.id) || null;
        setSelectedList(updated);
        setInput('');
        setLoading(false);
        inputRef.current?.focus();
    };

    const toggleTodo = async (todo: Todo) => {
        setLoading(true);
        await fetch(`/api/todos/${todo.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ completed: !todo.completed }),
            headers: { 'Content-Type': 'application/json' },
        });
        // Обновляем списки
        const res = await fetch('/api/lists');
        const data: TodoList[] = await res.json();
        setLists(data);
        const updated = data.find(l => l.id === selectedList?.id) || null;
        setSelectedList(updated);
        setLoading(false);
    };

    const deleteTodo = async (todo: Todo) => {
        setLoading(true);
        await fetch(`/api/todos/${todo.id}`, {
            method: 'DELETE',
        });
        // Обновляем списки
        const res = await fetch('/api/lists');
        const data: TodoList[] = await res.json();
        setLists(data);
        const updated = data.find(l => l.id === selectedList?.id) || null;
        setSelectedList(updated);
        setLoading(false);
    };

    const deleteList = async (listId: string) => {
        if (!confirm('Удалить этот список?')) return;
        setLoading(true);
        await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
        // Получаем обновлённые списки
        const res = await fetch('/api/lists');
        const data: TodoList[] = await res.json();
        setLists(data);
        // Если удалён выбранный — выбрать первый из оставшихся
        if (selectedList?.id === listId) {
            setSelectedList(data[0] || null);
        }
        setLoading(false);
    };

    const filteredLists = lists
        .filter(l => l.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
            sort === 'title'
                ? a.title.localeCompare(b.title)
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    // if (status === 'loading' || loading) {
    //     return <Spinner />;
    // }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl mb-4">Войдите через Google</h1>
                <button
                    onClick={() => signIn('google')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Войти с Google
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Mobile sidebar toggle */}
            <button className="md:hidden p-4 text-blue-600" onClick={() => setSidebarOpen(v => !v)}>
                {sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    bg-white shadow p-4 flex flex-col
                    md:w-64 w-full
                    md:static fixed top-0 left-0 z-20
                    h-full md:h-auto
                    transition-transform duration-200
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
                style={{ maxWidth: 320 }}
            >
                {/* Кнопка закрытия на мобильных */}
                <button className="md:hidden mb-4 text-right text-red-500" onClick={() => setSidebarOpen(false)}>
                    ✕
                </button>
                <h2 className="text-xl font-bold mb-4">Ваши списки</h2>

                <div className="mb-3">
                    <div className="flex gap-2 mb-2">
                        <input
                            className="w-full px-2 py-1 border rounded"
                            placeholder="Новый список"
                            value={newListTitle}
                            onChange={e => setNewListTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createList()}
                            disabled={loading}
                        />
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                            onClick={createList}
                            disabled={loading}
                        >
                            +
                        </button>
                    </div>
                    <label className="flex items-center gap-1 text-xs mb-2">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                            disabled={loading}
                        />
                        публичный
                    </label>
                </div>

                <div className="flex gap-2 mb-2">
                    <input
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Поиск по названию"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="mb-2">
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value as 'created' | 'title')}
                        className="w-full px-2 py-1 border rounded"
                    >
                        <option value="created">Сначала новые</option>
                        <option value="title">По алфавиту</option>
                    </select>
                </div>
                <div className="mb-4 text-xs text-gray-500">
                    Всего списков: {lists.length} | Всего задач:{' '}
                    {lists.reduce((sum, l) => sum + (l.todos?.length || 0), 0)}
                </div>
                <ul className="flex-1 overflow-y-auto">
                    {filteredLists.length === 0 && (
                        <li className="text-gray-400 text-center py-4">Нет списков. Создайте новый!</li>
                    )}
                    {filteredLists.map(list => (
                        <li
                            key={list.id}
                            className={`p-2 rounded cursor-pointer mb-1 flex items-center justify-between relative ${
                                selectedList?.id === list.id ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
                            }`}
                        >
                            {selectedList?.id === list.id && (
                                <span className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-l"></span>
                            )}
                            <span onClick={() => selectList(list.id)} className="flex-1 truncate pl-2">
                                {list.title}
                                {list.isPublic && <span className="ml-2 text-xs text-green-600">(публичный)</span>}
                            </span>

                            {list.owner?.email === session?.user?.email && (
                                <button
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    onClick={e => {
                                        e.stopPropagation();
                                        deleteList(list.id);
                                    }}
                                    title="Удалить список"
                                    disabled={loading}
                                >
                                    ✕
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => signOut()}
                    className="mt-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 w-full"
                >
                    Выйти
                </button>
            </aside>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main */}
            <main className="flex-1 p-4 md:p-8">
                {selectedList ? (
                    <>
                        <h1 className="text-2xl font-bold mb-4">{selectedList.title}</h1>
                        <div className="flex gap-2 mb-6 max-w-lg">
                            <input
                                className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                type="text"
                                placeholder="Добавить задачу..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTodo()}
                                disabled={loading}
                                ref={inputRef}
                            />
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                onClick={addTodo}
                                disabled={loading}
                            >
                                Добавить
                            </button>
                        </div>
                        <ul className="max-w-lg space-y-2">
                            {selectedList.todos && selectedList.todos.length === 0 && (
                                <li className="text-gray-400 text-center">Нет задач!</li>
                            )}
                            {selectedList.todos &&
                                selectedList.todos.map(todo => (
                                    <li
                                        key={todo.id}
                                        className="flex items-center justify-between bg-white rounded shadow px-4 py-2"
                                    >
                                        <div
                                            className={`flex-1 cursor-pointer select-none ${
                                                todo.completed ? 'line-through text-gray-400' : ''
                                            }`}
                                            onClick={() => toggleTodo(todo)}
                                            title="Отметить как выполнено"
                                        >
                                            {todo.text}
                                        </div>
                                        <button
                                            className="ml-4 text-red-500 hover:text-red-700"
                                            onClick={() => deleteTodo(todo)}
                                            aria-label="Удалить"
                                            disabled={loading}
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                        </ul>

                        {selectedList?.sharedWith && selectedList.sharedWith.length > 0 && (
                            <div className="mb-4">
                                <div className="font-semibold mb-1">Доступ имеют:</div>
                                <ul>
                                    {selectedList.sharedWith.map(user => (
                                        <li key={user.email} className="flex items-center gap-2">
                                            <span>{user.email}</span>
                                            {selectedList.owner?.email === session?.user?.email && (
                                                <button
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                    onClick={async () => {
                                                        if (!confirm(`Убрать доступ у ${user.email}?`)) return;
                                                        setLoading(true);
                                                        const res = await fetch(
                                                            `/api/lists/${selectedList.id}/unshare`,
                                                            {
                                                                method: 'POST',
                                                                body: JSON.stringify({ email: user.email }),
                                                                headers: { 'Content-Type': 'application/json' },
                                                            }
                                                        );
                                                        setLoading(false);
                                                        if (res.ok) {
                                                            // Обновить списки и выбранный список
                                                            const res = await fetch('/api/lists');
                                                            const data: TodoList[] = await res.json();
                                                            setLists(data);
                                                            const updated =
                                                                data.find(l => l.id === selectedList.id) || null;
                                                            setSelectedList(updated);
                                                        } else {
                                                            const { error } = await res.json();
                                                            alert(error || 'Ошибка');
                                                        }
                                                    }}
                                                    disabled={loading}
                                                >
                                                    убрать
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedList && (
                            <form
                                className="flex gap-2 mb-4"
                                onSubmit={async e => {
                                    e.preventDefault();
                                    const email = prompt('Email пользователя для доступа к списку:');
                                    if (!email) return;
                                    setLoading(true);
                                    const res = await fetch(`/api/lists/${selectedList.id}/share`, {
                                        method: 'POST',
                                        body: JSON.stringify({ email }),
                                        headers: { 'Content-Type': 'application/json' },
                                    });
                                    setLoading(false);
                                    if (res.ok) {
                                        alert('Пользователь приглашён!');
                                    } else {
                                        const { error } = await res.json();
                                        alert(error || 'Ошибка');
                                    }
                                }}
                            >
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                    disabled={loading}
                                >
                                    Пригласить пользователя
                                </button>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="text-gray-400">Выберите или создайте список</div>
                )}
            </main>
        </div>
    );
}
