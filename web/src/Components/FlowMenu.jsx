import FlowList from "./FlowList";
import { Card, Typography } from "antd";

const FlowMenu = (props) => {
  return (
    <Card style={{ marginTop: 24 }}>
      <div style={{ margin: -16 }}>
        <Typography.Title level={3}>Flow Menu</Typography.Title>
        <Typography.Text type="secondary">Control your flows.</Typography.Text>
        <div style={{ paddingTop: "20px" }}>
          <FlowList {...props} />
        </div>
      </div>
    </Card>
  );
};

export default FlowMenu;
