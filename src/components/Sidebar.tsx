'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  sortOrder: number;
}

export default function Sidebar() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGroups(data);
        setError('');
      } else {
        setGroups([]);
        setError(data.error || '获取分组失败');
      }
    } catch (e) {
      setGroups([]);
      setError('获取分组失败');
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!res.ok) throw new Error('添加失败');
      setNewGroupName('');
      fetchGroups();
    } catch (e) {
      setError('添加分组失败');
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroupName }),
      });
      if (!res.ok) throw new Error('修改失败');
      setEditingGroupId(null);
      setEditingGroupName('');
      fetchGroups();
    } catch (e) {
      setError('修改分组失败');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('确定要删除该分组吗？')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      fetchGroups();
    } catch (e) {
      setError('删除分组失败');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">分组管理</h2>
        <form onSubmit={handleAddGroup} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="新分组名称"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <button type="submit" className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">添加</button>
        </form>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y">
          {Array.isArray(groups) && groups.map(group => (
            <li key={group.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
              {editingGroupId === group.id ? (
                <>
                  <input
                    type="text"
                    value={editingGroupName}
                    onChange={e => setEditingGroupName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded-md text-sm"
                  />
                  <button className="ml-2 text-green-600" onClick={() => handleUpdateGroup(group.id)}>保存</button>
                  <button className="ml-2 text-gray-500" onClick={() => setEditingGroupId(null)}>取消</button>
                </>
              ) : (
                <>
                  <span className="font-medium">{group.name}</span>
                  <div className="flex gap-2">
                    <button className="text-blue-500" onClick={() => handleEditGroup(group)}>重命名</button>
                    <button className="text-red-500" onClick={() => handleDeleteGroup(group.id)}>删除</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 