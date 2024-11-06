import { useState } from "react";
import ModelsInstancesList from "./ModelsInstancesList";
import { Card, Typography, Modal } from "antd";
import JMESPathTester from "./JMESPathTester";

const ModelMenu = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to open the modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <Card style={{ marginTop: 24 }}>
      <div style={{ margin: -16 }}>
        <Typography.Title level={3}>Modelling Menu</Typography.Title>
        <Typography.Text type="secondary">
          Define your data models and instances{" "}
          <Typography.Link onClick={showModal}>using JMESPath.</Typography.Link>
        </Typography.Text>
        <div className="FlowMenu" style={{ paddingTop: "20px" }}>
          <ModelsInstancesList />
        </div>
      </div>


      {/* Ant Design Modal */}
      <Modal
        title="JMESPath Tester"
        visible={isModalVisible}
        onCancel={handleCloseModal}
        footer={null} // Remove footer if no buttons needed
      >
        <JMESPathTester />
      </Modal>      
    </Card>
  );
};

export default ModelMenu;
