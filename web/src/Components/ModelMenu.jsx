import ModelsInstancesList from "./ModelsInstancesList";
import { Card, Typography } from "antd";

const ModelMenu = () => {
  return (
    <Card style={{ marginTop: 24 }}>
      <div style={{ margin: -16 }}>
        <Typography.Title level={3}>Modelling Menu</Typography.Title>
        <Typography.Text type="secondary">
          Define your data models and instances.
        </Typography.Text>
        <div className="FlowMenu" style={{ paddingTop: "20px" }}>
          <ModelsInstancesList />
        </div>
      </div>
    </Card>
  );
};

export default ModelMenu;
