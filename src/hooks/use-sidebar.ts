import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useRef } from "react";

type SidebarStore = {
  isOpen: boolean;
  isResetting: boolean;
  defaultWidth: number;
  currentWidth: number | null;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement> | MouseEvent, ref: React.RefObject<HTMLDivElement>) => void;
  setWidth: (width: number) => void;
};

export const useSidebar = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isOpen: true,
      isResetting: false,
      defaultWidth: 240,
      currentWidth: 240,

      onOpen: () => {
        const { defaultWidth } = get();
        set({ 
          isOpen: true,
          currentWidth: defaultWidth 
        });
      },

      onClose: () => {
        set({ 
          isOpen: false,
          currentWidth: 60 
        });
      },

      onToggle: () => {
        const { isOpen, onOpen, onClose } = get();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
      },

      setWidth: (width) => {
        set({ currentWidth: width });
      },

      onMouseDown: (event, ref) => {
        event.preventDefault();
        event.stopPropagation();

        if (!ref.current) return;
        const startX = event.clientX;
        const startWidth = ref.current.offsetWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!ref.current) return;

          let newWidth = startWidth + (moveEvent.clientX - startX);

          // Set minimum and maximum widths
          newWidth = Math.max(60, Math.min(480, newWidth));
          
          ref.current.style.width = `${newWidth}px`;
          // Only update the width in state if sidebar is open
          if (get().isOpen) {
            get().setWidth(newWidth);
          }
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          
          // After resizing, ensure the state is consistent
          const currentWidth = ref.current?.offsetWidth;
          if (currentWidth && currentWidth > 60) {
            set({ isOpen: true, currentWidth });
          }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
    }),
    {
      name: "sidebar-storage", // unique name for localStorage
      skipHydration: true // Skip hydration to prevent SSR issues
    }
  )
);

export const useSidebarSync = (ref: React.RefObject<HTMLDivElement>) => {
  const { isOpen, currentWidth, setWidth, onMouseDown, onOpen, onClose } = useSidebar();
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    
    const sidebarElement = ref.current;
    let initialWidth = currentWidth;
    
    // Set initial width based on isOpen state
    if (isOpen) {
      if (!initialWidth || initialWidth <= 60) {
        initialWidth = 240; // Default width when opening
        setWidth(initialWidth);
      }
      sidebarElement.style.width = `${initialWidth}px`;
      sidebarElement.style.minWidth = '240px';
      sidebarElement.style.transition = 'width 0.2s ease-in-out';
    } else {
      sidebarElement.style.width = '60px';
      sidebarElement.style.minWidth = '60px';
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !ref.current) return;
      
      const newWidth = Math.max(240, Math.min(480, e.clientX - startX.current + startWidth.current));
      ref.current.style.width = `${newWidth}px`;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Ensure the sidebar state is consistent after resizing
      if (ref.current) {
        const newWidth = ref.current.offsetWidth;
        if (newWidth > 60) {
          setWidth(newWidth);
          // If width is greater than 60px, ensure sidebar is marked as open
          if (!isOpen) {
            onOpen();
          }
        } else if (isOpen) {
          onClose();
        }
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0 || !ref.current) return; // Only left mouse button
      
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = ref.current.offsetWidth;
      document.body.style.cursor = 'col-resize';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.top = '0';
    resizeHandle.style.right = '-4px';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.width = '8px';
    resizeHandle.style.cursor = 'col-resize';
    resizeHandle.style.zIndex = '50';
    
    const handleResizeMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleMouseDown(e as unknown as React.MouseEvent);
    };
    
    resizeHandle.addEventListener('mousedown', handleResizeMouseDown);

    sidebarElement.style.position = 'relative';
    sidebarElement.appendChild(resizeHandle);

    return () => {
      if (resizeHandle.parentNode === sidebarElement) {
        sidebarElement.removeChild(resizeHandle);
      }
      resizeHandle.removeEventListener('mousedown', handleResizeMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [ref, isOpen, currentWidth, setWidth]);

  // Update the width when isOpen or currentWidth changes
  useEffect(() => {
    if (!ref.current) return;
    
    if (isOpen) {
      ref.current.style.width = `${currentWidth || 240}px`;
      ref.current.style.minWidth = '240px';
    } else {
      ref.current.style.width = '60px';
      ref.current.style.minWidth = '60px';
    }
  }, [isOpen, currentWidth, ref]);

  return null;
};