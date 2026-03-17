import React, { useEffect } from "react";
import { IoIosRefresh } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import type { Feed, Group } from "../../types";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const handleItemClick = (action?: () => void) => {
    if (action) {
      action();
      onClose();
    }
  };

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
        <div className="ctx-item" onClick={() => handleItemClick(onRefresh)}>
          <IoIosRefresh size={16} />
          <span>{t("refresh_feed")}</span>
        </div>
      )}

      {type === "feed" && onMarkAllRead && (
        <div className="ctx-item" onClick={() => handleItemClick(onMarkAllRead)}>
          <IoCheckmarkDoneOutline />
          <span>{t("mark_all_read")}</span>
        </div>
      )}

      {type === "feed" && (onRefresh || onMarkAllRead) && (
        <div className="ctx-sep" />
      )}

      <div className="ctx-item danger" onClick={() => handleItemClick(onDelete)}>
        <MdDelete />
        <span>{t("delete")}{type === "feed" ? t("feed") : t("group")}</span>
      </div>
    </div>
  );
};

export default ContextMenu;

