import { Tabs as AntdTabs } from "antd";
import InstanceList from "./InstanceList";
import ModelList from "./ModelList";

const ModelsInstancesList = () => {
  return (
    <div>
      <AntdTabs
        items={[
          {
            label: "Models",
            key: "models",
            children: <ModelList />,
          },
          {
            label: "Instances",
            key: "instances",
            children: <InstanceList />,
          },
        ]}
      />
    </div>
  );
};

export default ModelsInstancesList;
