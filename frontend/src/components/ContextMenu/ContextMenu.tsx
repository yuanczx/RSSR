import React, { useEffect, useState, useRef } from "react";
import { IoIosRefresh } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { IoMdImages } from "react-icons/io";
import { IoMdArrowForward } from "react-icons/io";
import type { Feed, Group } from "../../types";
import { useTranslation } from "react-i18next";
import "./ContextMenu.css";

interface ContextMenuProps {
  x: number;
  y: number;
  type: "feed" | "group";
  data: Feed | Group;
  groups: Group[];
  onClose: () => void;
  onRefresh?: () => void;
  onMarkAllRead?: () => void;
  onToggleMedia?: () => void;
  onMoveToGroup?: (groupId: number | null) => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  data,
  groups,
  onClose,
  onRefresh,
  onMarkAllRead,
  onToggleMedia,
  onMoveToGroup,
  onDelete,
}) => {
  const [showGroupSubmenu, setShowGroupSubmenu] = useState(false);
  const submenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) {
        setShowGroupSubmenu(false);
      }
    };
    if (showGroupSubmenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGroupSubmenu]);

  const { t } = useTranslation();
  const handleItemClick = (action?: () => void) => {
    if (action) {
      action();
      onClose();
    }
  };

  const currentGroupId = type === "feed" ? (data as Feed).group_id : null;
  const availableGroups = groups.filter(g => g.id !== currentGroupId);

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

      {type === "feed" && onMoveToGroup && (
        <div 
          className="ctx-item has-submenu"
          onMouseEnter={() => setShowGroupSubmenu(true)}
          onMouseLeave={() => setShowGroupSubmenu(false)}
          ref={submenuRef}
        >
          <IoMdArrowForward size={16} />
          <span>{t("move_to_group")}</span>
          {showGroupSubmenu && (
            <div className="ctx-submenu">
              <div 
                className={`ctx-item ${currentGroupId === null ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleItemClick(() => onMoveToGroup?.(null)); }}
              >
                <span>{t("no_group")}</span>
              </div>
              {availableGroups.map(group => (
                <div 
                  key={group.id}
                  className={`ctx-item ${currentGroupId === group.id ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleItemClick(() => onMoveToGroup?.(group.id)); }}
                >
                  <span>{group.name}</span>
                </div>
              ))}
              {availableGroups.length === 0 && (
                <div className="ctx-item disabled">
                  <span>{t("no_other_groups")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(type === "feed" && (onRefresh || onMarkAllRead || onMoveToGroup)) && (
        <div className="ctx-sep" />
      )}

      {type === "group" && onToggleMedia && (
        <div className="ctx-item" onClick={() => handleItemClick(onToggleMedia)}>
          <IoMdImages size={16} />
          <span>{(data as Group).is_media ? t("remove_media_mode") : t("set_as_media")}</span>
        </div>
      )}

      {type === "group" && onToggleMedia && (
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

