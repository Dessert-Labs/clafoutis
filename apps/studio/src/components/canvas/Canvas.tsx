import React from "react";

export const Canvas = React.forwardRef<HTMLCanvasElement>((_props, ref) => (
  <canvas
    ref={ref}
    className="h-full w-full cursor-crosshair"
    style={{ display: "block" }}
  />
));
Canvas.displayName = "Canvas";
