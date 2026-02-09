"use client";

import { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesSectionProps {
  callId: string;
}

export default function NotesSection({ callId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [callId]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/calls/${callId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to add note");
        return;
      }

      const newNote = await res.json();
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update note");

      const updatedNote = await res.json();
      setNotes(
        notes.map((note) => (note.id === noteId ? updatedNote : note))
      );
      setEditingNoteId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/calls/${callId}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete note");

      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
        Notes
      </h3>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mb-6">
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Add coaching notes, context, observations..."
          rows={3}
          className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#999] focus:border-[#ff6b35] focus:outline-none dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:text-white"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !newNoteContent.trim()}
            className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:opacity-50"
          >
            Save Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-sm text-[#666] dark:text-[#999]">
          No notes yet. Add notes to capture insights and coaching points.
        </p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-[#e5e5e5] p-4 dark:border-[#2a2a2a]"
            >
              {editingNoteId === note.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#ff6b35] focus:outline-none dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:text-white"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={loading}
                      className="rounded-lg bg-[#ff6b35] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNoteId(null);
                        setEditContent("");
                      }}
                      className="rounded-lg border border-[#e5e5e5] px-3 py-1 text-xs font-medium text-[#666] transition-colors hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-[#999] dark:hover:bg-[#1a1a1a]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-[#1a1a1a] dark:text-white">
                    {note.content}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#666] dark:text-[#999]">
                      {formatDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt && " (edited)"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditContent(note.content);
                        }}
                        className="text-xs text-[#ff6b35] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
