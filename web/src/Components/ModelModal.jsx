import { Modal as AntdModal, Divider } from "antd";
import ModelEditor from "./ModelEditor";

const ModelModal = ({ show, handleClose, modelName, modelId }) => {
  return (
    <AntdModal
      open={show}
      onClose={handleClose}
      onCancel={handleClose}
      centered
      title={modelName}
      footer={null}
      width={"70%"}
    >
      <div className="w-full">
        <Divider />
        <ModelEditor model_id={modelId} handleClose={handleClose} />
      </div>
    </AntdModal>
  );
};

export default ModelModal;
