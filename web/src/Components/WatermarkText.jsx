import { Typography } from "antd";

const WatermarkText = ({ text }) => {
  return (
      <Typography.Text
        style={{
          position: "relative",
          top: "10px", // Adjust top margin to be smaller
          left: "10px", // Adjust left margin to be smaller
          fontSize: "12px", // Smaller font size
          color: "grey", // More transparent text
          pointerEvents: "none", // prevent interactions with the watermark
          userSelect: "none", // prevent text selection
        }}
      >
        {text}
      </Typography.Text>
  );
};

export default WatermarkText;