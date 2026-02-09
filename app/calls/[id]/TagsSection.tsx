"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

interface TagsSectionProps {
  callId: string;
}

export default function TagsSection({ callId }: TagsSectionProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [callId]);

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/calls/${callId}/tags`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to add tag");
        return;
      }

      const newTag = await res.json();
      setTags([...tags, newTag]);
      setNewTagName("");
      setShowInput(false);
    } catch (error) {
      console.error("Error adding tag:", error);
      alert("Failed to add tag");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/calls/${callId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove tag");

      setTags(tags.filter((tag) => tag.id !== tagId));
    } catch (error) {
      console.error("Error removing tag:", error);
      alert("Failed to remove tag");
    }
  };

  return (
    <div className="rounded-xl border border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Tags
        </h3>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="text-sm text-[#ff6b35] hover:underline"
          >
            + Add Tag
          </button>
        )}
      </div>

      {/* Add Tag Form */}
      {showInput && (
        <form onSubmit={handleAddTag} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              className="flex-1 rounded-lg border border bg-white px-3 py-2 text-sm text-foreground placeholder-[#999] focus:border-[#ff6b35] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !newTagName.trim()}
              className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setNewTagName("");
              }}
              className="rounded-lg border border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tags List */}
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags yet. Add tags to organize and categorize this call.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: tag.color || "#999" }}
            >
              <span>{tag.name}</span>
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
