import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "antd";
import "../styles/ResizableDrawer.css";

const ResizableDrawer = (props) => {
  const { height: initialHeight = 300, ...drawerProps } = props;
  const [isResizing, setIsResizing] = useState(false);
  const [height, setHeight] = useState(initialHeight);
  const resizeRef = useRef(null);

  const onMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection on mouse down
    e.stopPropagation();
    setIsResizing(true);

    document.body.style.overflow = "hidden";
  };

  const onMouseUp = () => {
    setIsResizing(false);

    // Restore text selection and scrolling
    document.body.style.userSelect = "";
    document.body.style.overflow = "";
  };

  const throttledResize = (e) => {
    if (!resizeRef.current) {
      resizeRef.current = requestAnimationFrame(() => {
        handleMouseMove(e);
        resizeRef.current = null;
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const windowHeight = window.innerHeight;
      const offsetBottom = windowHeight - e.clientY;
      const minHeight = 100;
      const maxHeight = 600;

      if (offsetBottom >= minHeight && offsetBottom <= maxHeight) {
        setHeight(offsetBottom);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", throttledResize);
      document.addEventListener("mouseup", onMouseUp);
    } else {
      document.removeEventListener("mousemove", throttledResize);
      document.removeEventListener("mouseup", onMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", throttledResize);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  return (
    <Drawer
      placement="bottom"
      height={height}
      styles={{ padding: 0, ...drawerProps.bodyStyle }}
      {...drawerProps}
    >
      <div className="resizable-line" onMouseDown={onMouseDown} />
      <div className="drawer-contents">{props.children}</div>
    </Drawer>
  );
};

export default ResizableDrawer;
