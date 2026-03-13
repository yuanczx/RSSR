import React, { useEffect } from "react";
import type { Feed, Group } from "../../types";
import "./ContextMenu.css";

interface ContextMenuProps {
  x: number;
  y: number;
  type: "feed" | "group";
  data: Feed | Group;
  onClose: () => void;
  onRefresh?: () => void;
  onMarkAllRead?: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  onClose,
  onRefresh,
  onMarkAllRead,
  onDelete,
}) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
  };

  return (
    <div
      className="ctx-menu"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {type === "feed" && onRefresh && (
        <div className="ctx-item" onClick={onRefresh}>
          ↻ Refresh Feed
        </div>
      )}

      {type === "feed" && onMarkAllRead && (
        <div className="ctx-item" onClick={onMarkAllRead}>
          ✓ Mark All Read
        </div>
      )}

      {type === "feed" && (onRefresh || onMarkAllRead) && (
        <div className="ctx-sep"></div>
      )}

      <div className="ctx-item danger" onClick={onDelete}>
        Delete {type === "feed" ? "Feed" : "Group"}
      </div>
    </div>
  );
};

export default ContextMenu;

